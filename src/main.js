import * as THREE from 'three';
import * as CANNON from 'cannon-es';

const canvas=document.getElementById('game');
const speedEl=document.getElementById('speed');
const carNameEl=document.getElementById('carName');
const panel=document.getElementById('panel');
const carsEl=document.getElementById('cars');

const cars=[
{name:'Ferrari SF90 Stradale',color:0xd62828,max:340,mass:1450,force:5200,steer:.52},
{name:'Lamborghini Revuelto',color:0xf2c94c,max:350,mass:1772,force:5700,steer:.50},
{name:'Porsche 911 GT3 RS',color:0xf4f4f4,max:296,mass:1450,force:5000,steer:.56},
{name:'McLaren 750S',color:0xff7a00,max:332,mass:1389,force:5400,steer:.54},
{name:'Nissan GT-R Nismo',color:0x9f1d20,max:330,mass:1720,force:6000,steer:.48},
{name:'Toyota GR Supra',color:0xffd23f,max:250,mass:1570,force:4300,steer:.57}
];

let selected=0,keys={},vehicle,chassis,carVisual,wheelVisuals=[];
let paused=false,last=performance.now(),accumulator=0,thirdPerson=true;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x8bb7d9);
scene.fog=new THREE.Fog(0x8bb7d9,260,1150);
const camera=new THREE.PerspectiveCamera(68,innerWidth/innerHeight,.1,1800);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;

scene.add(new THREE.HemisphereLight(0xcfe8ff,0x475248,2.1));
const sun=new THREE.DirectionalLight(0xfff3d6,3.2);
sun.position.set(-250,420,180);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-500;sun.shadow.camera.right=500;sun.shadow.camera.top=500;sun.shadow.camera.bottom=-500;
scene.add(sun);

const world=new CANNON.World({gravity:new CANNON.Vec3(0,-9.82,0)});
world.broadphase=new CANNON.SAPBroadphase(world);
world.defaultContactMaterial.friction=.35;
world.defaultContactMaterial.restitution=.05;
const groundMat=new CANNON.Material('ground');
const carMat=new CANNON.Material('car');
world.addContactMaterial(new CANNON.ContactMaterial(groundMat,carMat,{friction:.9,restitution:.02}));
world.addContactMaterial(new CANNON.ContactMaterial(carMat,carMat,{friction:.3,restitution:.05}));

function box(w,h,d,color,x,y,z,rot=0,collide=false){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.82,metalness:.05}));
 m.position.set(x,y,z);m.rotation.y=rot;m.castShadow=true;m.receiveShadow=true;scene.add(m);
 if(collide){const b=new CANNON.Body({mass:0,material:groundMat,shape:new CANNON.Box(new CANNON.Vec3(w/2,h/2,d/2))});b.position.set(x,y,z);b.quaternion.setFromEuler(0,rot,0);world.addBody(b);}
 return m;
}
const ground=new THREE.Mesh(new THREE.PlaneGeometry(1200,1200),new THREE.MeshStandardMaterial({color:0x78956c,roughness:1}));
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const groundBody=new CANNON.Body({mass:0,material:groundMat,shape:new CANNON.Box(new CANNON.Vec3(600,.1,600))});
groundBody.position.y=-.1;world.addBody(groundBody);

function roadV(x,z,len=760){box(18,.035,len,0x303236,x,.02,z);for(let i=-Math.floor(len/10);i<Math.floor(len/10);i++)box(.16,.04,4,0xe6d28c,x,.045,z+i*10)}
function roadH(x,z,len=760){box(len,.035,18,0x303236,x,.02,z);for(let i=-Math.floor(len/10);i<Math.floor(len/10);i++)box(4,.04,.16,0xe6d28c,x+i*10,.045,z)}
function building(x,z,w,d,h,color){
 box(w,h,d,color,x,h/2,z,0,true);
 if(h>18)for(let y=7;y<h-2;y+=6)for(let ix=-w/2+3;ix<w/2-2;ix+=5){
  const win=new THREE.Mesh(new THREE.BoxGeometry(1.5,.8,.035),new THREE.MeshStandardMaterial({color:0x9fc4d8,metalness:.15,roughness:.25}));
  win.position.set(x+ix,y,z-d/2-.03);scene.add(win);
 }
}
function tree(x,z,s=1){
 box(.55*s,3*s,.55*s,0x69452d,x,1.5*s,z);
 const c=new THREE.Mesh(new THREE.IcosahedronGeometry(2.4*s,1),new THREE.MeshStandardMaterial({color:0x2d6a3a,roughness:1}));
 c.position.set(x,4.2*s,z);c.castShadow=true;scene.add(c);
}

