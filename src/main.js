import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {buildLisbon} from './world.js';
import {spawnTraffic,updateTraffic} from './npcs.js';

const canvas=document.getElementById('game'), speedEl=document.getElementById('speed'), nameEl=document.getElementById('carName'), panel=document.getElementById('panel'), carsEl=document.getElementById('cars');
const cars=[
{name:'Ferrari SF90 Stradale',color:0xd62828,max:340,mass:1450,force:5200,steer:.52},
{name:'Lamborghini Revuelto',color:0xf2c94c,max:350,mass:1772,force:5700,steer:.50},
{name:'Porsche 911 GT3 RS',color:0xf4f4f4,max:296,mass:1450,force:5000,steer:.56},
{name:'McLaren 750S',color:0xff8700,max:332,mass:1389,force:5400,steer:.54},
{name:'Nissan GT-R Nismo',color:0x9f1d20,max:330,mass:1720,force:6000,steer:.48},
{name:'Toyota GR Supra',color:0xffd23f,max:250,mass:1570,force:4300,steer:.57}
];
let selected=0,keys={},paused=false,third=true,last=performance.now(),acc=0,vehicle,chassis,car,wheels=[];
let onFoot=false,player,playerYaw=0,exitCooldown=0;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9bbfe5);scene.fog=new THREE.Fog(0x9bbfe5,260,1800);
const camera=new THREE.PerspectiveCamera(68,innerWidth/innerHeight,.1,2400);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
scene.add(new THREE.HemisphereLight(0xddefff,0x485348,2.2));
const sun=new THREE.DirectionalLight(0xffffff,3.2);sun.position.set(-300,500,220);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);scene.add(sun);
const world=new CANNON.World({gravity:new CANNON.Vec3(0,-9.82,0)});world.broadphase=new CANNON.SAPBroadphase(world);world.defaultContactMaterial.friction=.45;
const groundMat=new CANNON.Material('ground'),carMat=new CANNON.Material('car');
world.addContactMaterial(new CANNON.ContactMaterial(groundMat,carMat,{friction:.82,restitution:0}));
buildLisbon(THREE,CANNON,scene,world,groundMat);
spawnTraffic(THREE,scene);

