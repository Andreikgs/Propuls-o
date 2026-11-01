const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(process.argv[2]),html=fs.readFileSync(path.join(root,'public/game.html'),'utf8'),script=html.match(/<script>([\s\S]*)<\/script>/)[1];
let now=0;const elements=new Map(),drawing=new Proxy({},{get:()=>()=>{}});function element(id){if(id==='#leaveNow')return null;if(!elements.has(id))elements.set(id,{id,style:{},dataset:{},value:id==='#difficulty'?'normal':'#dcff38',classList:{add(){},remove(){},toggle(){}},getContext:()=>drawing,innerHTML:'',textContent:'',setPointerCapture(){},setAttribute(){}});return elements.get(id)}
const sandbox={console,atob,document:{addEventListener(){},querySelector:element,querySelectorAll:()=>[],createElement:()=>({width:0,height:0,getContext:()=>drawing})},localStorage:{getItem:()=>null,setItem(){}},location:{protocol:'file:'},window:{addEventListener(){},scrollTo(){}},navigator:{},performance:{now:()=>now},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},setInterval(){}};
vm.createContext(sandbox);vm.runInContext(script,sandbox);const run=s=>vm.runInContext(s,sandbox);

run('var driver=createDriver();for(let i=0;i<360;i++)stepDriver(driver,{throttle:true},1/120)');
assert.ok(run('driver.x')>run('position(0).x'));assert.ok(Math.abs(run('(driver.y-position(0).y)*Math.cos(position(0).angle)-(driver.x-position(0).x)*Math.sin(position(0).angle)'))<.001);assert.ok(Math.abs(run('driver.angle-position(0).angle'))<.001,'No auto-steering');
run('var parked=createDriver();for(let i=0;i<240;i++)stepDriver(parked,{right:true},1/120)');assert.ok(Math.abs(run('parked.angle-position(0).angle'))<1e-10);
run('var right=createDriver();var left=createDriver();for(let i=0;i<120;i++){stepDriver(right,{throttle:true,right:true},1/120);stepDriver(left,{throttle:true,left:true},1/120)}');
assert.ok(run('right.angle-position(0).angle')>0);assert.ok(run('left.angle-position(0).angle')<0);assert.ok(run('right.y')>run('position(0).y'));assert.ok(run('left.y')<run('position(0).y'));
run('var heading=right.angle;for(let i=0;i<120;i++)stepDriver(right,{throttle:true},1/120)');assert.ok(Math.abs(run('right.steer'))<.01);assert.ok(run('right.angle')>run('heading'),'Steering retains inertia');
run('var braking=createDriver();braking.vx=180;for(let i=0;i<240;i++)stepDriver(braking,{brake:true},1/120)');assert.ok(run('braking.speed')<1e-6);
run('var grass=createDriver();Object.assign(grass,position(0,-350));grass.vx=250;for(let i=0;i<240;i++)stepDriver(grass,{throttle:true},1/120)');assert.ok(run('grass.speed')<=86);assert.ok(run('grass.offroad'));
run('var wall=createDriver();Object.assign(wall,position(.25,149));wall.vx=300;for(let i=0;i<20;i++)stepDriver(wall,{throttle:true},1/120)');assert.ok(run('trackInfo(wall.x,wall.y).distance')<153);
run('var checkpoint=createDriver();for(let i=1;i<=4800;i++){Object.assign(checkpoint,position(i/1600));updateProgress(checkpoint)}');
assert.equal(run('checkpoint.gates'),48);assert.equal(run('checkpoint.p'),3);
run('var shortcut=createDriver();for(let i=1;i<=1600;i++){Object.assign(shortcut,position(i/1600,-350));updateProgress(shortcut)}');assert.equal(run('shortcut.gates'),0);
run('var reverse=createDriver();for(let i=1;i<=1600;i++){Object.assign(reverse,position(-i/1600));updateProgress(reverse)}');assert.equal(run('reverse.gates'),0);
run('var skip=createDriver();Object.assign(skip,position(.4));updateProgress(skip)');assert.equal(run('skip.gates'),0);
run('var camera=cameraFor(driver)');assert.equal(run('driver.x-camera.x'),600);assert.equal(run('driver.y-camera.y'),360);
run('checkpoint.done=false;checkpoint.start=0;checkpoint.gates=19;recoverDriver(checkpoint)');assert.equal(run('checkpoint.p'),19/16);assert.equal(run('checkpoint.recovery'),3);
run('startRace();race.bots=[];race.start=0;keys.arrowup=true');for(let i=0;i<20;i++){now+=50;run('frame('+now+')')}const before=run('race.x');run('togglePause()');now+=1000;run('frame('+now+')');assert.equal(run('race.x'),before);run('togglePause();race.gates=48;race.p=3;race.elapsed=150000;finish()');assert.equal(run('race.done'),true);assert.equal(run('stats.count'),1);
assert.equal(fs.readFileSync(path.join(root,'Oval-Rush-Offline.html'),'utf8'),html,'Offline export matches hosted game');
console.log('PASS: manual steering, inertia, brakes, offroad, barrier, sequential lap gates, wrong-way, shortcuts, centered camera, recovery, pause and finish.');

