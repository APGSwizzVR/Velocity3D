export function buildLisbon(T,C,scene,world,groundMat){
 const box=(w,h,d,color,x,y,z,rot=0,solid=false)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color,roughness:.78,metalness:.08}));m.position.set(x,y,z);m.rotation.y=rot;m.castShadow=true;m.receiveShadow=true;scene.add(m);if(solid){const b=new C.Body({mass:0,material:groundMat,shape:new C.Box(new C.Vec3(w/2,h/2,d/2))});b.position.set(x,y,z);b.quaternion.setFromEuler(0,rot,0);world.addBody(b)}return m};
 const roadV=(x,z,l=760)=>{box(18,.04,l,0x303236,x,.02,z);for(let i=-l/20;i<l/20;i++)box(.12,.045,4,0xe6d28c,x,.05,z+i*20)};
 const roadH=(x,z,l=760)=>{box(l,.04,18,0x303236,x,.02,z);for(let i=-l/20;i<l/20;i++)box(4,.045,.12,0xe6d28c,x+i*20,.05,z)};
 const building=(x,z,w,d,h,col)=>{box(w,h,d,col,x,h/2,z,0,true);if(h>18)for(let y=7;y<h;y+=6)for(let ix=-w/2+3;ix<w/2;ix+=6){const win=new T.Mesh(new T.BoxGeometry(1.5,.8,.04),new T.MeshStandardMaterial({color:0x9dbfd0,roughness:.2,metalness:.2}));win.position.set(x+ix,y,z-d/2-.03);scene.add(win)}};
 const tree=(x,z,s=1)=>{box(.5*s,3*s,.5*s,0x67462e,x,1.5*s,z);const c=new T.Mesh(new T.IcosahedronGeometry(2.2*s,1),new T.MeshStandardMaterial({color:0x2e6d3d,roughness:1}));c.position.set(x,4*s,z);c.castShadow=true;scene.add(c)};
 const g=new T.Mesh(new T.PlaneGeometry(1600,1600),new T.MeshStandardMaterial({color:0x78956c,roughness:1}));g.rotation.x=-Math.PI/2;g.receiveShadow=true;scene.add(g);
 const gb=new C.Body({mass:0,material:groundMat,shape:new C.Box(new C.Vec3(800,.1,800))});gb.position.y=-.1;world.addBody(gb);
 for(let x=-360;x<=360;x+=90){roadV(x,0);box(5,.12,760,0xb9b4a8,x-12,.08,0);box(5,.12,760,0xb9b4a8,x+12,.08,0)}
 for(let z=-330;z<=330;z+=90)roadH(0,z);
 const pal=[0xd8c4a6,0xc8b18f,0xe0d5c4,0xb7aaa0,0xd5a28b,0xc3cdbb];
 for(let x=-315;x<=315;x+=45)for(let z=-285;z<=285;z+=45){if(Math.abs((x+45)%90-45)<20||Math.abs((z+45)%90-45)<20)continue;building(x,z,30,30,12+(Math.abs(x+z)%6)*3,pal[Math.abs(x+z)%pal.length]);if((x+z)%135===0)tree(x+18,z+18,.75)}
 // Alfama/Graça dense hillside-like skyline.
 for(let i=0;i<36;i++){const x=-420+(i%6)*30,z=-240+Math.floor(i/6)*32;building(x,z,24,26,18+(i%4)*4,pal[i%pal.length])}
 // Praça do Comércio and Rua Augusta arch.
 box(160,.08,90,0xc9c0ae,0,.04,330);for(const x of[-72,-54,-36,-18,18,36,54,72]){building(x,286,12,8,15,0xd7b56d)}
 box(10,25,8,0xe4dccb,0,12.5,286);box(44,7,8,0xe4dccb,0,21,286);
 // Jerónimos, Belém Tower and Discoveries.
 box(130,18,24,0xd7d0bf,-250,9,300);for(let x=-305;x<=-195;x+=22){box(5,10,2,0xbab2a0,x,8,288);const s=new T.Mesh(new T.ConeGeometry(2,7,6),new T.MeshStandardMaterial({color:0xc9c1b1}));s.position.set(x,20,288);scene.add(s)}
 box(18,25,18,0xd3c8b2,-300,12.5,365);for(const x of[-9,9])for(const z of[-9,9])box(5,7,5,0xb8ae9d,-300+x,27,365+z);box(12,25,8,0xd0c5b0,-210,12.5,365);box(22,6,8,0xd0c5b0,-210,23,365);
 // Tagus and 25 de Abril bridge.
 const water=new T.Mesh(new T.PlaneGeometry(1500,360),new T.MeshStandardMaterial({color:0x3c86a7,roughness:.2,metalness:.15}));water.rotation.x=-Math.PI/2;water.position.set(0,-.04,560);scene.add(water);
 box(520,3,10,0x9e302b,0,40,485);for(const x of[-190,190])box(8,150,10,0x9e302b,x,75,485);for(let x=-185;x<=185;x+=18){const c=new T.Mesh(new T.CylinderGeometry(.035,.035,65,6),new T.MeshBasicMaterial({color:0x4b1d1d}));c.position.set(x,72-Math.pow(Math.abs(x)/185,1.8)*35,485);scene.add(c)}
 // Cristo Rei silhouette across the river.
 box(30,35,22,0xb9b4aa,0,17.5,650);box(5,42,5,0xded8cc,0,56,650);box(4,28,3,0xded8cc,-10,58,650);box(4,28,3,0xded8cc,10,58,650);
 // Santa Justa lift and yellow trams.
 box(7,28,7,0x35393b,105,14,220);for(const [x,z,r] of[[-90,210,0],[90,120,Math.PI],[250,30,Math.PI/2]]){const tr=new T.Group();const m=new T.Mesh(new T.BoxGeometry(2.5,1.7,9),new T.MeshStandardMaterial({color:0xf1c40f}));m.position.y=1.15;tr.add(m);tr.position.set(x,0,z);tr.rotation.y=r;scene.add(tr)}
 // Larger outer districts.
 for(let x=-600;x<=600;x+=120)for(let z=-540;z<=540;z+=120){if(Math.abs(x)<390&&Math.abs(z)<390)continue;building(x+35,z+35,58,58,12+Math.abs((x+z)%5)*4,pal[Math.abs(x+z)%pal.length]);if((x+z)%240===0)tree(x+68,z+68,.8)}
 for(let z=-540;z<=540;z+=120)roadH(0,z,1250);
 // Edge barriers.
 box(1400,8,6,0x55504a,0,4,-700,0,true);box(1400,8,6,0x55504a,0,4,700,0,true);box(6,8,1400,0x55504a,-700,4,0,0,true);box(6,8,1400,0x55504a,700,4,0,0,true);
 return {box};
}
