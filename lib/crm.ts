import { z } from "zod";
export const stages = ["Novo lead","Contatado","Respondeu","Call marcada","Proposta enviada","Negociação","Fechado","Perdido"];
export const kinds = ["clients","leads","projects","tasks","payments","proposals","services","templates","preferences","prospects","prospectSearches"] as const;
export type Kind = typeof kinds[number];
export const labels: Record<Kind,string> = {clients:"Cliente",leads:"Oportunidade",projects:"Projeto",tasks:"Tarefa",payments:"Lançamento",proposals:"Proposta",services:"Serviço",templates:"Modelo",preferences:"Preferências",prospects:"Perfil",prospectSearches:"Busca"};
export const statuses: Record<Kind,string[]> = {clients:["Prospect","Ativo","Inativo"],leads:stages,projects:["Planejamento","Em produção","Em revisão","Concluído","Pausado"],tasks:["Pendente","Concluída"],payments:["Previsto","Recebido","Pago","Cancelado"],proposals:["Rascunho","Enviada","Aprovada","Recusada","Expirada"],services:["Ativo","Arquivado"],templates:["Ativo","Arquivado"],preferences:["Ativo"],prospects:["Novo","Qualificado","Em contato","Descartado"],prospectSearches:["Salva","Planejada","Pausada"]};
const short = z.string().max(500);
const date=z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/).default("");
const lineSchema=z.object({id:z.string().uuid(),description:z.string().trim().min(1,"Descreva cada serviço.").max(300),quantity:z.number().int().min(1).max(1000),unitPrice:z.number().finite().min(0).max(999999999)});
export const recordSchema = z.object({
 id:z.string().uuid(), kind:z.enum(kinds), name:z.string().trim().min(1,"Informe o nome.").max(180),
 status:short, clientId:z.string().max(40).default(""), projectId:z.string().max(40).default(""),
 email:z.union([z.string().email(),z.literal("")]).default(""), phone:short.default(""),
 source:short.default(""), temperature:z.enum(["Quente","Morno","Frio"]).default("Morno"),
 amount:z.number().finite().min(0).max(999999999).default(0), currency:z.enum(["BRL","USD","EUR"]).default("BRL"),
 direction:z.enum(["Entrada","Saída"]).default("Entrada"), date,
 nextAction:short.default(""), responsible:short.default(""), notes:z.string().max(12000).default(""),
 link:z.union([z.string().url().refine(v=>/^https?:\/\//i.test(v)),z.literal("")]).default(""),
 revisions:z.number().int().min(0).max(100).default(0), version:z.number().int().min(0).default(0),
 language:z.enum(["pt","en"]).default("pt"), lines:z.array(lineSchema).max(60).default([]),
 discount:z.number().finite().min(0).max(999999999).default(0),
 clientSnapshot:short.default(""), clientEmail:short.default(""), studio:short.default(""),
 introduction:z.string().max(5000).default(""), scope:z.string().max(12000).default(""),
 exclusions:z.string().max(5000).default(""), terms:z.string().max(5000).default(""),
 timeline:z.string().max(3000).default(""), paymentTerms:z.string().max(3000).default(""),
 validUntil:date, issuedAt:date, parentId:z.string().max(40).default(""),
 category:z.enum(["Mensagem","Objeção: preço","Objeção: prazo","Objeção: estilo","Portfólio","Demo reel","Prompt"]).default("Mensagem"),
 templateText:z.string().max(12000).default(""),
 openingPt:z.string().max(5000).default(""), openingEn:z.string().max(5000).default(""),
 silenceDays:z.number().int().min(1).max(90).default(3), lastContact:date,
 username:z.string().max(30).default(""), followers:z.number().int().min(0).max(3000000000).default(0),
 niche:short.default(""),country:short.default(""),region:short.default(""),locationEvidence:short.default(""),
 observedAt:date,lastPost:date,postDates:z.array(z.string().datetime({offset:true})).max(60).default([]),
 biography:z.string().max(5000).default(""),priority:z.enum(["Alta","Normal","Baixa"]).default("Normal"),
 dataSource:z.enum(["Manual","Importação"]).default("Manual"),prospectLeadId:z.string().max(40).default(""),
 minFollowers:z.number().int().min(200001).max(3000000000).default(200001),
 maxFollowers:z.number().int().min(200001).max(3000000000).nullable().default(null),
 activityFilter:z.enum(["Todas","Ativo","Pouco recente","Sem postagem recente","Desconhecida"]).default("Todas"),
 dailyTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default("09:00"),
 searchLimit:z.number().int().min(1).max(100).default(25),
 waitingFor:z.enum(["Cliente","Minha equipe","Ninguém"]).default("Cliente")
}).superRefine((v,ctx)=>{
 const fail=(message:string,path:string)=>ctx.addIssue({code:"custom",message,path:[path]});
 if(!statuses[v.kind].includes(v.status))fail("Status inválido.","status");
 for(const field of ["date","validUntil","issuedAt","lastContact","observedAt","lastPost"] as const){
 const value=v[field];if(value){const d=new Date(value+"T12:00:00Z");if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==value)fail("Data inválida.",field);}
 }
 if(v.kind==="prospects"){
 if(!/^[a-z0-9._]{1,30}$/.test(v.username))fail("Informe um @ válido, sem espaços.","username");
 if(v.followers<=200000)fail("A prospecção aceita somente perfis com mais de 200 mil seguidores.","followers");
 if(!v.observedAt)fail("Informe a data da coleta dos dados.","observedAt");
 if(v.observedAt>today())fail("A coleta não pode ter data futura.","observedAt");
 if(v.lastPost&&v.lastPost>v.observedAt)fail("A última postagem não pode ser posterior à coleta.","lastPost");
 if(v.postDates.some(d=>d.slice(0,10)>v.observedAt))fail("A amostra contém postagem posterior à coleta.","postDates");
 }
 if(v.kind==="prospectSearches"){
 if(!v.niche.trim())fail("Informe um nicho ou palavra-chave.","niche");
 if(v.maxFollowers!==null&&v.maxFollowers<v.minFollowers)fail("O máximo deve ser maior que o mínimo.","maxFollowers");
 }
 if(v.kind==="payments" && ((v.direction==="Entrada"&&v.status==="Pago")||(v.direction==="Saída"&&v.status==="Recebido")))fail("Status incompatível com entrada/saída.","status");
 if(v.kind==="proposals"){
 const subtotal=v.lines.reduce((s,l)=>s+Math.round(l.unitPrice*100)*l.quantity,0);
 if(Math.round(v.discount*100)>subtotal)fail("O desconto não pode superar o subtotal.","discount");
 if(subtotal>99999999900)fail("O total ultrapassa o limite permitido.","lines");
 if(v.validUntil&&v.issuedAt&&v.validUntil<v.issuedAt)fail("A validade deve ser posterior à emissão.","validUntil");
 if(v.status!=="Rascunho"){
 if(!v.clientId||!v.clientSnapshot.trim())fail("Selecione o cliente da proposta.","clientId");
 if(!v.lines.length)fail("Adicione pelo menos um serviço.","lines");
 if(!v.scope.trim()||!v.paymentTerms.trim()||!v.validUntil)fail("Preencha escopo, pagamento e validade antes de enviar.","scope");
 }
 }
});
export type Item=z.infer<typeof recordSchema>;
export function fresh(kind:Kind):Item{return recordSchema.parse({id:crypto.randomUUID(),kind,name:"Novo",status:statuses[kind][0],...(kind==="prospects"?{username:"novo",followers:200001,observedAt:today()}:kind==="prospectSearches"?{niche:"novo"}:{})});}
export const money=(value:number,currency="BRL",language="pt")=>new Intl.NumberFormat(language==="en"?"en-US":"pt-BR",{style:"currency",currency}).format(value);
export const today=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
export const dateLabel=(value:string,language="pt")=>value?new Date(value+"T12:00:00").toLocaleDateString(language==="en"?"en-US":"pt-BR"):(language==="en"?"Not set":"Sem prazo");
export const proposalTotal=(v:Pick<Item,"lines"|"discount">)=>Math.max(0,v.lines.reduce((s,l)=>s+Math.round(l.unitPrice*100)*l.quantity,0)-Math.round(v.discount*100))/100;
export const shiftDate=(value:string,days:number)=>{const d=new Date(value+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)};
export const openItem=(i:Item)=>i.kind==="tasks"?i.status==="Pendente":i.kind==="leads"?!["Fechado","Perdido"].includes(i.status):i.kind==="projects"?!["Concluído","Pausado"].includes(i.status):i.kind==="payments"?i.status==="Previsto":i.kind==="proposals"?i.status==="Enviada":false;
export function routine(items:Item[],day=today()){
 const days=items.find(i=>i.kind==="preferences")?.silenceDays||3;
 return {
 overdue:items.filter(i=>openItem(i)&&i.date&&i.date<day),
 dueToday:items.filter(i=>openItem(i)&&i.date===day),
 upcoming:items.filter(i=>openItem(i)&&i.date>day&&i.date<=shiftDate(day,7)),
 silent:items.filter(i=>i.kind==="leads"&&openItem(i)&&i.waitingFor==="Cliente"&&i.lastContact&&i.lastContact<=shiftDate(day,-days)),
 expiring:items.filter(i=>i.kind==="proposals"&&i.status==="Enviada"&&i.validUntil&&i.validUntil<=shiftDate(day,3))
 };
}
export function summaryText(items:Item[],day=today()){
 const r=routine(items,day);
 const groups=[["Atrasados",r.overdue],["Hoje",r.dueToday],["Próximos 7 dias",r.upcoming],["Sem resposta do cliente",r.silent],["Validade de propostas",r.expiring]] as const;
 return ["RUPTURA CRM · "+dateLabel(day),...groups.flatMap(([title,rows])=>["",""+title+" ("+rows.length+")",...rows.map(i=>"- "+i.name+" · "+(i.kind==="proposals"?dateLabel(i.validUntil):dateLabel(i.date))+(i.nextAction?" · "+i.nextAction:""))])].join("\n");
}


