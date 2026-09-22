import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {buildLisbon} from './world.js';
import {spawnTraffic,updateTraffic} from './npcs.js';

const canvas=document.getElementById('game'),speedEl=document.getElementById('speed'),nameEl=document.getElementById('carName'),panel=document.getElementById('panel'),carsEl=document.getElementById('cars');
const cars=[
{name:'Ferrari SF90 Stradale',color:0xd62828,max:340,mass:1450,force:5200,steer:.52},
{name:'Lamborghini Revuelto',color:0xf2c94c,max:350,mass:1772,force:5700,steer:.50},
{name:'Porsche 911 GT3 RS',color:0xf4f4f4,max:296,mass:1450,force:5000,steer:.56},
{name:'McLaren 750S',color:0xff8700,max:332,mass:1389,force:5400,steer:.54},
{name:'Nissan GT-R Nismo',color:0x9f1d20,max:330,mass:1720,force:6000,steer:.48},
{name:'Toyota GR Supra',color:0xffd23f,max:250,mass:1570,force:4300,steer:.57}];
let selected=0,keys={},paused=false,third=true,last=performance.now(),acc=0,vehicle,chassis,car,player,playerYaw=0,playerPitch=.18,onFoot=false,exitCooldown=0,wheels=[],footVelocity=new THREE.Vector3(),footGrounded=true;
const carUI=[document.querySelector('.pill'),document.querySelector('.controls'),document.querySelector('.speed')];
const setCarUI=v=>carUI.forEach(x=>{if(x)x.style.display=v?'':'none'});
const prompt=document.createElement('div');prompt.textContent='E  Get in vehicle';Object.assign(prompt.style,{position:'fixed',left:'50%',bottom:'13%',transform:'translateX(-50%)',padding:'12px 20px',borderRadius:'12px',background:'rgba(8,10,14,.88)',border:'1px solid rgba(255,255,255,.2)',color:'#fff',font:'600 15px Arial,sans-serif',zIndex:20,display:'none',pointerEvents:'none'});document.body.appendChild(prompt);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9bbfe5);scene.fog=new THREE.Fog(0x9bbfe5,260,1800);
const camera=new THREE.PerspectiveCamera(68,innerWidth/innerHeight,.1,2400),renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;
scene.add(new THREE.HemisphereLight(0xddefff,0x485348,2.2));const sun=new THREE.DirectionalLight(0xfff4df,3.8);sun.position.set(-360,520,260);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-700;sun.shadow.camera.right=700;sun.shadow.camera.top=700;sun.shadow.camera.bottom=-700;sun.shadow.bias=-0.0005;scene.add(sun);const fill=new THREE.DirectionalLight(0xbfd7ff,1.15);fill.position.set(380,220,-320);scene.add(fill);const rim=new THREE.DirectionalLight(0xffd7b0,.65);rim.position.set(-120,120,-500);scene.add(rim);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
const world=new CANNON.World({gravity:new CANNON.Vec3(0,-9.82,0)});world.broadphase=new CANNON.SAPBroadphase(world);
const groundMat=new CANNON.Material('ground'),carMat=new CANNON.Material('car');world.addContactMaterial(new CANNON.ContactMaterial(groundMat,carMat,{friction:.82,restitution:0}));buildLisbon(THREE,CANNON,scene,world,groundMat);spawnTraffic(THREE,scene);
const mat=(c,r=.5,m=.1)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m}),mesh=(g,m)=>{const x=new THREE.Mesh(g,m);x.castShadow=true;x.receiveShadow=true;return x};

function carMesh(){if(car)scene.remove(car);wheels=[];const c=cars[selected],g=new THREE.Group(),paint=mat(c.color,.25,.65),dark=mat(0x101216,.28,.45),glass=mat(0x172633,.08,.3),rubber=mat(0x080808,1),chrome=mat(0xb8c0c8,.2,.85);
 const add=(geo,m,x,y,z)=>{const o=mesh(geo,m);o.position.set(x,y,z);g.add(o);return o};
 add(new THREE.BoxGeometry(2.02,.54,4.45),paint,0,.72,0);add(new THREE.BoxGeometry(2.08,.22,3.7),dark,0,.5,.05);add(new THREE.BoxGeometry(1.9,.16,1.45),paint,0,.98,1.48);add(new THREE.BoxGeometry(1.82,.22,.55),paint,0,.72,2.15);add(new THREE.BoxGeometry(1.72,.64,1.9),glass,0,1.18,-.2);add(new THREE.BoxGeometry(1.58,.1,1.52),paint,0,1.52,-.25);
 for(const x of [-.92,.92])for(const z of [-1.5,1.48]){const w=add(new THREE.CylinderGeometry(.37,.37,.24,20),rubber,x,.42,z);w.rotation.z=Math.PI/2;const h=add(new THREE.CylinderGeometry(.18,.18,.255,16),chrome,x,.42,z);h.rotation.z=Math.PI/2;}
 const ws=add(new THREE.BoxGeometry(1.5,.035,.78),glass,0,1.24,.63);ws.rotation.x=-.55;const rg=ws.clone();rg.rotation.x=.55;rg.position.z=-.96;g.add(rg);
 add(new THREE.BoxGeometry(2.12,.08,.3),dark,0,.43,2.35);add(new THREE.BoxGeometry(1.85,.12,.3),dark,0,.47,-2.28);add(new THREE.BoxGeometry(1.62,.08,.38),paint,0,1.35,-2);
 const light=mat(0xf8fbff,.15),tail=mat(0xff2020,.2);for(const x of [-.62,.62]){add(new THREE.BoxGeometry(.42,.1,.06),light,x,.91,2.43);add(new THREE.BoxGeometry(.42,.1,.06),tail,x,.9,-2.24);}
 car=g;scene.add(car);}
