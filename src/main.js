import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import {buildLisbon} from './world.js';
import {spawnTraffic,updateTraffic} from './npcs.js';

const canvas=document.getElementById('game'),speedEl=document.getElementById('speed'),nameEl=document.getElementById('carName'),panel=document.getElementById('panel'),carsEl=document.getElementById('cars');
const cars=[
{name:'Ferrari SF90 Stradale',color:0xd62828,max:340,mass:1450,force:5200,steer:.52},
{name:'Lamborghini Revuelto',color:0xf2c94c,max:350,mass:1772,force:5700,steer:.50},
{name:'Porsche 911 GT3 RS',color:0xf4f4f4,max:296,mass:1450,force:5000,steer:.56},
{name:'McLaren 750S',color:0xff7a00,max:332,mass:1389,force:5400,steer:.54},
{name:'Nissan GT-R Nismo',color:0x9f1d20,max:330,mass:1720,force:6000,steer:.48},
{name:'Toyota GR Supra',color:0xffd23f,max:250,mass:1570,force:4300,steer:.57}
];
let selected=0,keys={},paused=false,third=true,last=performance.now(),acc=0,vehicle,chassis,car,wheels=[];
const scene=new THREE.Scene();scene.background=new THREE.Color(0x8eb9db);scene.fog=new THREE.Fog(0x8eb9db,260,1500);
const camera=new THREE.PerspectiveCamera(68,innerWidth/innerHeight,.1,2200);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;
scene.add(new THREE.HemisphereLight(0xd9edff,0x485047,2.2));const sun=new THREE.DirectionalLight(0xffefcf,3.2);sun.position.set(-300,500,200);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);scene.add(sun);
const world=new CANNON.World({gravity:new CANNON.Vec3(0,-9.82,0)});world.broadphase=new CANNON.SAPBroadphase(world);world.defaultContactMaterial.friction=.3;
const groundMat=new CANNON.Material('ground'),carMat=new CANNON.Material('car');world.addContactMaterial(new CANNON.ContactMaterial(groundMat,carMat,{friction:.95,restitution:0,contactEquationStiffness:1000}));
const city=buildLisbon(THREE,CANNON,scene,world,groundMat);
spawnTraffic(THREE,scene);

