'use strict';
// Procedural art stays aligned with the circuit and is shared by overview and detail tiles.
const sceneryPlans = new Map(), surfaceTextures = new Map();
function surfacePattern(g, kind, track) {
 const key=kind+track;
 if(!surfaceTextures.has(key)){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const c=canvas.getContext('2d');
  c.fillStyle=kind==='grass'?['#52734b','#77794b','#496a50'][track]:track===2?'#989b98':'#343b40';c.fillRect(0,0,128,128);
  let seed=37+track;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  for(let i=0;i<1900;i++){c.fillStyle=i%3?'#00000012':'#ffffff16';c.fillRect(random()*128,random()*128,kind==='grass'?1:random()*1.5+.4,kind==='grass'?3:1)}
  if(kind==='grass'){c.fillStyle='#ffffff05';c.fillRect(0,0,128,64)}
  surfaceTextures.set(key,canvas);
 }
 return g.createPattern(surfaceTextures.get(key),'repeat');
}
function sceneryPlan(track){
 if(sceneryPlans.has(track))return sceneryPlans.get(track);
 const plan=[],total=trackMesh(track).total;
 const add=(f,lane,type,index)=>{const p=position(f,lane,track),pit=pitOffset(f,track);
  // Keep the complete decoration footprint clear of both driving corridors.
  if(lane<0&&pit!==null&&Math.abs(lane-pit)<260)return;
  plan.push({...p,type,index});
 };
 for(let i=0,n=Math.ceil(total/240);i<n;i++){
  const f=i/n;add(f,330,'stand',i);add(f,560,'concourse',i);
  if(i%3===0)add(f,225,'light',i);
  add(f,900,'parking',i);
  add(f,-390,i%4===0?'service':'camp',i);
  add(f,-720,i%3===0?'tree':'camp',i+17);
  if(i%2===0)add(f,-1080,'tree',i+39);
  add(f,1250,'tree',i+8);
 }
 for(let y=800;y<WORLD.height-500;y+=550)for(let x=500;x<WORLD.width-500;x+=600){
  const q=trackInfo(x,y,track),pit=pitOffset(q.fraction,track);
  if(Math.abs(q.distance)<1450||pit!==null&&Math.abs(q.distance-pit)<340)continue;
  plan.push({x,y,angle:0,type:(x+y)%3?'tree':'camp',index:Math.round(x+y)});
 }
 sceneryPlans.set(track,plan);return plan;
}
function drawScenery(g,track,visible){
 for(const p of sceneryPlan(track)){
  if(!visible(p.x,p.y,230))continue;
  const i=p.index;g.save();g.translate(p.x,p.y);g.rotate(p.angle);
  if(p.type==='stand'){
   g.fillStyle='#14202555';g.fillRect(-103,-50,218,145);
   g.fillStyle='#9a9e96';g.fillRect(-110,-60,214,132);
   for(let row=0;row<8;row++){
    g.fillStyle=row%2?'#424d55':'#59656d';g.fillRect(-105,-55+row*15,204,13);
    for(let col=0;col<30;col++){
     const aisle=col===10||col===20;if(aisle)continue;
     g.fillStyle=['#c9d0cc','#be4c2b','#d2ba84','#283b4d'][(i+row+Math.floor(col/7))%4];g.fillRect(-102+col*6.6,-53+row*15,5,6);
     if((col*7+row*3+i)%5){g.fillStyle=['#202a31','#e4d1ae','#f0e9d7','#d17349'][(col+row+i)%4];g.fillRect(-101+col*6.6,-52+row*15,3,4)}
    }
   }
   g.fillStyle='#d4d7cd';for(const x of [-107,-38,28,98])g.fillRect(x,-60,4,132);
   g.fillStyle='#e5e3d5';g.fillRect(-110,69,214,9);g.fillStyle='#25353c';g.fillRect(-110,64,214,5);
  }else if(p.type==='concourse'){
   g.fillStyle='#b2b19f';g.fillRect(-120,-85,240,170);
   for(let j=0;j<3;j++){const x=-88+j*73;g.fillStyle='#1a252849';g.fillRect(x+5,-42,54,70);g.fillStyle=['#e1ddd0','#bd542e','#293f4c'][(i+j)%3];g.fillRect(x,-50,54,64);g.fillStyle='#ffffff30';g.fillRect(x,-50,27,64);g.fillStyle='#27343a';g.fillRect(x-3,16,60,8)}
   for(let j=0;j<11;j++){g.fillStyle=j%3?'#273848':'#e9d5b0';g.fillRect(-102+(j*43)%214,42+(j*17)%30,3,5)}
  }else if(p.type==='parking'){
   g.fillStyle='#656e69';g.fillRect(-115,-110,230,220);
   for(let row=0;row<2;row++)for(let col=0;col<9;col++){
    const x=-105+col*24,y=row?48:-88;g.strokeStyle='#c6c9b480';g.lineWidth=1;g.strokeRect(x-2,y-3,22,44);
    if((i+col+row)%5===0)continue;
    g.fillStyle='#17202555';g.fillRect(x+3,y+4,16,34);g.fillStyle=['#bcbfb7','#293f4d','#823d2c','#ded7bd','#414346'][(i+row+col)%5];g.fillRect(x,y,16,34);g.fillStyle='#25383f';g.fillRect(x+2,y+7,12,8);g.fillRect(x+2,y+23,12,6);
   }
   g.fillStyle='#cbc9b4';g.fillRect(-90,-4,180,2);
  }else if(p.type==='camp'||p.type==='service'){
   g.fillStyle='#9b9d7a44';g.fillRect(-90,-75,180,150);
   for(let j=0;j<3;j++){
    const x=-76+j*57;g.fillStyle='#15262a40';g.fillRect(x+7,-50,44,88);g.fillStyle=p.type==='service'?['#c9cdd0','#d55d31','#315064'][(i+j)%3]:'#deded0';g.fillRect(x,-58,40,84);g.fillStyle='#ffffff35';g.fillRect(x+3,-54,34,55);g.fillStyle='#4b5e66';g.fillRect(x+5,10,30,9);g.fillStyle='#979f98';g.fillRect(x+14,-39,12,15);
    g.fillStyle=['#c76237','#d5cfb5','#647a83'][(i+j)%3];g.beginPath();g.moveTo(x-3,42);g.lineTo(x+20,29);g.lineTo(x+44,42);g.lineTo(x+20,63);g.closePath();g.fill();
   }
  }else if(p.type==='tree'){
   for(let j=0;j<7;j++){const x=((j*67+i*13)%150)-75,y=((j*43+i*7)%130)-65,r=18+(i+j)%13;
    g.fillStyle='#182a2945';g.beginPath();g.ellipse(x+13,y+17,r+6,r*.7,0,0,TAU);g.fill();
    for(let k=0;k<3;k++){g.fillStyle=['#263f35','#385a3d','#66804b'][k];g.beginPath();g.arc(x-k*4,y-k*4,r-k*5,0,TAU);g.fill()}
   }
  }else if(p.type==='light'){
   g.strokeStyle='#14252d35';g.lineWidth=5;g.beginPath();g.moveTo(0,0);g.lineTo(30,65);g.stroke();g.fillStyle='#bec6c2';g.fillRect(-3,-3,6,12);g.fillStyle='#263b48';g.fillRect(-19,-9,38,10);g.fillStyle='#f3eed5';for(let j=0;j<5;j++)g.fillRect(-17+j*7,-8,5,6);
  }
  g.restore();
 }
}

