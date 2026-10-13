import {Item,recordSchema,fresh,today} from "./crm";
export const normalize=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
export function username(input:string){let value=input.trim();if(/^https?:\/\//i.test(value)){const u=new URL(value);if(!["instagram.com","www.instagram.com"].includes(u.hostname.toLowerCase()))throw Error("Use um perfil do Instagram.");const parts=u.pathname.split("/").filter(Boolean);if(parts.length!==1)throw Error("Informe a URL do perfil, não de uma publicação.");value=parts[0];}value=value.replace(/^@/,"").toLowerCase();if(!/^[a-z0-9._]{1,30}$/.test(value)||["p","reel","reels","stories","explore","accounts"].includes(value))throw Error("Perfil do Instagram inválido.");return value;}
export async function prospectId(owner:string,handle:string,type="profile"){const bytes=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(owner+"|instagram|"+handle+"|"+type)));bytes[6]=(bytes[6]&15)|80;bytes[8]=(bytes[8]&63)|128;const h=Array.from(bytes.slice(0,16),b=>b.toString(16).padStart(2,"0")).join("");return h.slice(0,8)+"-"+h.slice(8,12)+"-"+h.slice(12,16)+"-"+h.slice(16,20)+"-"+h.slice(20);}
const gap=(a:string,b:string)=>(Date.parse(a+"T12:00:00Z")-Date.parse(b+"T12:00:00Z"))/86400000;
export function activity(p:Item,day=today()){
 const samples=[...new Set(p.postDates.map(d=>d.slice(0,10)).filter(d=>d<=day))].sort();
 const last=[p.lastPost,...samples].filter(Boolean).sort().at(-1)||"";
 const age=last?gap(day,last):null;
 const state=age===null?"Desconhecida":age<=14?"Ativo":age<=30?"Pouco recente":"Sem postagem recente";
 const timestamps=[...new Set(p.postDates.map(d=>Date.parse(d)).filter(d=>Number.isFinite(d)&&d<=Date.parse(day+"T23:59:59Z")))].sort((a,b)=>a-b);
 const span=timestamps.length>1?(timestamps.at(-1)!-timestamps[0])/86400000:0;
 const rate=span>=1?Math.round((timestamps.length-1)*7/span*10)/10:null;
 return {state,last,age,rate,frequency:rate===null?"Sem amostra":rate>=4?"Alta":rate>=1?"Moderada":"Baixa",sample:timestamps.length,stale:!p.observedAt||gap(day,p.observedAt)>7};
}
export function matches(p:Item,q:Pick<Item,"niche"|"country"|"region"|"minFollowers"|"maxFollowers"|"activityFilter">){
 return p.followers>=Math.max(200001,q.minFollowers)&&(!q.maxFollowers||p.followers<=q.maxFollowers)&&(!q.niche||normalize([p.niche,p.biography,p.name].join(" ")).includes(normalize(q.niche)))&&(!q.country||normalize(p.country).includes(normalize(q.country)))&&(!q.region||normalize(p.region).includes(normalize(q.region)))&&(q.activityFilter==="Todas"||activity(p).state===q.activityFilter);
}
export function parseFile(text:string){
 if(text.length>2000000)throw Error("O arquivo deve ter até 2 MB.");
 const raw=text.replace(/^\uFEFF/,"").trim();
 if(raw.startsWith("[")||raw.startsWith("{")){const p=JSON.parse(raw);const rows=Array.isArray(p)?p:p.items;if(!Array.isArray(rows))throw Error("O JSON deve conter uma lista de perfis.");if(rows.length>200)throw Error("Importe até 200 perfis por vez.");return rows;}
 const delimiter=(raw.split(/\r?\n/)[0].match(/;/g)||[]).length>(raw.split(/\r?\n/)[0].match(/,/g)||[]).length?";":",";
 const rows:string[][]=[];let row:string[]=[],cell="",quoted=false;
 for(let n=0;n<raw.length;n++){const c=raw[n];if(c==='"'){if(quoted&&raw[n+1]==='"'){cell+='"';n++;}else quoted=!quoted;}else if(c===delimiter&&!quoted){row.push(cell);cell="";}else if((c==="\n"||c==="\r")&&!quoted){if(c==="\r"&&raw[n+1]==="\n")n++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell="";}else cell+=c;}
 if(quoted)throw Error("CSV com aspas sem fechamento.");
 row.push(cell);if(row.some(Boolean))rows.push(row);const header=rows.shift()?.map(h=>h.trim());if(!header?.includes("username"))throw Error("O CSV precisa da coluna username.");
 if(rows.length>200)throw Error("Importe até 200 perfis por vez.");
 return rows.map(r=>Object.fromEntries(header.map((h,i)=>[h,r[i]||""])));
}
export function importProfile(raw:any,observedAt:string):Item{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))throw Error("Linha inválida.");
 if(raw.private===true||raw.isPrivate===true)throw Error("Perfil privado.");
 const handle=username(String(raw.username||raw.url||""));
 const f=raw.followersCount??raw.followers;
 if(f==null||f===""||!/^\d+$/.test(String(f)))throw Error("Número de seguidores ausente ou inválido (use número inteiro).");
 const followers=Number(f);if(followers<=200000)throw Error("Abaixo do corte de mais de 200 mil seguidores.");
 const dates=Array.isArray(raw.latestPosts)?raw.latestPosts.map((p:any)=>p.timestamp).filter((s:any)=>typeof s==="string"&&Number.isFinite(Date.parse(s))).slice(0,60).map((s:string)=>new Date(s).toISOString()):[];
 const last=dates.map((s:string)=>s.slice(0,10)).sort().at(-1)||String(raw.lastPost||"");
 const result=recordSchema.safeParse({...fresh("prospects"),name:String(raw.fullName||raw.name||handle),username:handle,followers,niche:String(raw.niche||raw.businessCategoryName||""),country:String(raw.country||raw.about?.country||""),region:String(raw.region||""),locationEvidence:String(raw.locationEvidence||""),biography:String(raw.biography||""),lastPost:last,postDates:dates,observedAt:String(raw.observedAt||observedAt),dataSource:"Importação"});
 if(!result.success)throw Error(result.error.issues[0].message);return result.data;
}
export function providerInput(campaign:Item){return {search:[campaign.niche,campaign.country,campaign.region].filter(Boolean).join(" "),searchType:"user",resultsType:"details",searchLimit:campaign.searchLimit};}