function makeCity(){
 for(let x=-360;x<=360;x+=90){roadV(x,0);box(5,.12,760,0xb9b4a8,x-12,.08,0);box(5,.12,760,0xb9b4a8,x+12,.08,0)}
 for(let z=-330;z<=330;z+=90){roadH(0,z);box(760,.12,5,0xb9b4a8,0,.08,z-12);box(760,.12,5,0xb9b4a8,0,.08,z+12)}
 const palette=[0xd9c7ad,0xc8b08f,0xe2d8c7,0xb9a99a,0xd5a88d,0xbcc5b0,0xd8d0bb];
 for(let bx=-315;bx<=315;bx+=45)for(let bz=-285;bz<=285;bz+=45){
  if(Math.abs((bx+45)%90-45)<20||Math.abs((bz+45)%90-45)<20)continue;
  const w=30+Math.abs(bx*bz)%9,d=30+Math.abs(bx+bz)%8,h=10+(Math.abs(bx*3+bz)%7)*3;
  building(bx,bz,w,d,h,palette[Math.abs((bx+bz)/45)%palette.length|0]);
  if(Math.abs(bx)%135===0)tree(bx+19,bz+18,.85);
 }
 // Tagus waterfront
 const water=new THREE.Mesh(new THREE.PlaneGeometry(1200,300),new THREE.MeshStandardMaterial({color:0x3d87a8,roughness:.2,metalness:.15}));
 water.rotation.x=-Math.PI/2;water.position.set(0,-.03,560);scene.add(water);
 // Central green boulevard
 box(55,.06,500,0x597a55,0,.05,0);
 for(let z=-230;z<=230;z+=24){tree(-15,z,.55);tree(15,z+8,.55)}
 box(8,.08,500,0x8c8b84,0,.08,0);
 // Alfama-like hill block
 for(let i=0;i<30;i++){const x=-420+(i%6)*28,z=-260+Math.floor(i/6)*32;building(x,z,22,24,18+(i%4)*5,palette[i%palette.length])}
 // Plaza + castle silhouette
 box(100,.12,80,0xc5b79d,-210,.08,-210);
 for(let i=0;i<4;i++)box(8,25,8,0x88755f,-250+i*27,12,-235);
 box(55,12,28,0x8d7a63,-210,6,-235);
 for(let x=-330;x<=330;x+=45)for(let z=-330;z<=330;z+=90){
  box(.16,6,.16,0x252525,x,3,z);
  const lamp=new THREE.Mesh(new THREE.SphereGeometry(.32,8,8),new THREE.MeshBasicMaterial({color:0xffe4a3}));
  lamp.position.set(x,6,z);scene.add(lamp);
 }
 // Outer boundary
 box(760,8,6,0x55504a,0,4,-385,0,true);box(760,8,6,0x55504a,0,4,385,0,true);
 box(6,8,760,0x55504a,-385,4,0,0,true);box(6,8,760,0x55504a,385,4,0,0,true);
}
makeCity();

