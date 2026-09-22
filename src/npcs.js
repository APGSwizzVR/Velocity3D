let traffic=[],people=[],parked=[];
function car(T,scene,x,z,rot,color,scale=1){
 const g=new T.Group(),body=new T.Mesh(new T.BoxGeometry(1.9,.55,4.1),new T.MeshStandardMaterial({color,roughness:.4,metalness:.35}));body.position.y=.58;g.add(body);
 const glass=new T.Mesh(new T.BoxGeometry(1.55,.55,1.7),new T.MeshStandardMaterial({color:0x17242e,roughness:.12,metalness:.25}));glass.position.set(0,1.0,-.2);g.add(glass);
 for(const x of [-.82,.82])for(const z of [-1.35,1.35]){const w=new T.Mesh(new T.CylinderGeometry(.34,.34,.2,12),new T.MeshStandardMaterial({color:0x080808}));w.rotation.z=Math.PI/2;w.position.set(x,.34,z);g.add(w);}
 g.scale.setScalar(scale);g.position.set(x,.02,z);g.rotation.y=rot;g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});scene.add(g);return g;
}
export function spawnTraffic(T,scene){
 const cols=[0xffffff,0x20242a,0xc92d2d,0x1e5fa8,0xd4b24c,0xeeeeee,0x4f5964,0x2d7d5a];
 for(let i=0;i<32;i++){const lane=[-8,8][i%2],z=-560+(i*71)%1120,g=car(T,scene,lane,z,i%2?0:Math.PI,cols[i%cols.length],.9);traffic.push({g,z,speed:7+i%8,dir:i%2?1:-1});}
 for(let i=0;i<30;i++){const x=-620+(i*83)%1240,z=[-26,26][i%2],rot=z>0?Math.PI:0;parked.push(car(T,scene,x,z,rot,cols[(i+2)%cols.length],.92));}
 for(let i=0;i<24;i++){const x=-500+(i*91)%1000,z=-500+((i*137)%1000);const g=new T.Group();const body=new T.Mesh(new T.BoxGeometry(.34,.7,.25),new T.MeshStandardMaterial({color:[0x26364c,0x9b3d3d,0x315c4b,0x76543b][i%4]}));body.position.y=.7;g.add(body);const head=new T.Mesh(new T.SphereGeometry(.15,10,8),new T.MeshStandardMaterial({color:0xf1b38d}));head.position.y=1.22;g.add(head);g.position.set(x,0,z);scene.add(g);people.push({g,x,z,axis:i%2?'x':'z',dir:i%2?1:-1,speed:.7+(i%4)*.2});}
}
export function updateTraffic(dt,chassis,onFoot){
 for(const n of traffic){n.z+=n.speed*n.dir*dt;if(n.z>610)n.z=-610;if(n.z<-610)n.z=610;n.g.position.z=n.z;}
 for(const p of people){if(p.axis==='x')p.g.position.x+=p.speed*p.dir*dt;else p.g.position.z+=p.speed*p.dir*dt;if(p.g.position.x>620||p.g.position.x<-620)p.dir*=-1;if(p.g.position.z>620||p.g.position.z<-620)p.dir*=-1;p.g.rotation.y=p.axis==='x'?(p.dir>0?Math.PI/2:-Math.PI/2):(p.dir>0?0:Math.PI);}
}