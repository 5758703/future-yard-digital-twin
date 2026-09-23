// Self-contained Blender-compatible GLB from the same spatial source of truth.
import { mkdirSync, writeFileSync } from 'node:fs'
import * as THREE from 'three'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { buildings, rooms, facilities, campus } from '../src/data/campus.js'

globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(buffer => { this.result = buffer; this.onloadend?.() }) }
}
const scene=new THREE.Scene(), cube=new THREE.BoxGeometry(1,1,1), materials=new Map()
scene.name='FY_Future_Yard'
scene.userData={campusId:campus.id,units:'meters',coordinateSystem:campus.coordinateSystem}
function box(parent,name,dimensions,position,color,metadata={}) {
  if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.65,metalness:.12}))
  const mesh=new THREE.Mesh(cube,materials.get(color));mesh.name=name;mesh.scale.set(...dimensions);mesh.position.set(...position);mesh.userData=metadata;parent.add(mesh);return mesh
}
const outdoor=new THREE.Group();outdoor.name='Outdoor';scene.add(outdoor)
box(outdoor,'Terrain',[181,.6,155],[0,-.6,5],'#49675d')
for(const [w,d,x,z] of [[166,9,0,-61],[166,9,0,48],[9,116,-79,-4],[9,116,79,-4],[149,8,0,1],[8,109,17,-5],[8,31,23,63]])box(outdoor,'Road',[w,.12,d],[x,-.2,z],'#364853')
for(let x=-73;x<80;x+=8)for(const z of [-61,48,1])box(outdoor,'Road marking',[3,.02,.15],[x,-.12,z],'#bdc9b7')
for(let i=0;i<8;i++)box(outdoor,'Zebra crossing',[.8,.02,5],[13+i*1.2,-.1,1],'#cad2c1')
box(outdoor,'Sports ground',[40,.15,18],[-43,.02,61],'#5e827b',{facilityId:'AS-01'})
for(const [w,d,x,z] of [[37,.15,-43,53.5],[37,.15,-43,68.5],[.15,15,-61.5,61],[.15,15,-24.5,61],[.15,15,-43,61]])box(outdoor,'Sports line',[w,.03,d],[x,.12,z],'#d5e0c5')
box(outdoor,'Reflection pool rim',[20,.25,14],[-4,0,62],'#8fa59d');box(outdoor,'Reflection pool',[18,.1,12],[-4,.2,62],'#407d8a')
const leaves=new THREE.MeshStandardMaterial({color:'#477767',roughness:.9}),crownGeometry=new THREE.IcosahedronGeometry(1.7,1)
for(let x=-70;x<77;x+=9)for(const z of [-70,76]){if(z===76&&x>13&&x<35)continue;box(outdoor,'Tree trunk',[.4,2.5,.4],[x,1.2,z],'#69694f');const crown=new THREE.Mesh(crownGeometry,leaves);crown.name='Tree canopy';crown.position.set(x,3,z);crown.scale.y=1.3;outdoor.add(crown)}
for(const [x,z] of [[-27,-30],[-28,-50],[11,-30],[65,-29],[-26,24],[29,29],[35,62],[64,62],[-66,9]]){box(outdoor,'Tree trunk',[.4,2.5,.4],[x,1.2,z],'#69694f');const crown=new THREE.Mesh(crownGeometry,leaves);crown.position.set(x,3,z);crown.scale.y=1.3;outdoor.add(crown)}
for(let i=0;i<9;i++){box(outdoor,'Parking marking',[2,.03,6],[34+i*4,0,58],'#abbcaf');if(i%3!==0){box(outdoor,'Vehicle body',[1.7,.8,3.6],[34+i*4,.5,58],i%2?'#b8c4bf':'#7b97a1');box(outdoor,'Vehicle cab',[1.5,.5,1.8],[34+i*4,1.1,58],'#416673')}}
for(const f of facilities.filter(f=>f.type==='hydrant'))box(outdoor,f.id,[.6,1.2,.6],f.position,'#ce785d',{facilityId:f.id})
box(outdoor,'Security booth',[4,3.3,4],[31,1.5,70],'#8caaa7');box(outdoor,'Gate barrier',[8,.15,.15],[22,1.2,70],'#d2bb83')
for(const b of buildings){
  const building=new THREE.Group();building.name=b.id;building.userData={buildingId:b.id};scene.add(building)
  box(building,`${b.id}_plinth`,[b.width+3,.2,b.depth+3],[b.x,0,b.z],'#889d94',{buildingId:b.id})
  for(let n=1;n<=b.floors;n++){
    const floorId=`${b.id}-F${n}`,floor=new THREE.Group();floor.name=floorId;floor.position.set(b.x,(n-1)*3.6,b.z);building.add(floor)
    const meta={buildingId:b.id,floorId,number:n,kind:'floor'}
    box(floor,`${floorId}_slab`,[b.width,.25,b.depth],[0,.2,0],'#b1c0bb',meta)
    for(const side of [-1,1]){
      const entrance = b.type==='office' && n===1 && side===1
      const sections = entrance ? [-1,1].map(s=>[(b.width-3.4)/2,s*(b.width+3.4)/4]) : [[b.width,0]]
      for(const [width,x] of sections){
        box(floor,`${floorId}_facade`,[width,2.92,.16],[x,1.8,side*b.depth/2],b.color,meta)
        box(floor,`${floorId}_windows`,[width-.4,1.55,.09],[x,1.8,side*(b.depth/2+.13)],'#406a7c',meta)
      }
      if(entrance)box(floor,`${floorId}_entrance_lintel`,[3.4,.36,.16],[0,3.08,b.depth/2],b.color,meta)
      box(floor,`${floorId}_side`,[.16,2.92,b.depth],[side*b.width/2,1.8,0],b.color,meta)
      for(let i=0;i<Math.floor(b.width/2.7);i++){const x=-b.width/2+1.2+i*2.7;if(entrance&&Math.abs(x)<1.8)continue;box(floor,`${floorId}_mullion`,[.16,2.92,.14],[x,1.8,side*(b.depth/2+.19)],'#adc0bd',meta)}
    }
    for(const r of rooms.filter(r=>r.floorId===floorId)){
      const metaRoom={...meta,roomId:r.id,kind:'room',area:r.area,use:r.use}
      box(floor,r.id,[r.width-.2,.08,r.depth-.2],[r.x-b.x,.38,r.z-b.z],'#75a39a',metaRoom)
      const vestibule=b.type==='office'&&n===1&&r.z>b.z&&Math.abs(r.x-b.x-r.width/2)<1
      box(floor,`${r.id}_partition`,[.12,2.7,r.depth-(vestibule?2.2:0)],[r.x-b.x-r.width/2,1.7,r.z-b.z-(vestibule?1.1:0)],'#c0ccc0',metaRoom)
      box(floor,`${r.id}_furniture`,[2,.6,b.type==='residential'?2.5:1.2],[r.x-b.x,.7,r.z-b.z],b.type==='residential'?'#cdd7c3':'#bdae8d',metaRoom)
    }
  }
  box(building,`${b.id}_roof`,[b.width+.4,.4,b.depth+.4],[b.x,b.floors*3.6,b.z],'#b2c0b9',{buildingId:b.id})
  for(let i=0;i<3;i++)box(building,`${b.id}_solar`,[4.5,.25,3.3],[b.x-6+i*5.5,b.floors*3.6+.4,b.z],'#345e73',{buildingId:b.id})
}
scene.updateMatrixWorld(true)
const glb=await new GLTFExporter().parseAsync(scene,{binary:true,onlyVisible:true})
mkdirSync('public/models',{recursive:true})
writeFileSync('public/models/future-yard.glb',Buffer.from(glb))
writeFileSync('public/models/manifest.json',JSON.stringify({source:'Three.js parameterized export, editable in Blender',units:'meters',coordinateSystem:campus.coordinateSystem,buildings:6,floors:37,rooms:296,model:'future-yard.glb'},null,2))
console.log(`Exported Blender-compatible GLB: ${(glb.byteLength/1024/1024).toFixed(2)} MB`)
