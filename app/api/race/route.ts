import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
export const dynamic='force-dynamic';
const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:Request){
 const user=await getChatGPTUser();const url=new URL(req.url);if(!user)return json({user:null});
 if(!env.DB)return json({error:'Banco indisponível.'},503);
 const id=url.searchParams.get('cup');
 if(!id){const [list,account]=await Promise.all([env.DB.prepare('SELECT c.* FROM cups c JOIN members m ON m.cup=c.id WHERE m.user=? ORDER BY c.created DESC').bind(user.userId).all(),env.DB.prepare('SELECT name FROM accounts WHERE user=?').bind(user.userId).first<{name:string}>()]);return json({user:{id:user.userId,name:account?.name||'',needsProfile:!account},suggestedName:user.fullName||user.email.split('@')[0],cups:list.results});}
 const member=await env.DB.prepare('SELECT user FROM members WHERE cup=? AND user=?').bind(id,user.userId).first();if(!member)return json({error:'Entre no campeonato com seu código.'},403);
 const [cup,players,scores]=await Promise.all([env.DB.prepare('SELECT * FROM cups WHERE id=?').bind(id).first(),env.DB.prepare('SELECT * FROM members WHERE cup=? ORDER BY name').bind(id).all(),env.DB.prepare('SELECT * FROM results WHERE cup=? ORDER BY round,elapsed').bind(id).all()]);
 return json({cup,players:players.results.map((p:any)=>({...p,driverId:p.driver_id})),results:scores.results,now:Date.now()});
}
export async function POST(req:Request){
 const user=await getChatGPTUser();if(!user)return json({error:'Faça login para jogar online.'},401);
 if(req.headers.get('origin')!==new URL(req.url).origin)return json({error:'Origem inválida.'},403);
 if(!env.DB)return json({error:'Banco indisponível.'},503);
 let b:any;try{b=await req.json()}catch{return json({error:'Pedido inválido.'},400)}
 const db=env.DB,uid=user.userId;
 if(b.action==='register'){
 const name=typeof b.name==='string'?b.name.trim():'';
 if(name.length<2||name.length>24||/[\u0000-\u001f\u007f]/.test(name))return json({error:'Use um nome de 2 a 24 caracteres.'},400);
 const existing=await db.prepare('SELECT name FROM accounts WHERE user=?').bind(uid).first();
 if(existing)return json({error:'O nome da conta já foi definido.'},409);
 await db.batch([db.prepare('INSERT OR IGNORE INTO accounts(user,name,created) VALUES(?,?,?)').bind(uid,name,Date.now()),db.prepare('UPDATE members SET name=(SELECT name FROM accounts WHERE user=?) WHERE user=?').bind(uid,uid)]);return json({ok:true});
 }
 const account=await db.prepare('SELECT name FROM accounts WHERE user=?').bind(uid).first<{name:string}>();
 if(!account)return json({error:'Defina seu nome no primeiro acesso à conta.'},403);
 const roster:Record<string,string>={drupa:'#53B800',bozo:'#FF7900',lorena:'#FEFEFE'};
 const driverId=typeof b.driverId==='string'&&Object.hasOwn(roster,b.driverId)?b.driverId:'';
 const name=account.name,color=roster[driverId];
 if(['create','join'].includes(b.action)&&!driverId)return json({error:'Selecione um piloto disponível.'},400);
 if(b.action==='create'){
 const id=crypto.randomUUID().replaceAll('-','').slice(0,10).toUpperCase(),title=String(b.title||'').trim().slice(0,60);if(!title)return json({error:'Dê um nome ao campeonato.'},400);
 await db.batch([db.prepare('INSERT INTO cups(id,name,owner,rounds,created) VALUES(?,?,?,?,?)').bind(id,title,uid,[3,5,8].includes(b.rounds)?b.rounds:3,Date.now()),db.prepare('INSERT INTO members(cup,user,name,color,driver_id) VALUES(?,?,?,?,?)').bind(id,uid,name,color,driverId)]);return json({id});}
 const id=String(b.cup||'').toUpperCase();const cup:any=await db.prepare('SELECT * FROM cups WHERE id=?').bind(id).first();if(!cup)return json({error:'Campeonato não encontrado.'},404);
 if(b.action==='join'){
 if(cup.round>0)return json({error:'Este campeonato já começou.'},409);
 await db.prepare('INSERT OR IGNORE INTO members(cup,user,name,color,driver_id) SELECT ?,?,?,?,? WHERE (SELECT count(*) FROM members WHERE cup=?)<15').bind(id,uid,name,color,driverId,id).run();
 const entered=await db.prepare('SELECT user FROM members WHERE cup=? AND user=?').bind(id,uid).first();return entered?json({id}):json({error:'O grid está completo (15 pilotos).'},409);}
 const m:any=await db.prepare('SELECT * FROM members WHERE cup=? AND user=?').bind(id,uid).first();if(!m)return json({error:'Você não participa deste campeonato.'},403);
 if(b.action==='start'){
 if(cup.owner!==uid)return json({error:'Somente o organizador pode iniciar.'},403);
 if(cup.round>=cup.rounds)return json({error:'Campeonato encerrado.'},409);
 const count:any=await db.prepare('SELECT count(*) AS n FROM members WHERE cup=?').bind(id).first();if(count.n<2)return json({error:'Convide pelo menos mais um piloto.'},409);
 if(cup.round>0){const finished:any=await db.prepare('SELECT count(*) AS n FROM results WHERE cup=? AND round=?').bind(id,cup.round).first();if(finished.n<count.n&&Date.now()<cup.start+3600000)return json({error:'Aguarde o fim da etapa (limite de 60 minutos).'},409);}
 const start=Date.now()+8000;await db.batch([db.prepare('UPDATE cups SET round=round+1,start=? WHERE id=? AND round=?').bind(start,id,cup.round),db.prepare('UPDATE members SET progress=0,x=0,y=0,updated=0 WHERE cup=?').bind(id)]);return json({ok:true});}
 if(b.action==='state'){
 if(b.round!==cup.round||Date.now()<cup.start||!cup.start)return json({error:'Etapa não está ativa.'},409);
 if(![b.x,b.y,b.angle,b.progress].every(Number.isFinite)||b.x<0||b.x>21600||b.y<0||b.y>12960||b.progress<0||b.progress>10.1)return json({error:'Estado inválido.'},400);
 const elapsed=Date.now()-cup.start;if(b.progress>elapsed/36000+0.15)return json({error:'Progresso inválido.'},400);
 await db.prepare('UPDATE members SET x=?,y=?,angle=?,progress=?,updated=? WHERE cup=? AND user=?').bind(b.x,b.y,b.angle,b.progress,Date.now(),id,uid).run();
 if(b.progress>=10&&elapsed>=360000&&elapsed<=3600000)await db.prepare('INSERT OR IGNORE INTO results(cup,user,round,elapsed) VALUES(?,?,?,?)').bind(id,uid,cup.round,elapsed).run();return json({ok:true});}
 return json({error:'Ação desconhecida.'},400);
}
