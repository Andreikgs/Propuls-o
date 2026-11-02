const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(process.argv[2]),html=fs.readFileSync(path.join(root,'public/game.html'),'utf8'),script=html.match(/<script>([\s\S]*)<\/script>/)[1];
let now=0;const elements=new Map(),drawing=new Proxy({},{get:()=>()=>{}});function element(id){if(id==='#leaveNow')return null;if(!elements.has(id))elements.set(id,{id,style:{},dataset:{},value:id==='#difficulty'?'normal':'#dcff38',classList:{add(){},remove(){},toggle(){}},getContext:()=>drawing,innerHTML:'',textContent:'',setPointerCapture(){},setAttribute(){}});return elements.get(id)}
const sandbox={console,atob,document:{addEventListener(){},querySelector:element,querySelectorAll:()=>[],createElement:()=>({width:0,height:0,getContext:()=>drawing})},localStorage:{getItem:()=>null,setItem(){}},location:{protocol:'file:'},window:{addEventListener(){},scrollTo(){}},navigator:{},performance:{now:()=>now},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},setInterval(){}};
vm.createContext(sandbox);vm.runInContext(script,sandbox);const run=s=>vm.runInContext(s,sandbox);


run(`var tire=createDriver();tire.vx=200;tire.speed=200;wearTires(tire,{},1);if(!(tire.tires<1&&tire.tires>0))throw Error('No wear');
var stationary=createDriver();wearTires(stationary,{},100);if(stationary.tires!==1)throw Error('Wear while stationary');
var normal=createDriver(),sliding=createDriver();normal.vx=sliding.vx=200;normal.speed=sliding.speed=200;sliding.slip=40;wearTires(normal,{},1);wearTires(sliding,{brake:true},1);if(sliding.tires>=normal.tires)throw Error('No extra abrasion');
if(tireGrip({tires:0})>=tireGrip({tires:1}))throw Error('Wear has no grip effect');
for(const track of [0,1,2]){
 var d={...createDriver(track),...position(.04,-85,track),tires:.2,pitRequested:true};d.prevFraction=.04;d.gates=0;d.p=.04;var saved=d.p;
 if(!inPitZone(d)||!stepPit(d,1/120)||d.pitService!==4)throw Error('No pit service');
 for(let i=0;i<479;i++)stepPit(d,1/120);
 if(d.tires!==.2)throw Error('Instant repair');
 stepPit(d,1/120);if(d.tires!==1||d.pitStops!==1||d.p!==saved)throw Error('Service completion');
 var fast={...createDriver(track),...position(.04,-85,track),vx:50,pitRequested:true};if(stepPit(fast,.1))throw Error('Pit at speed');
 var outside={...createDriver(track),...position(.04,0,track),pitRequested:true};if(stepPit(outside,.1))throw Error('Pit outside strip');
 var reset={...createDriver(track),tires:.2,pitService:2,start:0};recoverDriver(reset);if(reset.tires!==.2||reset.pitService!==0)throw Error('Reset repairs tires or retains service');
 var bot={...createDriver(track),...position(.9,65,track),tires:.3,lane:65,cruise:205,n:12,prevFraction:.9,gates:14,p:.9};
 for(let i=0;i<14400&&!bot.pitStops;i++)stepDriver(bot,botInput(bot),1/120);
 if(bot.pitStops!==1||bot.tires!==1)throw Error('AI failed pit on '+track);
}
`);
console.log('PASS: distance/slip/braking wear, grip loss, stationary preservation, four-second service, zone/speed checks, reset abuse and AI pit entry on all circuits.');
