'use strict';
// Add new fixed driver/car pairs here. Account names never come from this roster.
const DRIVERS = [{id:'drupa',name:'Drupa',number:17,color:'#53B800',portrait:'assets/drivers/drupa-portrait.webp',car:'assets/drivers/drupa-car.webp'}];
const driverImages = new Map();
function selectedDriver(id){return DRIVERS.find(d=>d.id===id)||DRIVERS[0]}
function drawDriverCar(ctx,x,y,angle,id,scale=1.5,steering=0){
 const driver=selectedDriver(id),image=driverImages.get(driver.id);
 if(image&&image.complete&&image.naturalWidth){ctx.save();ctx.translate(x,y);ctx.rotate(angle+Math.PI/2);ctx.drawImage(image,-10*scale,-22*scale,20*scale,44*scale);ctx.restore()}
 else car(ctx,x,y,angle,driver.color,driver.number,scale,steering);
}
if(typeof Image!=='undefined')for(const driver of DRIVERS){const image=new Image();driverImages.set(driver.id,image);image.onload=()=>{if(document.readyState==='loading'||document.readyState==='interactive')document.addEventListener('DOMContentLoaded',()=>drawHero(),{once:true});else drawHero()};image.src=driver.car;}
let driverTarget='offline';
function chooseDriver(target='offline'){driverTarget=target;page('drivers',true)}
function confirmDriver(){profile.driverId='drupa';profile.color=selectedDriver(profile.driverId).color;save();if(driverTarget==='race')startRace(false);else page(driverTarget,true)}