function makePlayer(){const g=new THREE.Group(),skin=mat(0xf1b38d,.9),shirt=mat(0x202b3c,.85),pants=mat(0x26364c,.9),shoe=mat(0x111111,1);const add=(geo,m,x,y,z)=>{const o=mesh(geo,m);o.position.set(x,y,z);g.add(o)};add(new THREE.BoxGeometry(.48,.68,.30),shirt,0,1.02,0);add(new THREE.BoxGeometry(.38,.42,.30),skin,0,1.57,0);add(new THREE.BoxGeometry(.40,.13,.32),mat(0x17120f,.9),0,1.80,0);for(const x of[-.13,.13]){add(new THREE.BoxGeometry(.16,.58,.20),pants,x,.43,0);add(new THREE.BoxGeometry(.17,.12,.28),mat(0x111111,1),x,.12,.03)}add(new THREE.BoxGeometry(.12,.55,.16),skin,-.34,1.04,0);add(new THREE.BoxGeometry(.12,.55,.16),skin,.34,1.04,0);scene.add(g);return g}
function setup(){if(vehicle){vehicle.removeFromWorld(world);world.removeBody(chassis)}const c=cars[selected];chassis=new CANNON.Body({mass:c.mass,material:carMat,shape:new CANNON.Box(new CANNON.Vec3(1,.35,2.15))});chassis.position.set(0,1.15,40);chassis.angularDamping=.58;world.addBody(chassis);
 vehicle=new CANNON.RaycastVehicle({chassisBody:chassis,indexRightAxis:0,indexUpAxis:1,indexForwardAxis:2});const o={radius:.36,directionLocal:new CANNON.Vec3(0,-1,0),suspensionStiffness:30,suspensionRestLength:.34,frictionSlip:5.2,dampingRelaxation:2.6,dampingCompression:4.6,maxSuspensionForce:100000,maxSuspensionTravel:.3,rollInfluence:.012,axleLocal:new CANNON.Vec3(1,0,0)};for(const[x,z,f]of[[-.9,1.45,true],[.9,1.45,true],[-.9,-1.45,false],[.9,-1.45,false]])vehicle.addWheel({...o,chassisConnectionPointLocal:new CANNON.Vec3(x,0,z),isFrontWheel:f});vehicle.addToWorld(world);carMesh();reset()}
function reset(){chassis.position.set(0,1.15,40);chassis.quaternion.set(0,0,0,1);chassis.velocity.set(0,0,0);chassis.angularVelocity.set(0,0,0);vehicle.wheelInfos.forEach(w=>{w.steering=0;w.engineForce=0;w.brake=0});onFoot=false;if(player)player.visible=false;footVelocity.set(0,0,0);prompt.style.display='none';setCarUI(true)}
function input(){if(onFoot)return;const c=cars[selected],w=keys.w||keys.ArrowUp,s=keys.s||keys.ArrowDown,l=keys.a||keys.ArrowLeft,d=keys.d||keys.ArrowRight,sp=chassis.velocity.length(),sf=Math.min(sp/35,1);
 let engine=w?-c.force:0;if(s&&sp<2)engine=c.force*.32;
 for(let i=0;i<4;i++)vehicle.setBrake(s&&sp>=2?(i<2?55:45):0,i);
 vehicle.applyEngineForce(engine,2);vehicle.applyEngineForce(engine,3);
 const steer=(l?1:0)+(d?-1:0);vehicle.setSteeringValue(steer*c.steer*(1-.35*sf),0);vehicle.setSteeringValue(steer*c.steer*(1-.35*sf),1);
 if(keys[' ']){vehicle.setBrake(85,2);vehicle.setBrake(85,3);vehicle.setBrake(25,0);vehicle.setBrake(25,1)}}
