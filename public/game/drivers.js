'use strict';
// Add new fixed driver/car pairs here. Account names never come from this roster.
const DRIVERS = [
 {id:'drupa',name:'Drupa',number:'17',color:'#53B800',paint:'Verde e preto',portrait:'assets/drivers/drupa-portrait.webp',car:'assets/drivers/drupa-car.webp'},
 {id:'bozo',name:'Bozo',number:'07',color:'#FF7900',paint:'Laranja e preto',portrait:'assets/drivers/bozo-portrait.webp',car:'assets/drivers/bozo-car.webp'},
 {id:'lorena',name:'Lorena',number:'08',color:'#FEFEFE',paint:'Branco e preto',portrait:'assets/drivers/lorena-portrait.webp',car:'assets/drivers/lorena-car.webp'}
];
const driverImages = new Map();
function selectedDriver(id){return DRIVERS.find(d=>d.id===id)||DRIVERS[0]}
function drawDriverCar(ctx,x,y,angle,id,scale=1.5,steering=0){
 const driver=selectedDriver(id),image=driverImages.get(driver.id);
 if(image&&image.complete&&image.naturalWidth){ctx.save();ctx.translate(x,y);ctx.rotate(angle+Math.PI/2);ctx.drawImage(image,-10*scale,-22*scale,20*scale,44*scale);ctx.restore()}
 else car(ctx,x,y,angle,driver.color,driver.number,scale,steering);
}
if(typeof Image!=='undefined')for(const driver of DRIVERS){const image=new Image();driverImages.set(driver.id,image);image.onload=()=>{if(typeof $==='function')drawHero()};image.src=driver.car;}
let driverTarget='offline';
function chooseDriver(target='offline'){driverTarget=target;page('drivers',true)}
function selectDriver(id){const driver=selectedDriver(id);profile.driverId=driver.id;profile.color=driver.color;save();renderDriverSelection();drawHero()}
function renderDriverSelection(){
 const driver=selectedDriver(profile.driverId);
 for(const item of DRIVERS){const card=$('#'+item.id+'Card'),active=item.id===driver.id;card.classList.toggle('selected',active);card.setAttribute('aria-pressed',String(active));$('#'+item.id+'Status').textContent=(active?(item.id==='lorena'?'SELECIONADA':'SELECIONADO'):'SELECIONAR')+' / Nº '+item.number;}
 $('#driverVehicle').style.setProperty('--driver-accent',driver.color);
 $('#driverCar').src=driver.car;$('#driverCar').alt='Carro de '+driver.name+', número '+driver.number;
 $('#driverNumber').textContent=driver.number;$('#driverTitle').textContent=driver.name.toUpperCase()+' / #'+driver.number;$('#driverPaint').textContent=driver.paint+' · Tração traseira';
 $('.scene-number').textContent=driver.number;$('#heroDriver').textContent=driver.name.toUpperCase()+' #'+driver.number;$('#heroNumber').textContent='CARRO FIXO / Nº '+driver.number;
}
function confirmDriver(){save();if(driverTarget==='race')startRace(false);else page(driverTarget,true)}