function carMesh(){
 if(car)scene.remove(car);wheels=[];const c=cars[selected],g=new THREE.Group();
 const paint=new THREE.MeshStandardMaterial({color:c.color,metalness:.6,roughness:.23}),dark=new THREE.MeshStandardMaterial({color:0x101216,roughness:.3}),glass=new THREE.MeshStandardMaterial({color:0x172a33,metalness:.1,roughness:.08});
 const body=new THREE.Mesh(new THREE.BoxGeometry(2.05,.55,4.55),paint);body.position.y=.7;g.add(body);
 const hood=new THREE.Mesh(new THREE.BoxGeometry(1.9,.2,1.2),paint);hood.position.set(0,.9,1.55);g.add(hood);
 const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.7,.65,1.9),glass);cabin.position.set(0,1.12,-.2);g.add(cabin);
 const roof=new THREE.Mesh(new THREE.BoxGeometry(1.5,.1,1.5),paint);roof.position.set(0,1.47,-.2);g.add(roof);
 const splitter=new THREE.Mesh(new THREE.BoxGeometry(2.12,.08,.4),dark);splitter.position.set(0,.43,2.2);g.add(splitter);
 const spoiler=new THREE.Mesh(new THREE.BoxGeometry(1.65,.1,.5),paint);spoiler.position.set(0,1.18,-2.12);g.add(spoiler);
 for(const x of[-.92,.92])for(const z of[-1.48,1.48]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.24,18),dark);w.rotation.z=Math.PI/2;w.position.set(x,.43,z);g.add(w);wheels.push(w)}
 for(const x of[-.62,.62]){const f=new THREE.Mesh(new THREE.BoxGeometry(.38,.12,.06),new THREE.MeshStandardMaterial({color:0xffffdd,emissive:0xffffaa,emissiveIntensity:2}));f.position.set(x,.74,2.28);g.add(f);const r=f.clone();r.material=new THREE.MeshStandardMaterial({color:0xff2020,emissive:0xff0000,emissiveIntensity:1.2});r.position.set(x,.76,-2.28);g.add(r)}
 car=g;scene.add(g);
}
function setup(){
 if(vehicle){vehicle.removeFromWorld(world);world.removeBody(chassis)}
 const c=cars[selected];chassis=new CANNON.Body({mass:c.mass,material:carMat,shape:new CANNON.Box(new CANNON.Vec3(1,.35,2.15))});chassis.position.set(0,1.1,40);chassis.angularDamping=.48;chassis.linearDamping=.08;world.addBody(chassis);
 vehicle=new CANNON.RaycastVehicle({chassisBody:chassis,indexRightAxis:0,indexUpAxis:1,indexForwardAxis:2});
 const o={radius:.36,directionLocal:new CANNON.Vec3(0,-1,0),suspensionStiffness:32,suspensionRestLength:.3,frictionSlip:5,dampingRelaxation:2.3,dampingCompression:4.4,maxSuspensionForce:100000,maxSuspensionTravel:.3,rollInfluence:.01,axleLocal:new CANNON.Vec3(1,0,0),chassisConnectionPointLocal:new CANNON.Vec3(),useCustomSlidingRotationalSpeed:true,customSlidingRotationalSpeed:-30};
 for(const [x,z,front] of[[-.9,1.45,true],[.9,1.45,true],[-.9,-1.45,false],[.9,-1.45,false]])vehicle.addWheel({...o,chassisConnectionPointLocal:new CANNON.Vec3(x,0,z),isFrontWheel:front});
 vehicle.addToWorld(world);carMesh();reset();
}
function reset(){chassis.position.set(0,1.1,40);chassis.quaternion.set(0,0,0,1);chassis.velocity.setZero();chassis.angularVelocity.setZero();chassis.force.setZero();chassis.torque.setZero();vehicle.wheelInfos.forEach(w=>{w.steering=0;w.engineForce=0;w.brake=0})}
function input(){
 const c=cars[selected],f=keys.w||keys.ArrowUp,r=keys.s||keys.ArrowDown,l=keys.a||keys.ArrowLeft,q=keys.d||keys.ArrowRight,steer=(l?1:0)+(q?-1:0),speed=chassis.velocity.length(),sf=Math.min(speed/35,1);
 let engine=f?-c.force:0;if(r&&speed<2)engine=c.force*.45;
 vehicle.applyEngineForce(engine,2);vehicle.applyEngineForce(engine,3);
 if(keys[' ']){vehicle.setBrake(80,0);vehicle.setBrake(80,1);vehicle.setBrake(300,2);vehicle.setBrake(300,3)}
 else if(r&&speed>=2){vehicle.setBrake(260,0);vehicle.setBrake(260,1);vehicle.setBrake(110,2);vehicle.setBrake(110,3)}
 else for(let i=0;i<4;i++)vehicle.setBrake(0,i);
 const maxSteer=c.steer*(1-.25*sf);vehicle.setSteeringValue(steer*maxSteer,0);vehicle.setSteeringValue(steer*maxSteer,1);
 const fwd=chassis.vectorToWorldFrame(new CANNON.Vec3(0,0,1)),fs=chassis.velocity.dot(fwd),max=c.max/3.6;if(fs>max)chassis.velocity.vsub(fwd.scale(fs-max));
}
function sync(){
 car.position.copy(chassis.position);car.quaternion.copy(chassis.quaternion);
 vehicle.wheelInfos.forEach((w,i)=>{vehicle.updateWheelTransform(i);wheels[i].position.copy(w.worldTransform.position);wheels[i].quaternion.copy(w.worldTransform.quaternion)});
 speedEl.textContent=Math.round(chassis.velocity.length()*3.6);
}
function loop(t){
 const dt=Math.min(.05,(t-last)/1000);last=t;if(!paused){acc+=dt;while(acc>=1/60){input();world.step(1/60);acc-=1/60}sync();updateTraffic(dt);const f=new THREE.Vector3(0,0,1).applyQuaternion(car.quaternion),target=new THREE.Vector3(chassis.position.x,chassis.position.y+.8,chassis.position.z);if(third){camera.position.lerp(target.clone().addScaledVector(f,-12).add(new THREE.Vector3(0,5,0)),.12);camera.lookAt(target)}else{camera.position.lerp(target.clone().add(new THREE.Vector3(0,1,0)),.18);camera.lookAt(target.clone().addScaledVector(f,15))}}renderer.render(scene,camera);requestAnimationFrame(loop)}
function open(){paused=true;panel.style.display='flex'}function close(){paused=false;panel.style.display='none'}
document.getElementById('settings').onclick=open;document.getElementById('resume').onclick=close;document.getElementById('reset').onclick=()=>{reset();close()};document.getElementById('camera').onclick=()=>third=!third;document.getElementById('reload').onclick=()=>location.reload();
cars.forEach((c,i)=>{const b=document.createElement('button');b.className='carCard'+(i?'':' active');b.innerHTML='<b>'+c.name+'</b><small>'+c.max+' km/h</small>';b.onclick=()=>{selected=i;nameEl.textContent=c.name;carsEl.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');setup()};carsEl.appendChild(b)});
addEventListener('keydown',e=>{keys[e.key]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key.toLowerCase()==='r')reset();if(e.key==='Escape')paused?close():open();if(e.key.toLowerCase()==='c')third=!third});
addEventListener('keyup',e=>keys[e.key]=false);addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
setup();requestAnimationFrame(loop);