run(`for(const track of [0,1,2]){
 const d=createDriver(track);let offroad=0,t=0;
 for(;t<120&&d.gates<16;t+=1/120){
  const info=trackInfo(d.x,d.y,track),target=position(info.fraction+.008,0,track),dx=target.x-d.x,dy=target.y-d.y;
  let error=Math.atan2(dy,dx)-d.angle;error=Math.atan2(Math.sin(error),Math.cos(error));
  const steering=Math.atan(96*Math.sin(error)/Math.hypot(dx,dy))/(.48/(1+d.speed/120));
  stepDriver(d,{throttle:d.speed<200,brake:d.speed>215,left:d.steer>steering+.02,right:d.steer<steering-.02},1/120);
  if(d.offroad)offroad++;
 }
 if(d.gates!==16||offroad)throw Error('Could not drive a clean lap on track '+track);
}`);
console.log('PASS: full driven lap on all three circuits using only throttle, brake and steering inputs.');



run(`for(const track of [0,1,2]){
 const mesh=trackMesh(track);let area=0;
 for(let i=0;i<mesh.segments.length;i++){const s=mesh.segments[i];area+=s.x*(s.y+s.dy)-(s.x+s.dx)*s.y}
 if(area>=0)throw Error('Track must run counterclockwise');
 for(let i=0;i<160;i++)for(const lane of [-100,0,100]){
 const p=position(i/160,lane,track),info=trackInfo(p.x,p.y,track);
 let error=Math.abs(info.fraction-i/160);error=Math.min(error,1-error);
 // Polyline normals can shift projection by up to 3 world pixels on the inside lane.
 if(error*mesh.total>3||Math.abs(info.distance-lane)>.3)throw Error('Geometry projection mismatch '+track);
 if(p.x<220||p.x>4580||p.y<220||p.y>2660)throw Error('Track exceeds world bounds');
 }
 const d=createDriver(track);for(let i=1;i<=4800;i++){Object.assign(d,position(i/1600,0,track));updateProgress(d)}
 if(d.gates!==48||d.p!==3)throw Error('Three laps not recorded on '+track);
 const bad=createDriver(track);for(let i=1;i<=1600;i++){Object.assign(bad,position(i/1600,-300,track));updateProgress(bad)}
 if(bad.gates!==0)throw Error('Infield shortcut awarded progress');
 if(mesh.total/330<18)throw Error('Circuit violates server minimum lap time');
}
if(!(trackMesh(1).total>trackMesh(0).total&&trackMesh(0).total>trackMesh(2).total))throw Error('Circuit length ordering');
if(position(0,0,1).x<2700)throw Error('Talladega finish must be beyond trioval centre');
for(let round=1;round<=8;round++)if(championshipTrack(round)!==(round-1)%3)throw Error('Championship schedule');
`);
console.log('PASS: all three track projections, CCW direction, world bounds, full races, shortcut rejection, Talladega finish and championship rotation.');

assert.ok(run('soundTelemetry({speed:40},{throttle:true}).rate')>run('soundTelemetry({speed:0},{}).rate'));
assert.equal(run('soundTelemetry({speed:0},{brake:true}).brake'),0);
assert.ok(run('soundTelemetry({speed:200},{brake:true}).brake')>0);
assert.equal(run('soundTelemetry({speed:200,slip:0},{}).skid'),0);
assert.ok(run('soundTelemetry({speed:200,slip:30},{}).skid')>0);
assert.equal(run('soundTelemetry({speed:200,slip:30,offroad:true},{}).skid'),0);
let contexts=0,starts=0;
class Param{constructor(){this.value=0}setTargetAtTime(v){assert.ok(Number.isFinite(v));this.value=v}}
class AudioNode{constructor(){for(const p of ['gain','frequency','playbackRate','Q','threshold','knee','ratio'])this[p]=new Param()}connect(){}start(){starts++}}
class MockAudio{constructor(){contexts++;this.state='running';this.currentTime=0;this.sampleRate=8000;this.destination={}}createGain(){return new AudioNode()}createDynamicsCompressor(){return new AudioNode()}createOscillator(){return new AudioNode()}createBiquadFilter(){return new AudioNode()}createBufferSource(){return new AudioNode()}createBuffer(c,n){return{getChannelData:()=>new Float32Array(n)}}resume(){this.state='running';return Promise.resolve()}close(){return Promise.resolve()}}
sandbox.window.AudioContext=MockAudio;
run('raceAudio.unavailable=false;raceAudio.unlock();raceAudio.unlock()');
assert.equal(contexts,1);assert.equal(starts,3);
run('var audioDriver={active:true,speed:200,slip:30};raceAudio.update(audioDriver,{throttle:true,brake:true})');
assert.ok(run('raceAudio.nodes.master.gain.value')>0);assert.ok(run('raceAudio.nodes.brake.gain.value')>0);assert.ok(run('raceAudio.nodes.skid.gain.value')>0);
run('raceAudio.toggle()');assert.equal(run('raceAudio.nodes.master.gain.value'),0);
run('raceAudio.toggle();audioDriver.paused=true;raceAudio.update(audioDriver,{})');assert.equal(run('raceAudio.nodes.master.gain.value'),0);
run('audioDriver.paused=false;raceAudio.update(audioDriver,{})');assert.ok(run('raceAudio.nodes.master.gain.value')>0);
run('audioDriver.done=true;raceAudio.update(audioDriver,{})');assert.equal(run('raceAudio.nodes.master.gain.value'),0);
run('audioDriver.done=false;raceAudio.focused=false;raceAudio.update(audioDriver,{})');assert.equal(run('raceAudio.nodes.master.gain.value'),0);
run('raceAudio.focused=true;raceAudio.update(audioDriver,{});leaveRace()');assert.equal(run('raceAudio.nodes.master.gain.value'),0);
console.log('PASS: audio engine RPM, braking, tire slip, one reusable audio context, mute, pause, finish, background and exit.');


