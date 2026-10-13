import assert from 'node:assert/strict';
import {recordSchema,routine,summaryText} from '../lib/crm.ts';
const item=(kind,status,extra={})=>recordSchema.parse({id:crypto.randomUUID(),kind,status,name:'Teste',...extra});
const records=[
 item('tasks','Pendente',{date:'2026-10-01'}),item('tasks','Pendente',{date:'2026-10-02'}),item('tasks','Concluída',{date:'2026-10-01'}),
 item('projects','Em produção',{date:'2026-10-09'}),item('projects','Concluído',{date:'2026-10-02'}),
 item('leads','Contatado',{lastContact:'2026-09-29',waitingFor:'Cliente'}),item('leads','Fechado',{lastContact:'2026-09-01'}),
 item('leads','Contatado',{lastContact:'2026-09-01',waitingFor:'Minha equipe'}),
 item('proposals','Rascunho',{validUntil:'2026-10-02'})
];
const r=routine(records,'2026-10-02');assert.equal(r.overdue.length,1);assert.equal(r.dueToday.length,1);assert.equal(r.upcoming.length,1);assert.equal(r.silent.length,1);assert.equal(r.expiring.length,0);
assert.ok(summaryText(records,'2026-10-02').includes('Atrasados (1)'));
assert.equal(recordSchema.safeParse({...records[0],date:'2026-02-30'}).success,false);
console.log('PASS: fronteiras de datas, itens encerrados e alertas de falta de resposta.');

