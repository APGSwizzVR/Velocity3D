export function buildLisbon(T,C,scene,world,groundMat){
 const mat=(c,r=.72,m=.04)=>new T.MeshStandardMaterial({color:c,roughness:r,metalness:m});
 const box=(w,h,d,color,x,y,z,rot=0,solid=false,m=mat(color))=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.rotation.y=rot;o.castShadow=true;o.receiveShadow=true;scene.add(o);if(solid){const b=new C.Body({mass:0,material:groundMat,shape:new C.Box(new C.Vec3(w/2,h/2,d/2))});b.position.set(x,y,z);b.quaternion.setFromEuler(0,rot,0);world.addBody(b)}return o};
 const plane=new T.Mesh(new T.PlaneGeometry(2400,2400),mat(0x65745e,1));plane.rotation.x=-Math.PI/2;plane.receiveShadow=true;scene.add(plane);
 const gb=new C.Body({mass:0,material:groundMat,shape:new C.Box(new C.Vec3(1200,.1,1200))});gb.position.y=-.1;world.addBody(gb);
 const roadMat=mat(0x30343a,.95),curbMat=mat(0xa9a49b,.9),laneMat=mat(0xf4e6b2,.7),white=mat(0xf6f5ef,.65);
 const road=(w,d,x,z,rot=0)=>{box(w,.045,d,0x30343a,x,.02,z,rot,false,roadMat);box(w+.55,.12,d+.55,0xa7a29a,x,.055,z,rot);if(w>=d){for(let p=-w/2+10;p<w/2-8;p+=12)box(.10,.018,5,0xf0e7c7,x+p,.065,z,rot,false,laneMat)}else{for(let p=-d/2+10;p<d/2-8;p+=12)box(5,.018,.10,0xf0e7c7,x,.065,z+p,rot,false,laneMat)}};
 const cross=(x,z,rot=0)=>{for(let i=-4;i<=4;i++)box(1.1,.022,8,0xf4f4ee,x+i*2,z,rot,false,white)};
 const tree=(x,z,s=1)=>{box(.35*s,3*s,.35*s,0x68482f,x,1.5*s,z);const c=new T.Mesh(new T.IcosahedronGeometry(2.7*s,1),mat(0x2f7043,.95));c.position.set(x,4.1*s,z);c.castShadow=true;scene.add(c)};
 const lamp=(x,z)=>{box(.18,4.5,.18,0x252a2f,x,2.25,z);const l=new T.Mesh(new T.SphereGeometry(.23,8,8),mat(0xffe6a0,.35,0));l.material.emissive=new T.Color(0xffc75f);l.material.emissiveIntensity=1.3;l.position.set(x,4.65,z);scene.add(l)};
 // 2.4km city road network
 for(let p=-980;p<=980;p+=140){road(24,2100,p,0);road(2100,24,0,p)}
 for(let p=-910;p<=910;p+=280){road(18,2100,p,0);road(2100,18,0,p)}
 for(const [x,z] of [[0,0],[420,-420],[-420,420],[700,140],[-700,-140]]){const ring= new T.Mesh(new T.RingGeometry(30,58,48),mat(0x33373a,.9));ring.rotation.x=-Math.PI/2;ring.position.set(x,.08,z);scene.add(ring);const island=new T.Mesh(new T.CylinderGeometry(27,27,.18,40),mat(0x587b50,1));island.position.set(x,.1,z);scene.add(island);for(let a=0;a<8;a++)tree(x+Math.cos(a*.785)*16,z+Math.sin(a*.785)*16,.65)}
 // diagonal Lisbon-style connectors
 for(let i=-2;i<=2;i++){road(20,1550,i*340,0,-.18);road(1550,20,0,i*340,.18)}
 // urban blocks with street-level façades
 const cols=[0xd9c2a7,0xe4d1bb,0xc9d8d2,0xd7a18c,0xbfcbd0,0xe0c8c2,0xd2bd93,0xc8c3b7];
 for(let x=-1080;x<=1080;x+=70)for(let z=-1080;z<=1080;z+=70){
  if(Math.abs(x%140)<35||Math.abs(z%140)<35)continue;
  const historic=Math.abs(x)<360&&Math.abs(z)<360, h=historic?12+((x*3+z*5)%12+12):14+((Math.abs(x*11+z*7)%30));
  const w=58,d=58,col=cols[Math.abs((x+z)/70|0)%cols.length];
  box(w,h,d,col,x,h/2,z,((x+z)%5)*.01,true);
  // roof/parapet
  box(w+.8,.7,d+.8,0x8d7667,x,h+.35,z,0,false,mat(0x8d7667,.9));
  // windows and balconies on two sides
  for(let yy=3;yy<h-2;yy+=3.2)for(let xx=-20;xx<=20;xx+=10){
   const wm=mat((yy%6<3)?0x536b78:0x6b7d84,.25,.2);
   box(3,1.15,.08,0x516875,x+xx,yy,z-d/2-.06,0,false,wm);
   if(historic&&yy>5)box(3.8,.12,1.05,0x8a6f5e,x+xx,yy-1,z-d/2-.55);
  }
  for(let yy=4;yy<h-1;yy+=4)for(let xx=-20;xx<=20;xx+=10)box(.08,1.2,3,0x516875,x-w/2-.06,yy,z+xx,0,false,mat(0x516875,.25,.2));
 }
 // Baixa / historic core: narrower streets and plazas
 box(420,.08,300,0xb69e80,-160,.05,120);
 for(let x=-340;x<=20;x+=72)for(let z=-20;z<=260;z+=72)box(50,.10,50,0xc6ae92,x,.1,z);
 for(const [x,z] of [[-160,80],[-40,80],[-280,200]]){for(let a=0;a<4;a++)tree(x+(a-1.5)*9,z+(a%2)*10,.45)}
 // Alfama-style steep stepped lanes
 for(let i=0;i<12;i++){const x=-600+i*28,z=360+i*18;box(16,.20,70,0x9a8875,x,.2,z,-.28);for(let k=0;k<6;k++)box(14,.18,2.2,0xc3b29c,x,.35,z-28+k*11,-.28)}
 // Parks and gardens
 box(360,.08,230,0x4e774f,-760,.06,610);for(let i=0;i<95;i++){const x=-925+(i%19)*18,z=500+Math.floor(i/19)*22;tree(x,z,.55+(i%3)*.12)}
 box(280,.08,180,0x527a52,690,.06,-690);for(let i=0;i<55;i++)tree(570+(i%11)*24,-750+Math.floor(i/11)*24,.6);
 // waterfront, marina and docks
 const water=new T.Mesh(new T.PlaneGeometry(2200,390),mat(0x2d7896,.2,.3));water.rotation.x=-Math.PI/2;water.position.set(0,-.03,1060);scene.add(water);
 box(2200,.3,20,0xd0c2aa,0,.18,860);for(let x=-1000;x<=1000;x+=90){box(4,.25,26,0x80634c,x,.25,920);box(3,.25,70,0x80634c,x,.25,955)}
 for(let i=0;i<18;i++){box(18,.25,7,0xf2f2e8,-760+i*85,.4,940);box(18,.25,7,0x315d73,-760+i*85,.4,975)}
 // bridge and skyline landmarks
 box(620,3,14,0x9c3030,0,72,905);for(const x of[-260,260]){box(12,150,12,0x751f25,x,75,905);for(let k=-240;k<=240;k+=24)box(.65,75,.65,0x751f25,k,38,905)}
 box(20,42,14,0xd7d0bf,780,21,980);box(5,22,4,0xd7d0bf,780,53,980);
 // industrial waterfront
 for(let x=350;x<=950;x+=85)for(let z=720;z<=820;z+=55){const h=10+((x+z)%15);box(62,h,38,[0x7a6d62,0x8b8177,0x6f7478][((x+z)/5|0)%3],x,h/2,z,true);box(50,.6,28,0x50555a,x,h+.3,z)}
 // suburban edge: lower buildings and service roads
 for(let x=-1050;x<=1050;x+=105)for(let z=-1050;z<=1050;z+=105)if(Math.abs(x)>850||Math.abs(z)>850){box(70,5+Math.abs((x+z)%6),58,0xc4b9a7,x,4,z,0,false,mat(0xc4b9a7,.9));}
 // crossings, tram tracks, signs and street furniture on major corridors
 for(let p=-980;p<=980;p+=140){cross(p,12);cross(12,p,Math.PI/2);lamp(p,34);lamp(p,-34);lamp(34,p);lamp(-34,p)}
 for(const [x,z] of [[-420,0],[0,420],[420,0],[0,-420],[-700,280],[700,-280]]){box(2.6,.05,180,0x777777,x,.07,z);box(2.6,.05,180,0x777777,x+7,.07,z);for(let k=-70;k<=70;k+=35)box(10,.08,2.2,0xe9c51a,x,.22,z+k)}
 // shops, awnings, bollards
 for(let x=-1000;x<=1000;x+=100)for(const z of[-37,37]){box(8,5,1.2,0x7d4036,x,2.5,z);box(9,.4,3.2,0xe0b44c,x,5,z);for(let b=-3;b<=3;b+=2)box(.22,.9,.22,0x303030,x+b,z>0?-.7:.7,z>0?z+.9:z-.9)}
 // boundary colliders
 box(2400,8,6,0x555555,0,4,-1200,0,true);box(2400,8,6,0x555555,0,4,1200,0,true);box(6,8,2400,0x555555,-1200,4,0,0,true);box(6,8,2400,0x555555,1200,4,0,0,true);
 return {box};
}