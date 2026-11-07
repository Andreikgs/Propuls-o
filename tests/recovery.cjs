const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(process.argv[2]),html=fs.readFileSync(path.join(root,'public/game.html'),'utf8'),script=html.match(/<script>([\s\S]*)<\/script>/)[1];
let now=0;const elements=new Map(),drawing=new Proxy({},{get:()=>()=>{}});function element(id){if(id==='#leaveNow')return null;if(!elements.has(id))elements.set(id,{id,style:{},dataset:{},value:id==='#difficulty'?'normal':'#dcff38',classList:{add(){},remove(){},toggle(){}},getContext:()=>drawing,innerHTML:'',textContent:'',setPointerCapture(){},setAttribute(){}});return elements.get(id)}
const sandbox={console,atob,document:{addEventListener(){},querySelector:element,querySelectorAll:()=>[],createElement:()=>({width:0,height:0,getContext:()=>drawing})},localStorage:{getItem:()=>null,setItem(){}},location:{protocol:'file:'},window:{addEventListener(){},scrollTo(){}},navigator:{},performance:{now:()=>now},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},setInterval(){}};
vm.createContext(sandbox);vm.runInContext(script,sandbox);const run=s=>vm.runInContext(s,sandbox);


run(`for(const track of [0,1,2])for(const side of [-1,1])for(const fraction of [0,.32,.5,.65,.8]){
 const d={...createDriver(track),...position(wrap(fraction-TRACKS[track].offset),side*220,track)};containCar(d);
 const q=trackInfo(d.x,d.y,track);if(Math.abs(q.distance)>140)throw Error('Wall failed '+side);
}
var jam=createDriver();jam.collisionPending=true;jam.start=0;
for(let i=0;i<599;i++)monitorStuck(jam,1/120);
if(jam.recovery)throw Error('Reset before 5 seconds');
monitorStuck(jam,1/120);if(jam.recovery!==3||jam.collisionPending)throw Error('No reset at 5 seconds');
var parked=createDriver();for(let i=0;i<700;i++)monitorStuck(parked,1/120);
if(parked.recovery)throw Error('Reset without collision');
var escaped=createDriver();escaped.collisionPending=true;monitorStuck(escaped,.1);escaped.x+=25;monitorStuck(escaped,.1);
for(let i=0;i<700;i++)monitorStuck(escaped,1/120);
if(escaped.recovery)throw Error('Reset after escaping crash');
var border=createDriver();border.gates=5;Object.assign(border,position(.35,0));border.prevFraction=.35;updateProgress(border);var base=border.p;
Object.assign(border,position(.35,135));updateProgress(border);
if(Math.abs(border.p-base)>.001)throw Error('Progress drops at wall');
var order={...createDriver(),p:.35,bots:[{n:12,p:.34999}]};
if(racePosition(order)!==1)throw Error('Initial rank');
order.bots[0].p=.35001;if(racePosition(order)!==1)throw Error('Rank flicker');
order.bots[0].p=.36;if(racePosition(order)!==2)throw Error('Overtake missing');
order.p=10;order.bots[0].p=10;order.bots[0].finishPlace=1;
if(racePosition(order)!==2)throw Error('Finished opponent missing');
order.finishPlace=2;order.bots[0].p=9;if(racePosition(order)!==2)throw Error('Finish rank changed');
`);
console.log('PASS: both walls, five-second recovery, no false reset, stable wall progress, overtakes and finish order.');