function drawPaddockDetails(g,track,visible){
 const first=pitPosition(.10,track),last=pitPosition(.20,track);
 for(let i=0;i<15;i++){
  const x=first.x+40+i*(last.x-first.x-80)/14,y=first.y;if(!visible(x,y-180,340))continue;
  g.save();g.translate(x,y);
  // Roof ribs, skylight, pit tools, tire stacks and crew behind the working lane.
  g.fillStyle='#ffffff20';g.fillRect(-29,-162,28,68);g.strokeStyle='#101b2840';g.lineWidth=1;
  for(let j=0;j<7;j++){g.beginPath();g.moveTo(-29+j*9,-160);g.lineTo(-29+j*9,-92);g.stroke()}
  g.fillStyle='#88a6ad';g.fillRect(-13,-151,26,15);g.fillStyle='#d0d8d4';g.fillRect(-14,-134,28,3);
  g.fillStyle='#f5f3ed';g.fillRect(-32,-84,64,4);
  for(const side of [-1,1]){g.fillStyle='#182329';for(let j=0;j<3;j++){g.beginPath();g.arc(side*43,-72-j*11,5,0,TAU);g.fill()}g.fillStyle='#d25b32';g.fillRect(side*43-6,-121,12,23);g.fillStyle='#ebd9b5';g.beginPath();g.arc(side*23,-64,3,0,TAU);g.fill();g.fillStyle=i%3?'#c9d1cd':'#ed7443';g.fillRect(side*23-3,-61,6,8)}
  // Team transporter and awning in the paddock behind each garage.
  g.fillStyle='#15292b40';g.fillRect(-38,-420,85,150);g.fillStyle='#e0e0d3';g.fillRect(-42,-425,77,140);g.fillStyle=['#cf5e36','#293f4d','#839387'][i%3];g.fillRect(-42,-425,77,14);g.fillStyle='#abb5b0';g.fillRect(-34,-404,61,84);g.fillStyle='#344952';g.fillRect(-34,-307,61,13);g.fillStyle='#f0ede1';g.fillRect(-23,-391,15,29);g.fillRect(5,-391,15,29);
  g.fillStyle='#ffffff20';g.fillRect(-42,-425,39,140);
  g.fillStyle='#20333a55';g.fillRect(50,-387,65,85);g.fillStyle=i%3?'#d4d4c1':'#d06237';g.fillRect(46,-393,65,85);g.fillStyle='#ffffff25';g.beginPath();g.moveTo(46,-393);g.lineTo(78,-350);g.lineTo(111,-393);g.fill();
  g.restore();
 }
}
const WORLD_TILE_SIZE=1024,WORLD_TILE_RESOLUTION=1.5,WORLD_TILE_LIMIT=12,WORLD_TILE_PAD=2;
const worldTiles=new Map();let worldTileTrack=-1,worldWarmPending=false;
function clearWorldTiles(track){if(worldTileTrack===track)return;for(const tile of worldTiles.values())tile.width=tile.height=0;worldTiles.clear();worldTileTrack=track;}
function worldTile(track,x,y){
 const key=x+','+y,size=WORLD_TILE_SIZE,pad=WORLD_TILE_PAD;let tile=worldTiles.get(key);
 if(tile){worldTiles.delete(key);worldTiles.set(key,tile);return tile}
 tile=document.createElement('canvas');tile.width=tile.height=(size+pad*2)*WORLD_TILE_RESOLUTION;
 const c=tile.getContext('2d');c.scale(WORLD_TILE_RESOLUTION,WORLD_TILE_RESOLUTION);c.translate(pad-x*size,pad-y*size);
 paintWorld(c,track,{x:x*size-pad,y:y*size-pad,width:size+pad*2,height:size+pad*2});worldTiles.set(key,tile);
 if(worldTiles.size>WORLD_TILE_LIMIT){const oldest=worldTiles.keys().next().value;worldTiles.get(oldest).width=0;worldTiles.delete(oldest)}
 return tile;
}
function warmWorldAhead(r){
 if(worldWarmPending||typeof requestIdleCallback!=='function'||r.speed<1)return;
 const track=r.track,camera=cameraFor({x:r.x+r.vx*1.7,y:r.y+r.vy*1.7}),size=WORLD_TILE_SIZE;
 for(let y=Math.max(0,Math.floor(camera.y/size));y<=Math.min(Math.ceil(WORLD.height/size)-1,Math.floor((camera.y+720)/size));y++)
 for(let x=Math.max(0,Math.floor(camera.x/size));x<=Math.min(Math.ceil(WORLD.width/size)-1,Math.floor((camera.x+1200)/size));x++){
  if(worldTiles.has(x+','+y))continue;
  worldWarmPending=true;requestIdleCallback(()=>{worldWarmPending=false;if(worldTileTrack===track)worldTile(track,x,y)},{timeout:700});return;
 }
}
function drawWorldTiles(g,track,camera){
 clearWorldTiles(track);
 const size=WORLD_TILE_SIZE;
 for(let y=Math.max(0,Math.floor(camera.y/size));y<=Math.min(Math.ceil(WORLD.height/size)-1,Math.floor((camera.y+720)/size));y++)
 for(let x=Math.max(0,Math.floor(camera.x/size));x<=Math.min(Math.ceil(WORLD.width/size)-1,Math.floor((camera.x+1200)/size));x++){
  const tile=worldTile(track,x,y),pad=WORLD_TILE_PAD;
  g.drawImage(tile,x*size-pad,y*size-pad,size+pad*2,size+pad*2);
 }
}
