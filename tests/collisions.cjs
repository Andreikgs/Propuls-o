const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(process.argv[2]),game=require('./load-game.cjs')(root),{html,script}=game;
let now=0;const elements=new Map(),drawing=new Proxy({},{get:()=>()=>{}});function element(id){if(id==='#leaveNow')return null;if(!elements.has(id))elements.set(id,{id,style:{},dataset:{},value:id==='#difficulty'?'normal':'#dcff38',classList:{add(){},remove(){},toggle(){}},getContext:()=>drawing,innerHTML:'',textContent:'',setPointerCapture(){},setAttribute(){}});return elements.get(id)}
const sandbox={console,atob,document:{addEventListener(){},querySelector:element,querySelectorAll:()=>[],createElement:()=>({width:0,height:0,getContext:()=>drawing})},localStorage:{getItem:()=>null,setItem(){}},location:{protocol:'file:'},window:{addEventListener(){},scrollTo(){}},navigator:{},performance:{now:()=>now},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},setInterval(){}};
vm.createContext(sandbox);game.load(sandbox);const run=s=>vm.runInContext(s,sandbox);


function body(x,y,vx=0,vy=0,angle=0){return{x,y,vx,vy,angle,yaw:0,impactYaw:0,recovery:0,speed:Math.hypot(vx,vy)}}
function energy(...b){return b.reduce((sum,a)=>sum+.5*(a.vx*a.vx+a.vy*a.vy+run('CAR_BODY.inertia')*(a.impactYaw||0)**2),0)}
sandbox.a=body(0,0,200);sandbox.b=body(60,0,50);
let before=energy(sandbox.a,sandbox.b);run('resolveCarCollision(a,b)');
assert.ok(sandbox.b.vx>50,'Rear impact accelerates target');assert.ok(sandbox.a.vx<200,'Striker loses momentum');
assert.ok(Math.abs(sandbox.a.vx+sandbox.b.vx-250)<1e-8);assert.ok(energy(sandbox.a,sandbox.b)<=before+.001);
sandbox.a=body(0,0,220);sandbox.b=body(60,12,60);before=energy(sandbox.a,sandbox.b);run('resolveCarCollision(a,b)');
assert.ok(Math.abs(sandbox.b.impactYaw)>.1,'Off-centre strike rotates target');assert.ok(energy(sandbox.a,sandbox.b)<=before+.001,'Impact must not add energy');
sandbox.a=body(0,0,0,60);sandbox.b=body(0,28);run('resolveCarCollision(a,b)');assert.ok(sandbox.b.vy>0,'Side contact pushes target');
sandbox.a=body(0,0,-20);sandbox.b=body(60,0,20);run('resolveCarCollision(a,b)');assert.equal(sandbox.a.vx,-20);assert.equal(sandbox.b.vx,20);
sandbox.a=body(0,0,200);sandbox.b=body(0,32);assert.equal(run('collisionContact(a,b)'),null,'Adjacent lanes do not collide on circular bounds');
sandbox.a=body(0,0,200);sandbox.b=body(60,0);sandbox.c=body(120,0);run('for(let i=0;i<8;i++){resolveCarCollision(a,b);resolveCarCollision(b,c)}');assert.ok(sandbox.c.vx>0,'Chain transfers momentum');
sandbox.a=body(0,0);sandbox.b=body(0,0);run('for(let i=0;i<30;i++)resolveCarCollision(a,b)');assert.ok(Number.isFinite(sandbox.a.x));assert.ok(Math.hypot(sandbox.a.x-sandbox.b.x,sandbox.a.y-sandbox.b.y)>29);
sandbox.a=body(0,0,200);sandbox.b=body(60,0);sandbox.b.recovery=1;assert.equal(run('resolveCarCollision(a,b)'),false);
console.log('PASS: rear/side impulses, momentum, energy, off-centre rotation, separating contacts, near misses, chain collisions, overlap and recovery.');
run(`var push=createDriver(2);Object.assign(push,position(0,0,2));push.vx=330;push.speed=330;
var target={...createDriver(2),...position(80/trackMesh(2).total,0,2),lane:0,cruise:0};
push.bots=[target];var moved=target.x;var peak=0;
for(let i=0;i<60;i++){stepRacePhysics(push,{throttle:true},1/120);peak=Math.max(peak,target.vx)}
if(peak<60||target.x-moved<20)throw Error('Target is not physically pushed');
if(push.x>target.x)throw Error('High-speed rear impact tunneled through target');
`);
run(`for(const track of [0,1,2]){
const bot={...createDriver(track),lane:45,cruise:205};Object.assign(bot,position(0,45,track));
for(let i=0;i<14400&&bot.gates<16;i++)stepDriver(bot,botInput(bot),1/120);
if(bot.gates<16)throw Error('Physical AI cannot finish lap on '+track);
}
`);
console.log('PASS: integrated high-speed pushing and physical AI completes a lap on all three circuits.');

run(`var edge={...createDriver(2),...position(0,135,2)};edge.vy=120;containCar(edge);
if(trackInfo(edge.x,edge.y,2).distance+bodyRadius(edge,{x:0,y:1})>152.1)throw Error('Body escaped wall');
var ram={...createDriver(2),x:edge.x,y:edge.y-28,vy:100};
for(let i=0;i<20;i++){resolveCarCollision(ram,edge);containCar(edge);containCar(ram)}
if(trackInfo(edge.x,edge.y,2).distance+bodyRadius(edge,{x:0,y:1})>152.1)throw Error('Pushed through wall');
startRace();race.start=0;
for(let i=0;i<240;i++)stepRacePhysics(race,{throttle:true},1/120);
if(race.bots.length!==14)throw Error('Missing AI field');
for(const b of [race,...race.bots])if(![b.x,b.y,b.vx,b.vy,b.angle,b.p].every(Number.isFinite))throw Error('Invalid full-grid state');
if(race.bots.some(b=>b.speed<20))throw Error('AI does not accelerate from grid');
`);
console.log('PASS: pushing against wall, hull containment and full fifteen-car starting grid.');