function makeCar(){
 if(carVisual)scene.remove(carVisual);wheelVisuals=[];
 const cfg=cars[selected],g=new THREE.Group();
 const paint=new THREE.MeshStandardMaterial({color:cfg.color,metalness:.55,roughness:.24});
 const dark=new THREE.MeshStandardMaterial({color:0x111318,metalness:.1,roughness:.3});
 const glass=new THREE.MeshStandardMaterial({color:0x182832,metalness:.15,roughness:.08,transparent:true,opacity:.86});
 const chrome=new THREE.MeshStandardMaterial({color:0xb8bec4,metalness:.85,roughness:.18});
 const body=new THREE.Mesh(new THREE.BoxGeometry(2.05,.55,4.55),paint);body.position.y=.68;body.castShadow=true;g.add(body);
 const nose=new THREE.Mesh(new THREE.BoxGeometry(1.9,.28,1.0),paint);nose.position.set(0,.5,1.75);g.add(nose);
 const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.72,.62,1.9),glass);cabin.position.set(0,1.08,-.18);g.add(cabin);
 const roof=new THREE.Mesh(new THREE.BoxGeometry(1.55,.12,1.45),paint);roof.position.set(0,1.42,-.22);g.add(roof);
 const splitter=new THREE.Mesh(new THREE.BoxGeometry(2.12,.09,.38),dark);splitter.position.set(0,.43,2.18);g.add(splitter);
 const rear=new THREE.Mesh(new THREE.BoxGeometry(2,.16,.5),dark);rear.position.set(0,.78,-2.12);g.add(rear);
 const spoiler=new THREE.Mesh(new THREE.BoxGeometry(1.65,.1,.55),paint);spoiler.position.set(0,1.18,-2.12);g.add(spoiler);
 for(const x of[-.92,.92])for(const z of[-1.5,1.5]){
  const w=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.24,20),dark);w.rotation.z=Math.PI/2;w.position.set(x,.43,z);w.castShadow=true;g.add(w);wheelVisuals.push(w);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.25,16),chrome);hub.rotation.z=Math.PI/2;hub.position.set(x,.43,z);g.add(hub);
 }
 for(const x of[-.62,.62]){
  const l=new THREE.Mesh(new THREE.BoxGeometry(.38,.12,.06),new THREE.MeshStandardMaterial({color:0xffffdd,emissive:0xffffaa,emissiveIntensity:2}));l.position.set(x,.72,2.28);g.add(l);
  const r=new THREE.Mesh(new THREE.BoxGeometry(.38,.12,.06),new THREE.MeshStandardMaterial({color:0xff2020,emissive:0xff0000,emissiveIntensity:1.2}));r.position.set(x,.76,-2.28);g.add(r);
 }
 carVisual=g;scene.add(g);
}

function setupVehicle(){
 if(vehicle){vehicle.removeFromWorld(world);vehicle=null;world.removeBody(chassis)}
 const cfg=cars[selected];
 chassis=new CANNON.Body({mass:cfg.mass,material:carMat,shape:new CANNON.Box(new CANNON.Vec3(1,.35,2.15))});
 chassis.position.set(0,1.1,40);chassis.angularDamping=.45;chassis.linearDamping=.08;world.addBody(chassis);
 vehicle=new CANNON.RaycastVehicle({chassisBody:chassis,indexRightAxis:0,indexUpAxis:1,indexForwardAxis:2});
 const wheel={radius:.36,directionLocal:new CANNON.Vec3(0,-1,0),suspensionStiffness:32,suspensionRestLength:.28,frictionSlip:5.2,dampingRelaxation:2.3,dampingCompression:4.5,maxSuspensionForce:100000,maxSuspensionTravel:.3,rollInfluence:.03,axleLocal:new CANNON.Vec3(1,0,0),chassisConnectionPointLocal:new CANNON.Vec3(),isFrontWheel:false,useCustomSlidingRotationalSpeed:true,customSlidingRotationalSpeed:-30};
 for(const[x,z,front]of[[-.9,1.45,true],[.9,1.45,true],[-.9,-1.45,false],[.9,-1.45,false]])vehicle.addWheel({...wheel,chassisConnectionPointLocal:new CANNON.Vec3(x,0,z),isFrontWheel:front});
 vehicle.addToWorld(world);makeCar();resetCar();
}
function resetCar(){chassis.position.set(0,1.1,40);chassis.quaternion.set(0,0,0,1);chassis.velocity.setZero();chassis.angularVelocity.setZero();chassis.force.setZero();chassis.torque.setZero();vehicle.wheelInfos.forEach(w=>{w.steering=0;w.engineForce=0;w.brake=0})}
setupVehicle();