function mat(color,rough=.5,metal=.1){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal})}
function mesh(g,m){const x=new THREE.Mesh(g,m);x.castShadow=true;x.receiveShadow=true;return x}
function carMesh(){
 if(car)scene.remove(car);wheels=[];
 const c=cars[selected],g=new THREE.Group(),paint=mat(c.color,.25,.65),dark=mat(0x101216,.28,.45),glass=mat(0x172633,.08,.3),rubber=mat(0x080808,1,0),chrome=mat(0xb8c0c8,.2,.85);
 const body=mesh(new THREE.BoxGeometry(2.02,.54,4.45),paint);body.position.y=.72;g.add(body);
 const lower=mesh(new THREE.BoxGeometry(2.08,.22,3.7),dark);lower.position.set(0,.5,.05);g.add(lower);
 const hood=mesh(new THREE.BoxGeometry(1.9,.16,1.45),paint);hood.position.set(0,.98,1.48);g.add(hood);
 const nose=mesh(new THREE.BoxGeometry(1.82,.22,.55),paint);nose.position.set(0,.72,2.15);g.add(nose);
 const cabin=mesh(new THREE.BoxGeometry(1.72,.64,1.9),glass);cabin.position.set(0,1.18,-.2);g.add(cabin);
 const roof=mesh(new THREE.BoxGeometry(1.58,.1,1.52),paint);roof.position.set(0,1.52,-.25);g.add(roof);
 for(const x of [-.72,.72]){for(const z of [-1.0,.85]){const arch=mesh(new THREE.TorusGeometry(.39,.09,8,18,Math.PI),dark);arch.rotation.z=Math.PI;arch.rotation.x=Math.PI/2;arch.position.set(x,.55,z);g.add(arch);}}
 for(const x of [-.92,.92])for(const z of [-1.5,1.48]){
   const w=mesh(new THREE.CylinderGeometry(.37,.37,.24,20),rubber);w.rotation.z=Math.PI/2;w.position.set(x,.42,z);g.add(w);
   const hub=mesh(new THREE.CylinderGeometry(.18,.18,.255,16),chrome);hub.rotation.z=Math.PI/2;hub.position.set(x,.42,z);g.add(hub);
 }
 const windshield=mesh(new THREE.BoxGeometry(1.5,.035,.78),glass);windshield.rotation.x=-.55;windshield.position.set(0,1.24,.63);g.add(windshield);
 const rearGlass=windshield.clone();rearGlass.rotation.x=.55;rearGlass.position.z=-.96;g.add(rearGlass);
 for(const x of [-.67,.67]){const mirror=mesh(new THREE.BoxGeometry(.18,.1,.28),paint);mirror.position.set(x,1.12,.55);g.add(mirror);}
 const splitter=mesh(new THREE.BoxGeometry(2.12,.08,.3),dark);splitter.position.set(0,.43,2.35);g.add(splitter);
 const diffuser=mesh(new THREE.BoxGeometry(1.85,.12,.3),dark);diffuser.position.set(0,.47,-2.28);g.add(diffuser);
 const spoiler=mesh(new THREE.BoxGeometry(1.62,.08,.38),paint);spoiler.position.set(0,1.35,-2.0);g.add(spoiler);
 for(const x of [-.72,.72]){const st=mesh(new THREE.BoxGeometry(.07,.42,.07),dark);st.position.set(x,1.17,-1.95);g.add(st);}
 const head=mat(0xf8fbff,.15,.1),tail=mat(0xff2020,.2,.2);
 for(const x of [-.62,.62]){const h=mesh(new THREE.BoxGeometry(.42,.1,.06),head);h.position.set(x,.91,2.43);g.add(h);const t=mesh(new THREE.BoxGeometry(.42,.1,.06),tail);t.position.set(x,.9,-2.24);g.add(t);}
 car=g;scene.add(car);
}
function makePlayer(){
 const g=new THREE.Group(),skin=mat(0xf1b38d,.9,0),shirt=mat(0x202b3c,.85,0),pants=mat(0x26364c,.9,0),shoe=mat(0x111111,1,0);
 const torso=mesh(new THREE.CapsuleGeometry(.3,.62,5,10),shirt);torso.position.y=1.18;g.add(torso);
 const head=mesh(new THREE.SphereGeometry(.25,16,12),skin);head.position.y=1.82;g.add(head);
 for(const x of [-.13,.13]){const leg=mesh(new THREE.CapsuleGeometry(.1,.58,4,8),pants);leg.position.set(x,.63,0);g.add(leg);const foot=mesh(new THREE.BoxGeometry(.18,.1,.35),shoe);foot.position.set(x,.27,.08);g.add(foot);}
 for(const x of [-.39,.39]){const arm=mesh(new THREE.CapsuleGeometry(.08,.48,4,8),skin);arm.rotation.z=x<0?-.12:.12;arm.position.set(x,1.18,0);g.add(arm);}
 scene.add(g);return g;
}
function setup(){
 if(vehicle){vehicle.removeFromWorld(world);world.removeBody(chassis);}
 const c=cars[selected];chassis=new CANNON.Body({mass:c.mass,material:carMat,shape:new CANNON.Box(new CANNON.Vec3(1,.35,2.15))});
 chassis.position.set(0,1.15,40);chassis.angularDamping=.58;chassis.linearDamping=.02;world.addBody(chassis);
 vehicle=new CANNON.RaycastVehicle({chassisBody:chassis,indexRightAxis:0,indexUpAxis:1,indexForwardAxis:2});
 const opt={radius:.36,directionLocal:new CANNON.Vec3(0,-1,0),suspensionStiffness:30,suspensionRestLength:.34,frictionSlip:5.2,dampingRelaxation:2.6,dampingCompression:4.6,maxSuspensionForce:100000,maxSuspensionTravel:.3,rollInfluence:.012,axleLocal:new CANNON.Vec3(1,0,0),chassisConnectionPointLocal:new CANNON.Vec3(),isFrontWheel:true};
 for(const [x,z,front] of [[-.9,1.45,true],[.9,1.45,true],[-.9,-1.45,false],[.9,-1.45,false]]){vehicle.addWheel({...opt,chassisConnectionPointLocal:new CANNON.Vec3(x,0,z),isFrontWheel:front});}
 vehicle.addToWorld(world);carMesh();reset();
}
function reset(){chassis.position.set(0,1.15,40);chassis.quaternion.set(0,0,0,1);chassis.velocity.set(0,0,0);chassis.angularVelocity.set(0,0,0);chassis.force.set(0,0,0);chassis.torque.set(0,0,0);if(vehicle)vehicle.wheelInfos.forEach(w=>{w.steering=0;w.engineForce=0;w.brake=0});onFoot=false;if(player)player.visible=false;}
function input(){
 if(onFoot)return;
 const c=cars[selected],f=keys.w||keys.ArrowUp,r=keys.s||keys.ArrowDown,l=keys.a||keys.ArrowLeft,q=keys.d||keys.ArrowRight;
 const sp=chassis.velocity.length(),sf=Math.min(sp/35,1);
 let engine=f?c.force:0;if(r&&sp<2)engine=-c.force*.32; if(r&&sp>=2){vehicle.setBrake(95,0);vehicle.setBrake(95,1);vehicle.setBrake(75,2);vehicle.setBrake(75,3);}else for(let i=0;i<4;i++)vehicle.setBrake(0,i);
 vehicle.applyEngineForce(engine,2);vehicle.applyEngineForce(engine,3);
 const steer=(l?-1:0)+(q?1:0);vehicle.setSteeringValue(steer*c.steer*(1-.35*sf),0);vehicle.setSteeringValue(steer*c.steer*(1-.35*sf),1);
 if(keys[' ']){vehicle.setBrake(115,2);vehicle.setBrake(115,3);vehicle.setBrake(35,0);vehicle.setBrake(35,1);}
 const fw=chassis.vectorToWorldFrame(new CANNON.Vec3(0,0,1)),fs=chassis.velocity.dot(fw),max=c.max/3.6;if(fs>max)chassis.velocity.vsub(fw.scale(fs-max));
}
function footUpdate(dt){
 if(!player)return;const f=keys.w||keys.ArrowUp,b=keys.s||keys.ArrowDown,l=keys.a||keys.ArrowLeft,r=keys.d||keys.ArrowRight;
 const move=(f?1:0)-(b?1:0),turn=(r?1:0)-(l?1:0);playerYaw-=turn*dt*2.8;
 const dir=new THREE.Vector3(Math.sin(playerYaw),0,Math.cos(playerYaw));player.position.addScaledVector(dir,move*dt*6);
 player.position.x=Math.max(-680,Math.min(680,player.position.x));player.position.z=Math.max(-680,Math.min(680,player.position.z));player.rotation.y=playerYaw;
}
function sync(){
 if(onFoot){speedEl.textContent='0';const target=player.position.clone().add(new THREE.Vector3(0,1.25,0));const back=new THREE.Vector3(0,2.7,-5.5).applyAxisAngle(new THREE.Vector3(0,1,0),playerYaw);camera.position.lerp(target.clone().add(back),.16);camera.lookAt(target);return;}
 car.position.copy(chassis.position);car.quaternion.copy(chassis.quaternion);vehicle.wheelInfos.forEach((w,i)=>{vehicle.updateWheelTransform(i);wheels[i]&&(wheels[i].position.copy(w.worldTransform.position),wheels[i].quaternion.copy(w.worldTransform.quaternion));});
 speedEl.textContent=Math.round(chassis.velocity.length()*3.6);
 const f=new THREE.Vector3(0,0,1).applyQuaternion(car.quaternion),target=car.position.clone().add(new THREE.Vector3(0,.8,0));
 if(third){camera.position.lerp(target.clone().addScaledVector(f,-11).add(new THREE.Vector3(0,5,0)),.12);camera.lookAt(target.clone().addScaledVector(f,5));}
 else {camera.position.lerp(target.clone().add(new THREE.Vector3(0,1.25,0)).addScaledVector(f,1.1),.25);camera.lookAt(target.clone().addScaledVector(f,12));}
}
function loop(t){const dt=Math.min(.05,(t-last)/1000);last=t;if(!paused){if(onFoot)footUpdate(dt);else{acc+=dt;while(acc>=1/60){input();world.step(1/60);acc-=1/60;}}updateTraffic(dt,chassis,onFoot);sync();}renderer.render(scene,camera);requestAnimationFrame(loop);}
function open(){paused=true;panel.style.display='flex'}function close(){paused=false;panel.style.display='none'}
document.getElementById('settings').onclick=open;document.getElementById('resume').onclick=close;document.getElementById('reset').onclick=()=>{reset();close()};document.getElementById('camera').onclick=()=>third=!third;document.getElementById('reload').onclick=()=>location.reload();
cars.forEach((c,i)=>{const b=document.createElement('button');b.className='carCard'+(i?'':' active');b.innerHTML='<b>'+c.name+'</b><small>'+c.max+' km/h</small>';b.onclick=()=>{selected=i;nameEl.textContent=c.name;setup();carsEl.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active')};carsEl.appendChild(b);});
nameEl.textContent=cars[0].name;player=makePlayer();player.visible=false;
addEventListener('keydown',e=>{keys[e.key]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key.toLowerCase()==='r')reset();if(e.key==='Escape')(paused?close:open)();if(e.key.toLowerCase()==='c')third=!third;if(e.key.toLowerCase()==='e'&&!onFoot&&exitCooldown<=0){onFoot=true;player.visible=true;player.position.copy(chassis.position);player.position.x+=2.7;player.position.y=.05;playerYaw=car.rotation.y;chassis.velocity.set(0,0,0);exitCooldown=.5;}else if(e.key.toLowerCase()==='e'&&onFoot&&exitCooldown<=0){const d=player.position.distanceTo(chassis.position);if(d<5){onFoot=false;player.visible=false;chassis.position.y=Math.max(1.05,chassis.position.y);exitCooldown=.5;}}});
addEventListener('keyup',e=>keys[e.key]=false);
setInterval(()=>{exitCooldown=Math.max(0,exitCooldown-.1)},100);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
setup();requestAnimationFrame(loop);