function foot(dt){
 const w=keys.w||keys.ArrowUp,s=keys.s||keys.ArrowDown,a=keys.a||keys.ArrowLeft,d=keys.d||keys.ArrowRight,run=keys.Shift||keys.shift;
 const forward=new THREE.Vector3(Math.sin(playerYaw),0,Math.cos(playerYaw)),right=new THREE.Vector3(Math.cos(playerYaw),0,-Math.sin(playerYaw));
 const wish=new THREE.Vector3();
 if(w)wish.add(forward);if(s)wish.sub(forward);if(d)wish.add(right);if(a)wish.sub(right);
 if(wish.lengthSq())wish.normalize();
 const targetSpeed=run?10:6.2,accel=wish.lengthSq()?28:20;
 const target=wish.multiplyScalar(targetSpeed);
 footVelocity.x=THREE.MathUtils.damp(footVelocity.x,target.x,accel,dt);
 footVelocity.z=THREE.MathUtils.damp(footVelocity.z,target.z,accel,dt);
 if(keys[' ']&&footGrounded){footVelocity.y=7.2;footGrounded=false}
 footVelocity.y-=18*dt;
 player.position.x+=footVelocity.x*dt;player.position.z+=footVelocity.z*dt;player.position.y+=footVelocity.y*dt;
 if(player.position.y<=0){player.position.y=0;footVelocity.y=0;footGrounded=true}
 player.position.x=THREE.MathUtils.clamp(player.position.x,-1120,1120);player.position.z=THREE.MathUtils.clamp(player.position.z,-1120,1120);
 if(wish.lengthSq())player.rotation.y=Math.atan2(footVelocity.x,footVelocity.z);
}
function interaction(){if(!onFoot){prompt.style.display='none';return}const near=player.position.distanceTo(chassis.position)<5;prompt.style.display=near?'block':'none';prompt.textContent='E  Get in vehicle'}
function toggleVehicle(){if(exitCooldown>0)return;if(!onFoot){onFoot=true;player.visible=true;setCarUI(false);player.position.copy(chassis.position);player.position.x+=2.7;player.position.y=.05;playerYaw=car.rotation.y;chassis.velocity.set(0,0,0);exitCooldown=.5}else if(player.position.distanceTo(chassis.position)<5){onFoot=false;player.visible=false;setCarUI(true);chassis.position.set(player.position.x,Math.max(1.05,chassis.position.y),player.position.z);chassis.quaternion.setFromEuler(0,playerYaw,0);exitCooldown=.5}}
function sync(){if(onFoot){speedEl.textContent='0';interaction();const target=player.position.clone().add(new THREE.Vector3(0,1.15,0));const dist=third?7:2.1;const height=third?3.1:1.65;const back=new THREE.Vector3(0,height,-dist).applyAxisAngle(new THREE.Vector3(0,1,0),playerYaw);camera.position.lerp(target.clone().add(back),.16);const look=target.clone().add(new THREE.Vector3(0,playerPitch,0));camera.lookAt(look);return}car.position.copy(chassis.position);car.quaternion.copy(chassis.quaternion);vehicle.wheelInfos.forEach((w,i)=>{vehicle.updateWheelTransform(i);});speedEl.textContent=Math.round(chassis.velocity.length()*3.6);const f=new THREE.Vector3(0,0,1).applyQuaternion(car.quaternion),target=car.position.clone().add(new THREE.Vector3(0,.8,0));camera.position.lerp(target.clone().addScaledVector(f,-11).add(new THREE.Vector3(0,5,0)),.12);camera.lookAt(target.clone().addScaledVector(f,5))}
function loop(t){const dt=Math.min(.05,(t-last)/1000);last=t;if(!paused){if(onFoot)foot(dt);else{acc+=dt;while(acc>=1/60){input();world.step(1/60);acc-=1/60}}updateTraffic(dt,chassis,onFoot);sync()}renderer.render(scene,camera);requestAnimationFrame(loop)}
function open(){paused=true;panel.style.display='flex'}function close(){paused=false;panel.style.display='none'}
document.getElementById('settings').onclick=open;document.getElementById('resume').onclick=close;document.getElementById('reset').onclick=()=>{reset();close()};document.getElementById('camera').onclick=()=>third=!third;document.getElementById('reload').onclick=()=>location.reload();
cars.forEach((c,i)=>{const b=document.createElement('button');b.className='carCard'+(i?'':' active');b.innerHTML='<b>'+c.name+'</b><small>'+c.max+' km/h</small>';b.onclick=()=>{selected=i;nameEl.textContent=c.name;setup();carsEl.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active')};carsEl.appendChild(b)});nameEl.textContent=cars[0].name;player=makePlayer();player.visible=false;setCarUI(true);
canvas.addEventListener('click',()=>{if(onFoot&&!paused&&document.pointerLockElement!==canvas)canvas.requestPointerLock()});addEventListener('mousemove',e=>{if(onFoot&&document.pointerLockElement===canvas){playerYaw-=e.movementX*.0028;playerPitch=THREE.MathUtils.clamp(playerPitch-e.movementY*.002,-0.35,.65)}});addEventListener('keydown',e=>{keys[e.key]=true;keys[e.code]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();const k=e.key.toLowerCase();if(k==='r')reset();if(k==='c'||k==='v')third=!third;if(k==='e')toggleVehicle();if(e.key==='Escape')(paused?close:open)()});addEventListener('keyup',e=>{keys[e.key]=false;keys[e.code]=false});addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});setInterval(()=>exitCooldown=Math.max(0,exitCooldown-.1),100);setup();requestAnimationFrame(loop);