function physicsInput(){
 if(paused)return;
 const cfg=cars[selected],forward=keys.w||keys.ArrowUp,reverse=keys.s||keys.ArrowDown,left=keys.a||keys.ArrowLeft,right=keys.d||keys.ArrowRight;
 const steer=(left?1:0)+(right?-1:0),speed=chassis.velocity.length(),sf=Math.min(speed/35,1),maxSteer=cfg.steer*(1-.28*sf);
 let engine=forward?-cfg.force:0;
 if(reverse)engine=speed<2?cfg.force*.55:0;
 vehicle.applyEngineForce(engine,2);vehicle.applyEngineForce(engine,3);
 const brake=(keys[' ']?700:0)+(reverse&&speed>=2?900:0);
 for(let i=0;i<4;i++)vehicle.setBrake(brake,i);
 vehicle.setSteeringValue(steer*maxSteer,0);vehicle.setSteeringValue(steer*maxSteer,1);
 const maxMps=cfg.max/3.6,fwd=chassis.vectorToWorldFrame(new CANNON.Vec3(0,0,1)),fs=chassis.velocity.dot(fwd);
 if(fs>maxMps)chassis.velocity.vsub(fwd.scale(fs-maxMps));
}
function sync(){
 carVisual.position.copy(chassis.position);carVisual.quaternion.copy(chassis.quaternion);
 vehicle.wheelInfos.forEach((w,i)=>{vehicle.updateWheelTransform(i);wheelVisuals[i].position.copy(w.worldTransform.position);wheelVisuals[i].quaternion.copy(w.worldTransform.quaternion)});
 speedEl.textContent=Math.round(chassis.velocity.length()*3.6);
}
function cameraUpdate(dt){
 const p=chassis.position,forward=new THREE.Vector3(0,0,1).applyQuaternion(carVisual.quaternion),target=new THREE.Vector3(p.x,p.y+.8,p.z);
 if(thirdPerson){camera.position.lerp(target.clone().addScaledVector(forward,-11).add(new THREE.Vector3(0,5,0)),1-Math.pow(.001,dt));camera.lookAt(target)}
 else{camera.position.lerp(target.clone().add(new THREE.Vector3(0,1,0)),1-Math.pow(.001,dt));camera.lookAt(target.clone().addScaledVector(forward,15))}
}
function loop(t){
 const dt=Math.min(.05,(t-last)/1000);last=t;
 if(!paused){accumulator+=dt;while(accumulator>=1/60){physicsInput();world.step(1/60);accumulator-=1/60}sync();cameraUpdate(dt)}
 renderer.render(scene,camera);requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function openPanel(){paused=true;panel.style.display='flex'}
function closePanel(){paused=false;panel.style.display='none'}
document.getElementById('settings').onclick=openPanel;
document.getElementById('resume').onclick=closePanel;
document.getElementById('reset').onclick=()=>{resetCar();closePanel()};
document.getElementById('camera').onclick=()=>thirdPerson=!thirdPerson;
document.getElementById('reload').onclick=()=>location.reload();

cars.forEach((c,i)=>{const b=document.createElement('button');b.className='carCard'+(i===0?' active':'');b.innerHTML='<b>'+c.name+'</b><small>'+c.max+' km/h</small>';b.onclick=()=>{selected=i;carNameEl.textContent=c.name;carsEl.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');setupVehicle()};carsEl.appendChild(b)});
addEventListener('keydown',e=>{keys[e.key]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key.toLowerCase()==='r')resetCar();if(e.key==='Escape')paused?closePanel():openPanel();if(e.key.toLowerCase()==='c')thirdPerson=!thirdPerson});
addEventListener('keyup',e=>keys[e.key]=false);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
