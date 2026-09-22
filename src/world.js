export function buildLisbon(T,C,scene,world,groundMat){
 const box=(w,h,d,color,x,y,z,rot=0,solid=false)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color,roughness:.72,metalness:.06}));m.position.set(x,y,z);m.rotation.y=rot;m.castShadow=true;m.receiveShadow=true;scene.add(m);if(solid){const b=new C.Body({mass:0,material:groundMat,shape:new C.Box(new C.Vec3(w/2,h/2,d/2))});b.position.set(x,y,z);b.quaternion.setFromEuler(0,rot,0);world.addBody(b)}return m};
 const plane=new T.Mesh(new T.PlaneGeometry(1500,1500),new T.MeshStandardMaterial({color:0x65755f,roughness:1}));plane.rotation.x=-Math.PI/2;plane.receiveShadow=true;scene.add(plane);
 const gb=new C.Body({mass:0,material:groundMat,shape:new C.Box(new C.Vec3(750,.1,750))});gb.position.y=-.1;world.addBody(gb);
 const roadMat=0x34383d,side=0xb6afa0,line=0xf4e7b4,white=0xf8f8f4,buildingCols=[0xd8c4a9,0xe6d5bd,0xc9d8d2,0xd8a98e,0xbfcbd0,0xe1c8c1];
 const road=(w,d,x,z,rot=0)=>{box(w,.035,d,roadMat,x,.02,z,rot);box(w+.45,.06,d+.45,side,x,.01,z,rot);for(let p=-Math.max(w,d)/2+8;p<Math.max(w,d)/2-8;p+=14){if(w>d)box(5,.018,.10,line,x+p,.055,z,rot);else box(.10,.018,5,line,x,.055,z+p,rot)}};
 const sidewalk=(w,d,x,z,rot=0)=>box(w,.12,d,0xa9a59b,x,.1,z,rot);
 // Main smooth boulevards with round intersections.
 for(let x=-420;x<=420;x+=140)road(22,1100,x,0);
 for(let z=-420;z<=420;z+=140)road(1100,22,0,z);
 for(let x=-350;x<=350;x+=140)for(let z=-350;z<=350;z+=140)sidewalk(34,34,x,z);
 // Diagonal avenues make the grid feel less artificial.
 for(let i=-2;i<=2;i++){const r=-.18+i*.02;road(18,950,i*180,0,r);road(950,18,0,i*180,r+Math.PI/2);}
 // Roundabouts.
 for(const [x,z] of [[0,0],[280,-280],[-280,280]]){const island=new T.Mesh(new T.CylinderGeometry(27,27,.16,48),new T.MeshStandardMaterial({color:0x6e8c62}));island.position.set(x,.08,z);island.receiveShadow=true;scene.add(island);box(2,.18,58,roadMat,x,.12,z);box(58,.18,2,roadMat,x,.12,z);}
 // Dense Lisbon blocks with varied heights and façades.
 for(let x=-620;x<=620;x+=56)for(let z=-620;z<=620;z+=56){
   if(Math.abs(x%140)<28||Math.abs(z%140)<28)continue;
   if(Math.abs(x)<100&&Math.abs(z)<100)continue;
   const h=10+((Math.abs(x*7+z*11)%26));const w=40,d=40,col=buildingCols[Math.abs((x+z)/56)%buildingCols.length|0];
   box(w,h,d,col,x,h/2,z,((x+z)%3)*.01,true);
   for(let yy=3;yy<h-1;yy+=3)for(let xx=-15;xx<=15;xx+=10){
     const win=new T.Mesh(new T.BoxGeometry(3,.9,.035),new T.MeshStandardMaterial({color:0x536875,roughness:.2,metalness:.1}));win.position.set(x+xx,yy,z-d/2-.03);scene.add(win);
   }
 }
 // Parque district: large green central park with paths and trees.
 box(250,.08,180,0x4e774f,-420,.06,390);for(let i=0;i<45;i++){const x=-520+(i%9)*25,z=320+Math.floor(i/9)*18;const trunk=box(.7,4,.7,0x68472c,x,2,z);const crown=new T.Mesh(new T.IcosahedronGeometry(4.5,1),new T.MeshStandardMaterial({color:0x2e6f42}));crown.position.set(x,6,z);crown.castShadow=true;scene.add(crown);}
 // Praça / historic centre.
 box(180,.08,120,0xb89f7f,-140,.07,140);box(10,24,8,0xd9c6aa,-140,12,80);box(54,6,8,0xd9c6aa,-140,21,80);box(4,18,4,0xd9c6aa,-162,10,80);box(4,18,4,0xd9c6aa,-118,10,80);
 // Tagus waterfront and promenade.
 const water=new T.Mesh(new T.PlaneGeometry(1300,330),new T.MeshStandardMaterial({color:0x347f9c,roughness:.18,metalness:.2}));water.rotation.x=-Math.PI/2;water.position.set(0,-.02,640);scene.add(water);
 box(1300,.35,18,0xd1c3a9,0,.2,470);
 // 25 de Abril inspired bridge.
 box(520,3,12,0x9d2e2e,0,65,535);for(const x of [-190,190])box(10,135,10,0x7f1e24,x,67,535);for(let x=-180;x<=180;x+=20)box(.7,65,.7,0x7f1e24,x,34,535);
 // Cristo Rei inspired silhouette.
 box(18,38,12,0xd6d0c0,0,19,680);box(4,18,3,0xd6d0c0,0,47,680);
 // Tram corridors and street furniture.
 for(const [x,z] of [[-280,-140],[140,280],[280,0],[-140,-280]]){box(3,.04,100,0x6f7275,x,.07,z);box(3,.04,100,0x6f7275,x+6,.07,z);box(12,.08,3,0xf1c40f,x,.5,z-52);box(12,.08,3,0xf1c40f,x,.5,z+52);}
 for(let x=-600;x<=600;x+=70)for(const z of [-55,55]){box(.22,5,.22,0x30343a,x,2.5,z);const lamp=new T.Mesh(new T.SphereGeometry(.28,8,8),new T.MeshStandardMaterial({color:0xfff2b0,emissive:0xffd77a,emissiveIntensity:1.4}));lamp.position.set(x,5.1,z);scene.add(lamp);}
 // Collision boundary.
 box(1400,8,6,0x555555,0,4,-700,0,true);box(1400,8,6,0x555555,0,4,700,0,true);box(6,8,1400,0x555555,-700,4,0,0,true);box(6,8,1400,0x555555,700,4,0,0,true);
 return {box};
}