const assets=JSON.parse(fs.readFileSync(path.join(root,'public/audio/samples.json'),'utf8'));
assert.deepEqual(JSON.parse(run('JSON.stringify(RECORDED_SAMPLES)')),assets);
for(const [name,sample] of Object.entries(assets)){
 const pcm=Buffer.from(sample.pcm,'base64');assert.equal(pcm.length%2,0);assert.equal(sample.sampleRate,44100);
 assert.ok(pcm.length/2/sample.sampleRate>.5);
 let peak=0,energy=0;for(let i=0;i<pcm.length;i+=2){const v=pcm.readInt16LE(i)/32768;peak=Math.max(peak,Math.abs(v));energy+=v*v}
 assert.ok(peak<=.851&&peak>.8);assert.ok(energy/(pcm.length/2)>.01);
}
assert.ok(!script.includes('createOscillator('),'Use recorded samples, not synthesized oscillators');
assert.equal(fs.readFileSync(path.join(root,'Propulsao-Offline.html'),'utf8'),html);
assert.ok(html.includes('PROPUL<em>SÃO</em>'));
assert.ok(html.includes('Mike Koenig / SoundBible'));
console.log('PASS: recorded PCM integrity, embedded offline samples, naming and audio attribution.');

const {DatabaseSync}=require('node:sqlite'),sql=new DatabaseSync(':memory:');sql.exec(fs.readFileSync(path.join(root,'drizzle/0000_racing.sql'),'utf8'));
const db={prepare(q){return{bind(...args){const st=sql.prepare(q);return{first:async()=>st.get(...args)||null,all:async()=>({results:st.all(...args)}),run:async()=>st.run(...args)}}}},batch:async jobs=>Promise.all(jobs.map(j=>j.run()))};
let current=null,clock=1000000;const ts=require(path.join(root,'node_modules/typescript'));const source=fs.readFileSync(path.join(root,'app/api/race/route.ts'),'utf8');const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const apiExports={};const apiCtx={exports:apiExports,require(n){if(n==='cloudflare:workers')return {env:{DB:db}};if(n==='../../chatgpt-auth')return {getChatGPTUser:async()=>current};throw Error(n)},Response,URL,crypto:require('node:crypto').webcrypto,Date:class extends Date{static now(){return clock}}};
vm.runInNewContext(js,apiCtx);
async function post(body){return apiExports.POST(new Request('https://game.test/api/race',{method:'POST',headers:{Origin:'https://game.test','Content-Type':'application/json'},body:JSON.stringify(body)}))}
(async()=>{assert.equal((await post({action:'create'})).status,401);current={userId:'u1',email:'one@test',fullName:'Piloto 1'};let res=await post({action:'create',title:'Copa teste',rounds:3});const {id}=await res.json();assert.ok(id);assert.equal((await post({action:'start',cup:id})).status,409);
current={userId:'u2',email:'two@test',fullName:'Piloto 2'};assert.equal((await post({action:'join',cup:id})).status,200);assert.equal((await post({action:'start',cup:id})).status,403);
current={userId:'u1',email:'one@test'};assert.equal((await post({action:'start',cup:id})).status,200);clock+=8000;assert.equal((await post({action:'state',cup:id,round:1,x:2400,y:520,angle:0,progress:3})).status,400);clock+=65000;assert.equal((await post({action:'state',cup:id,round:1,x:2400,y:520,angle:0,progress:3})).status,200);assert.equal((await post({action:'state',cup:id,round:1,x:2400,y:520,angle:0,progress:3})).status,200);
assert.equal(sql.prepare('SELECT count(*) n FROM results').get().n,1);const state=await (await apiExports.GET(new Request('https://game.test/api/race?cup='+id))).json();assert.equal(state.players.length,2);assert.equal(state.results.length,1);assert.equal((await post({action:'state',cup:id,round:1,x:5000,y:520,angle:0,progress:3})).status,400);
current={userId:'u3',email:'three@test'};assert.equal((await apiExports.GET(new Request('https://game.test/api/race?cup='+id))).status,403);assert.equal((await post({action:'join',cup:id})).status,409);
console.log('PASS: login obrigatório, criação, convite, autorização, largada, validação de tempo, resultado único e leitura de placar.');})().catch(e=>{console.error(e);process.exitCode=1});