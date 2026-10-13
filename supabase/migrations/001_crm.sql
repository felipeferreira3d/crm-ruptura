-- Run once in a NEW Supabase project. No customer/sample data.
begin;
create table public.crm_workspaces(id uuid primary key default gen_random_uuid(),name text not null check(length(name) between 1 and 100),owner_id uuid not null references auth.users(id),created_at timestamptz not null default now());
create table public.crm_members(workspace_id uuid not null references public.crm_workspaces(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,email text not null,role text not null check(role in ('owner','member')),primary key(workspace_id,user_id));
create table public.crm_records(workspace_id uuid not null references public.crm_workspaces(id) on delete cascade,id uuid not null,kind text not null,data jsonb not null,version integer not null default 1,updated_at timestamptz not null default now(),primary key(workspace_id,id));
create index on public.crm_records(workspace_id,kind);
create table public.crm_invites(id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.crm_workspaces(id) on delete cascade,email text not null,token_hash text unique not null,expires_at timestamptz not null,created_at timestamptz not null default now());
create table public.crm_google(user_id uuid primary key references auth.users(id) on delete cascade,credentials text not null,calendar_id text,updated_at timestamptz not null default now());
create table public.crm_oauth_states(state_hash text primary key,user_id uuid not null references auth.users(id) on delete cascade,binding_hash text not null,expires_at timestamptz not null);
-- No direct browser access, even authenticated. API verifies user + membership.
alter table public.crm_workspaces enable row level security;
alter table public.crm_members enable row level security;
alter table public.crm_records enable row level security;
alter table public.crm_invites enable row level security;
alter table public.crm_google enable row level security;
alter table public.crm_oauth_states enable row level security;
revoke all on public.crm_workspaces,public.crm_members,public.crm_records,public.crm_invites,public.crm_google,public.crm_oauth_states from anon,authenticated;
grant all on public.crm_workspaces,public.crm_members,public.crm_records,public.crm_invites,public.crm_google,public.crm_oauth_states to service_role;
create function public.crm_create_workspace(p_user uuid,p_email text,p_name text) returns uuid language plpgsql set search_path=public as $$
declare w uuid;begin
perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
if (select count(*) from crm_workspaces where owner_id=p_user)>=10 then raise exception 'Limite de 10 espaços próprios.';end if;
insert into crm_workspaces(name,owner_id) values(p_name,p_user) returning id into w;
insert into crm_members values(w,p_user,p_email,'owner');return w;end;$$;
create function public.crm_save_record(p_workspace uuid,p_user uuid,p_item jsonb) returns jsonb language plpgsql set search_path=public as $$
declare old crm_records; v integer; result jsonb; ref text; k text; linked jsonb; fixed text[];begin
perform pg_advisory_xact_lock(hashtextextended(p_workspace::text,0));
if not exists(select 1 from crm_members where workspace_id=p_workspace and user_id=p_user) then raise exception 'Acesso ao espaço revogado.';end if;
v=(p_item->>'version')::int;
select * into old from crm_records where workspace_id=p_workspace and id=(p_item->>'id')::uuid;
if (v=0 and old.id is not null) or (v>0 and (old.id is null or old.version<>v or old.kind<>p_item->>'kind')) then raise exception 'Registro duplicado ou alterado em outra aba. Atualize os dados.';end if;
foreach k in array array['clientId','projectId','parentId'] loop
ref=p_item->>k;
if coalesce(ref,'')<>'' then
select data into linked from crm_records where workspace_id=p_workspace and id=ref::uuid and kind=case k when 'clientId' then 'clients' when 'projectId' then 'projects' else 'proposals' end;
if linked is null then raise exception 'Vínculo não encontrado neste espaço.';end if;
if k='projectId' and linked->>'clientId'<>p_item->>'clientId' then raise exception 'O projeto pertence a outro cliente.';end if;
end if;end loop;
if p_item->>'kind'='projects' and exists(select 1 from crm_records where workspace_id=p_workspace and kind in ('tasks','payments') and data->>'projectId'=p_item->>'id' and data->>'clientId'<>p_item->>'clientId') then raise exception 'O projeto possui vínculos com outro cliente.';end if;
if p_item->>'kind'='proposals' and old.id is not null and old.data->>'status'<>'Rascunho' then
fixed=array['name','clientId','clientSnapshot','clientEmail','studio','language','currency','lines','discount','introduction','scope','exclusions','timeline','paymentTerms','terms','revisions','validUntil','issuedAt','parentId'];
if p_item->>'status'='Rascunho' then raise exception 'Crie uma nova revisão da proposta.';end if;
foreach k in array fixed loop if old.data->k is distinct from p_item->k then raise exception 'Proposta enviada: use Nova revisão.';end if;end loop;
end if;
if p_item->>'kind'='prospects' then
if old.id is not null and old.data->>'username'<>p_item->>'username' then raise exception 'O perfil é fixo.';end if;
p_item=jsonb_set(p_item,'{prospectLeadId}',coalesce(old.data->'prospectLeadId','""'::jsonb));
end if;
result=jsonb_set(p_item,'{version}',to_jsonb(v+1));
insert into crm_records(workspace_id,id,kind,data,version) values(p_workspace,(result->>'id')::uuid,result->>'kind',result,v+1) on conflict(workspace_id,id) do update set data=excluded.data,version=excluded.version,updated_at=now();return result;
end;$$;
create function public.crm_convert_prospect(p_workspace uuid,p_user uuid,p_profile uuid,p_version int,p_lead jsonb) returns jsonb language plpgsql set search_path=public as $$
declare profile crm_records; lead jsonb; updated jsonb;begin
perform pg_advisory_xact_lock(hashtextextended(p_workspace::text,0));
if not exists(select 1 from crm_members where workspace_id=p_workspace and user_id=p_user) then raise exception 'Acesso revogado.';end if;
select * into profile from crm_records where workspace_id=p_workspace and id=p_profile and kind='prospects';
if profile.id is null then raise exception 'Perfil não encontrado.';end if;
if profile.data->>'status'='Descartado' then raise exception 'Requalifique o perfil.';end if;
select data into lead from crm_records where workspace_id=p_workspace and id=(p_lead->>'id')::uuid and kind='leads';
if lead is not null then return jsonb_build_object('items',jsonb_build_array(profile.data,lead),'existing',true);end if;
if profile.version<>p_version then raise exception 'O perfil mudou. Atualize os dados.';end if;
lead=jsonb_set(p_lead,'{version}','1');
insert into crm_records values(p_workspace,(lead->>'id')::uuid,'leads',lead,1,now());
updated=profile.data||jsonb_build_object('version',profile.version+1,'status','Qualificado','prospectLeadId',lead->>'id');
update crm_records set data=updated,version=version+1,updated_at=now() where workspace_id=p_workspace and id=p_profile;
return jsonb_build_object('items',jsonb_build_array(updated,lead),'existing',false);end;$$;
create function public.crm_accept_invite(p_hash text,p_user uuid,p_email text) returns uuid language plpgsql set search_path=public as $$
declare invitation crm_invites;begin
select * into invitation from crm_invites where token_hash=p_hash for update;
if invitation.id is null or invitation.expires_at<now() or lower(invitation.email)<>lower(p_email) then raise exception 'Convite inválido, expirado ou destinado a outro e-mail.';end if;
perform pg_advisory_xact_lock(hashtextextended(invitation.workspace_id::text,0));
insert into crm_members values(invitation.workspace_id,p_user,p_email,'member') on conflict do nothing;
delete from crm_invites where id=invitation.id;return invitation.workspace_id;end;$$;
create function public.crm_remove_member(p_workspace uuid,p_owner uuid,p_target uuid) returns void language plpgsql set search_path=public as $$
begin
perform pg_advisory_xact_lock(hashtextextended(p_workspace::text,0));
if not exists(select 1 from crm_workspaces where id=p_workspace and owner_id=p_owner) or p_target=p_owner then raise exception 'Ação não autorizada.';end if;
delete from crm_members where workspace_id=p_workspace and user_id=p_target;
end;$$;
revoke all on function public.crm_create_workspace(uuid,text,text),public.crm_save_record(uuid,uuid,jsonb),public.crm_convert_prospect(uuid,uuid,uuid,int,jsonb),public.crm_accept_invite(text,uuid,text),public.crm_remove_member(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.crm_create_workspace(uuid,text,text),public.crm_save_record(uuid,uuid,jsonb),public.crm_convert_prospect(uuid,uuid,uuid,int,jsonb),public.crm_accept_invite(text,uuid,text),public.crm_remove_member(uuid,uuid,uuid) to service_role;
commit;
