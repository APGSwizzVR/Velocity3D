let traffic=[],people=[],parked=[];
const carColors=[0xffffff,0x20242a,0xc92d2d,0x1e5fa8,0xd4b24c,0xeeeeee,0x4f5964,0x2d7d5a,0x7b4aa8,0x8d4b32,0x4c4c4c];
const skinColors=[0xf1c7a3,0xd99b72,0x8d5a3c,0x5b3926,0xf3d1b1],shirtColors=[0x26364c,0x9b3d3d,0x315c4b,0x76543b,0xd7a52b,0x6d6d78,0xe9e9e9,0x552c58],pantsColors=[0x222a35,0x394b62,0x4a3428,0x303030,0x6a5538];
function mat(T,c,r=.65,m=0){return new T.MeshStandardMaterial({color:c,roughness:r,metalness:m})}
function mesh(T,g,m){const o=new T.Mesh(g,m);o.castShadow=true;o.receiveShadow=true;return o}
function trafficCar(T,scene,x,z,rot,color){
 const g=new T.Group(),paint=mat(T,color,.32,.35),dark=mat(T,0x11151b,.3,.45),glass=mat(T,0x172633,.1,.28),rubber=mat(T,0x080808,1);
 const b=mesh(T,new T.BoxGeometry(2.05,.58,4.55),paint);b.position.y=.62;g.add(b);
 const low=mesh(T,new T.BoxGeometry(2.12,.20,4.25),dark);low.position.y=.43;g.add(low);
 const roof=mesh(T,new T.BoxGeometry(1.48,.58,1.72),glass);roof.position.set(0,1.05,-.18);g.add(roof);
 for(const x of[-.93,.93])for(const z of[-1.52,1.52]){const w=mesh(T,new T.CylinderGeometry(.34,.34,.24,16),rubber);w.rotation.z=Math.PI/2;w.position.set(x,.38,z);g.add(w)}
 for(const x of[-.62,.62]){const a=mesh(T,new T.BoxGeometry(.40,.13,.08),mat(T,0xf8fbff,.12,.15));a.position.set(x,.83,2.29);g.add(a);const t=mesh(T,new T.BoxGeometry(.40,.13,.08),mat(T,0xff2020,.2));t.position.set(x,.78,-2.29);g.add(t)}
 g.position.set(x,.02,z);g.rotation.y=rot;scene.add(g);return g
}
function person(T,scene,x,z,rot,v){
 const g=new T.Group(),skin=mat(T,skinColors[v.skin],.78),shirt=mat(T,shirtColors[v.shirt],.82),pants=mat(T,pantsColors[v.pants],.9),hair=mat(T,v.hair,.9);
 const add=(geo,m,px,py,pz)=>{const o=mesh(T,geo,m);o.position.set(px,py,pz);g.add(o);return o};
 add(new T.BoxGeometry(.48,.68,.30),shirt,0,1.02,0);add(new T.SphereGeometry(.22,12,10),skin,0,1.58,0);add(new T.BoxGeometry(.42,.13,.32),hair,0,1.76,0);
 const l=add(new T.CapsuleGeometry(.08,.42,5,8),skin,-.34,1.04,0),r=add(new T.CapsuleGeometry(.08,.42,5,8),skin,.34,1.04,0);
 for(const x of[-.13,.13]){add(new T.BoxGeometry(.17,.58,.20),pants,x,.43,0);add(new T.BoxGeometry(.18,.12,.29),mat(T,0x171717,1),x,.12,.04)}
 g.scale.setScalar(v.scale);g.position.set(x,0,z);g.rotation.y=rot;g.userData.legs=[l,r];scene.add(g);return g
}
function routeCar(T,scene,route,i){
 const p=route[i%route.length],next=route[(i+1)%route.length],g=trafficCar(T,scene,p.x,p.z,Math.atan2(next.x-p.x,next.z-p.z),carColors[i%carColors.length]);
 return {g,route,index:i%route.length,speed:7+(i%10)*1.1};
}
export function spawnTraffic(T,scene){
 traffic=[];people=[];parked=[];
 const routes=[];
 for(let z=-980;z<=980;z+=140)routes.push([{x:-1080,z},{x:1080,z}]);
 for(let x=-980;x<=980;x+=140)routes.push([{x,z:-1080},{x,z:1080}]);
 for(let k=0;k<routes.length;k++){const r=routes[k];for(let j=0;j<3;j++){const n=routeCar(T,scene,r,k*3+j);n.index=j%2;traffic.push(n)}}
 // parked vehicles around curbs
 for(let i=0;i<100;i++){const horizontal=i%2===0,x=-1040+(i*73)%2080,z=(i%4<2?34:-34);trafficCar(T,scene,x,z,z>0?0:Math.PI,carColors[(i+4)%carColors.length]);parked.push(1)}
 // pedestrians concentrated around central districts and also along waterfront/parks
 for(let i=0;i<90;i++){
  const v={skin:(i*3)%skinColors.length,shirt:(i*5)%shirtColors.length,pants:(i*7)%pantsColors.length,hair:[0x17120f,0x3a2418,0x6f5134,0x252525,0x9a7b52][i%5],scale:.88+(i%5)*.035};
  const px=-900+(i*97)%1800,pz=-900+(i*131)%1800,g=person(T,scene,px,pz,Math.random()*6.28,v);
  people.push({g,axis:i%3?'x':'z',dir:i%2?1:-1,speed:.45+(i%7)*.09,phase:i*.4});
 }
}
export function updateTraffic(dt,chassis,onFoot){
 for(const n of traffic){
  const a=n.route[n.index],b=n.route[(n.index+1)%n.route.length],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1;
  n.g.position.x+=dx/len*n.speed*dt;n.g.position.z+=dz/len*n.speed*dt;
  n.g.rotation.y=Math.atan2(dx,dz);
  const px=n.g.position.x-a.x,pz=n.g.position.z-a.z;if(Math.hypot(px,pz)>=len)n.index=(n.index+1)%n.route.length;
 }
 for(const p of people){
  const speed=p.speed*dt;if(p.axis==='x')p.g.position.x+=speed*p.dir;else p.g.position.z+=speed*p.dir;
  if(Math.abs(p.g.position.x)>1120||Math.abs(p.g.position.z)>1120)p.dir*=-1;
  if(Math.random()<dt*.10){p.axis=Math.random()>.5?'x':'z';p.dir=Math.random()>.5?1:-1}
  p.g.rotation.y=p.axis==='x'?(p.dir>0?Math.PI/2:-Math.PI/2):(p.dir>0?0:Math.PI);
  const swing=Math.sin(performance.now()*.01+p.phase)*.22;p.g.userData.legs[0].rotation.z=swing;p.g.userData.legs[1].rotation.z=-swing;
 }
}