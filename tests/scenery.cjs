const vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(process.argv[2]||'.'),drawing=new Proxy({},{get:()=>()=>{}}),elements=new Map();
const element=id=>{if(!elements.has(id))elements.set(id,{id,style:{setProperty(){}},dataset:{},value:'normal',classList:{add(){},remove(){},toggle(){}},getContext:()=>drawing,setAttribute(){}});return elements.get(id)};
const idle=[];const sandbox={console,atob,document:{addEventListener(){},querySelector:element,querySelectorAll:()=>[],createElement:()=>({width:0,height:0,getContext:()=>drawing})},localStorage:{getItem:()=>null,setItem(){}},location:{protocol:'file:'},window:{addEventListener(){},scrollTo(){}},navigator:{},performance:{now:()=>0},requestAnimationFrame(){},requestIdleCallback:fn=>idle.push(fn),setTimeout(){},clearTimeout(){},setInterval(){}};
vm.createContext(sandbox);require('./load-game.cjs')(root).load(sandbox);const run=s=>vm.runInContext(s,sandbox);
for(const track of [0,1,2]){
 sandbox.track=track;
 assert.ok(run('sceneryPlan(track).length')>1000);
 assert.equal(run('sceneryPlan(track)===sceneryPlan(track)'),true);
 run('clearWorldTiles(track);var first=worldTile(track,0,0)');
 assert.equal(run('first.width'),1542);assert.equal(run('worldTile(track,0,0)===first'),true);
 run('for(let x=1;x<15;x++)worldTile(track,x,0)');assert.equal(run('worldTiles.size'),12);assert.equal(run('first.width'),0,'Evicted pixel buffers released');
 assert.equal(run('buildWorld(track).width'),1280);
}
run('clearWorldTiles(0);warmWorldAhead({...createDriver(0),speed:200,vx:200,vy:0});clearWorldTiles(1)');
assert.equal(idle.length,1);idle[0]();assert.equal(run('worldTiles.size'),0,'Old-track idle jobs must not repopulate new-track cache');
console.log('PASS: dense deterministic scenery, high-resolution tiles, reuse, bounded memory, eviction and stale prefetch cancellation.');
