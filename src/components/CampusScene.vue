<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { buildings, rooms, cameras, facilities, campus, evacuation, getRoom, telemetry } from '../data/campus.js'
import { useTwin } from '../composables/useTwin.js'
import { createTraffic } from '../scene/traffic.js'

const { state, selectBuilding, selectFloor, selectRoom, notify, openAlerts } = useTwin()
const host = ref(null), labels = ref([]), error = ref(''), ready = ref(false)
const hasImported=ref(false)
let scene, camera, renderer, controls, observer, frame, world, assets, route, imported, targetPosition, targetLook, lastTime = 0, disposed = false
let labelNodes = [], clickable = [], picks = [], down = null
const trafficRunning = ref(true), commuteMode = ref('mixed'), trafficSpeed = ref(2)
let traffic, previousFrame = null
const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2()
const caption = computed(() => state.evacuation ? '疏散推演 · 虚拟演练' : state.floor ? `${state.floor}F 空间剖切 · 点击房间查看详情` : state.buildingId ? '楼栋分层 · 点击楼层进入' : '院区实景沙盘 · 点击楼栋进入')
const materials = new Map()
function mat(color, options = {}) { const key = color + JSON.stringify(options); if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.12, ...options })); return materials.get(key) }
function box(parent, w, h, d, x, y, z, color, options = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, options)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m
}
function line(parent, points, color, opacity = 1) { const geometry = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p))); const object = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity })); parent.add(object); return object }
function removeGroup(group) { if (!group) return; scene.remove(group); group.traverse(o => { o.geometry?.dispose(); if (o.material && ![...materials.values()].includes(o.material)) { for (const m of (Array.isArray(o.material) ? o.material : [o.material])) { m.map?.dispose(); m.dispose() } } }) }
function roundedPath(x, z, w, d, y, color) { line(world, [[x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y,z+d/2],[x-w/2,y,z+d/2],[x-w/2,y,z-d/2]], color) }
function tree(x, z, size = 1) {
  box(world, .38, 2.8*size, .38, x, 1.5*size, z, '#625f4f')
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.8*size, 1), mat('#456f66')); crown.scale.y = 1.4; crown.position.set(x, 3.1*size, z); crown.castShadow = true; world.add(crown)
}
function makeCampus() {
  world = new THREE.Group(); scene.add(world)
  box(world, 183, 2, 157, 0, -1.5, 5, '#2b454b')
  box(world, 181, .3, 155, 0, -.35, 5, '#405c58')
  const grid = new THREE.GridHelper(240, 48, '#2a4554', '#243b49'); grid.position.y = -2.6; scene.add(grid)
  // Ring roads, a central fire lane and a pedestrian axis.
  for (const [w,d,x,z] of [[166,9,0,-61],[166,9,0,48],[9,116,-79,-4],[9,116,79,-4],[149,8,0,1],[8,109,17,-5],[8,31,23,63]]) box(world,w,.15,d,x,-.1,z,'#354651')
  for(let x=-73;x<80;x+=8) box(world,3,.02,.15,x,.02,1,'#9daea5')
  for(let i=0;i<7;i++) { box(world,.8,.02,5,13+i*1.3,.04,1,'#c1cdc0'); box(world,5,.02,.8,23,.04,46+i*1.2,'#c1cdc0') }
  // Landscaped planters frame the buildings.
  for(const b of buildings) { box(world,b.width+5,.25,b.depth+5,b.x,0,b.z,'#82958d'); box(world,b.width+3,.08,b.depth+3,b.x,.17,b.z,'#687e76') }
  for(let x=-69;x<76;x+=8) { tree(x,-70,.8); if(x<10 || x>35) tree(x,76,.85) }
  for(let z=-48;z<47;z+=10) { tree(-88,z,.7); tree(88,z,.7) }
  for(const [x,z] of [[-28,-17],[-26,-38],[-27,-50],[10,-22],[9,-45],[63,-45],[63,-26],[30,19],[29,34],[-28,27],[-27,37],[-66,9],[-61,55],[39,65],[55,65],[70,62],[4,14]]) tree(x,z,.85)
  // Sports and assembly ground.
  box(world,43,.18,19,-45,.12,62,'#566e72'); box(world,37,.1,15,-45,.26,62,'#577f79'); roundedPath(-45,62,35,13,.33,'#c3d8c9')
  line(world,[[-45,.34,55.5],[-45,.34,68.5]],'#c3d8c9')
  const circle = new THREE.EllipseCurve(-45,62,2.8,2.8,0,Math.PI*2,false,0); line(world,circle.getPoints(48).map(p=>[p.x,.34,p.y]),'#c3d8c9')
  // Reflecting pool and central garden.
  box(world,19,.4,13,-4,.1,62,'#859890'); box(world,17,.15,11,-4,.35,62,'#377e8b',{metalness:.5,roughness:.2})
  for(let i=0;i<3;i++) box(world,.2,.2,10,-10+i*6,.5,62,'#70afba')
  for(let i=0;i<10;i++) { const x=34+i*4; box(world,2,.03,6,x,.02,58,'#90a299'); if(i%3!==0) { box(world,1.7,.8,3.6,x,.55,58,['#738794','#c1c8bf','#617f88'][i%3]); box(world,1.55,.55,1.8,x,1.17,58,'#34515d') } }
  // Gate and security booth.
  box(world,4,3.3,4,31,1.7,70,'#879e9f'); box(world,4.4,.3,4.4,31,3.5,70,'#3a5661'); box(world,8,.15,.15,22,1.2,70,'#dbbf7b')
  for(const f of facilities.filter(f=>f.type==='hydrant')) { box(world,.6,1.1,.6,f.position[0],.65,f.position[2],'#e78368'); box(world,1,.2,.25,f.position[0],.9,f.position[2],'#e78368') }
  roundedPath(0,5,181,155,.05,'#73958b')
}
function addFloor(parent, b, number, y, detailed = false) {
  const group = new THREE.Group(); group.position.set(b.x,y,b.z); parent.add(group)
  const floorId = `${b.id}-F${number}`
  const slab = box(group,b.width,.25,b.depth,0,.2,0,'#9daeb0'); slab.userData = { kind:'floor',buildingId:b.id,number }; picks.push(slab)
  if (detailed) {
    box(group,b.width-1,.06,2.8,0,.36,0,'#779094')
    for (const r of rooms.filter(r=>r.floorId===floorId)) {
      const warning = openAlerts.value.some(a=>a.roomId===r.id)
      const selected = state.roomId === r.id
      const color = selected ? '#40c5b8' : warning ? '#df8e62' : state.layer === 'people' ? (r.occupants>r.capacity*.6 ? '#cc9b66' : '#5eaaa5') : state.layer === 'energy' ? (telemetry(r,0,state.controls[r.id]).power>1.7?'#d9a56d':'#6eaeb6') : '#779fa6'
      const mesh = box(group,r.width-.25,.16,r.depth-.25,r.x-b.x,.42,r.z-b.z,color); mesh.userData={kind:'room',id:r.id}; picks.push(mesh)
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), new THREE.LineBasicMaterial({color: selected?'#a4fff0':'#bfd8d5'})); edges.position.copy(mesh.position); group.add(edges)
      box(group,.14,1.4,r.depth,r.x-b.x-r.width/2,1.15,r.z-b.z,'#cad4d0')
      box(group,r.width,1.4,.14,r.x-b.x,1.15,r.z-b.z+(r.z<b.z?-1:1)*r.depth/2,'#cad4d0')
      for(const side of [-1,1])box(group,(r.width-1.4)/2,.85,.13,r.x-b.x+side*(r.width+1.4)/4,.8,r.z-b.z+(r.z<b.z?1:-1)*r.depth/2,'#b7c9c6')
      // Human-scale furniture for office and residential rooms.
      if(b.type==='residential') { box(group,2,.5,2.5,r.x-b.x-1,.75,r.z-b.z,'#d1d6c4'); box(group,1.8,.12,.5,r.x-b.x-1,1.05,r.z-b.z-0.8,'#edf0db'); box(group,1.3,1.8,.6,r.x-b.x+1.4,1.3,r.z-b.z-1.8,'#718b84') }
      else { box(group,2.3,.1,1.15,r.x-b.x,1.1,r.z-b.z,'#d4cab0'); box(group,.13,.65,.7,r.x-b.x-1,.75,r.z-b.z,'#617778'); box(group,.13,.65,.7,r.x-b.x+1,.75,r.z-b.z,'#617778'); box(group,.8,.55,.15,r.x-b.x,1.42,r.z-b.z-.2,'#314f5d'); box(group,.8,.4,.8,r.x-b.x,.65,r.z-b.z+1,'#4e717d') }
      labelNodes.push({ id:r.id, kind:'room', text:r.number, sub:r.use, position:new THREE.Vector3(r.x,y+1.8,r.z), warning, selected })
      if(state.showDevices) { const device = new THREE.Mesh(new THREE.SphereGeometry(.22,8,6),mat(warning?'#ff916c':'#5cf0ce',{emissive:warning?'#ae3423':'#187864',emissiveIntensity:.5})); device.position.set(r.x-b.x+1.5,1.5,r.z-b.z); group.add(device) }
    }
    for(const side of [-1,1]) for(let i=0;i<8;i++) box(group,1.1,.08, .28, side*(b.width/2-.7),.5+i*.08,-1+i*.28,'#d1d8c9')
  } else {
    const active = Boolean(state.buildingId)
    const floorRooms=rooms.filter(r=>r.floorId===floorId)
    const load=floorRooms.reduce((n,r)=>n+telemetry(r,0,state.controls[r.id]).power,0)/floorRooms.length
    const density=floorRooms.reduce((n,r)=>n+r.occupants/r.capacity,0)/floorRooms.length
    const tone = state.layer==='energy' ? (load>1.7?'#cd9b69':load>1.2?'#a1ac85':'#679ca9') : state.layer==='people' ? (density>.6?'#d0a46c':density>.4?'#8db29e':'#639ea6') : b.color
    const entrance = b.type === 'office' && number === 1
    const bodies = entrance ? [
      box(group,b.width-.45,2.92,b.depth-2.65,0,1.78,-1.1,tone),
      ...[-1,1].map(side=>box(group,(b.width-.45-3.4)/2,2.92,2.2,side*(b.width-.45+3.4)/4,1.78,b.depth/2-1.325,tone)),
      box(group,3.4,.36,2.2,0,3.06,b.depth/2-1.325,tone),
    ] : [box(group,b.width-.45,2.92,b.depth-.45,0,1.78,0,tone)]
    for(const body of bodies){body.userData={kind: active?'floor':'building',id:b.id,buildingId:b.id,number};picks.push(body)}
    for(const side of [-1,1]) {
      const glazing = entrance && side === 1 ? [-1,1].map(s=>[(b.width-.9-3.4)/2,s*(b.width-.9+3.4)/4]) : [[b.width-.9,0]]
      for(const [width,x] of glazing) box(group,width,1.55,.08,x,1.8,side*(b.depth/2-.15),state.night?'#b6b77f':'#3b6576',{metalness:.48,roughness:.23,emissive:state.night?'#867348':'#102b38',emissiveIntensity:state.night?.65:.1})
      for(let i=0;i<Math.floor(b.width/2.7);i++) { const x=-b.width/2+1.2+i*2.7;if(entrance&&side===1&&Math.abs(x)<1.8)continue;box(group,.16,2.92,.12,x,1.78,side*(b.depth/2-.08),'#a6bbbb') }
      box(group,.08,1.45,b.depth-.9,side*(b.width/2-.15),1.8,0,'#476f7e')
      for(let i=0;i<4;i++) box(group,.12,2.92,.2,side*(b.width/2-.08),1.78,-b.depth/2+2+i*4.5,'#a6bbbb')
    }
    if(active) labelNodes.push({id:floorId,kind:'floor',text:`${number}F`,sub:`${b.category}空间 · 8 间`,buildingId:b.id,number,position:new THREE.Vector3(b.x+b.width/2+3,y+1.5,b.z)})
  }
  return group
}
function rebuild() {
  if(!scene) return
  removeGroup(assets); removeGroup(route); assets = new THREE.Group(); scene.add(assets); labelNodes=[]; picks=[]
  world.visible=(!state.floor || state.evacuation)&&!(imported&&!state.buildingId)
  if(imported) imported.visible=!state.buildingId
  for(const b of buildings) {
    if(state.floor && state.buildingId!==b.id && !state.evacuation) continue
    if(state.buildingId && state.buildingId!==b.id && !state.evacuation) {
      const mesh=box(assets,b.width,b.floors*3.6,b.depth,b.x,b.floors*1.8,b.z,'#6c8890',{transparent:true,opacity:.12,depthWrite:false}); mesh.userData={kind:'building',id:b.id}; picks.push(mesh); continue
    }
    if(imported && !state.buildingId) {labelNodes.push({id:b.id,kind:'building',text:b.name,sub:`${b.code} · ${b.floors}F`,position:new THREE.Vector3(b.x,b.floors*3.6+3,b.z),warning:openAlerts.value.some(a=>getRoom(a.roomId)?.buildingId===b.id)});continue}
    const onlyFloor = state.floor && state.buildingId===b.id
    if(onlyFloor) addFloor(assets,b,state.floor,state.evacuation?(state.floor-1)*3.6:0,true)
    else {
      const explode=state.explode && state.buildingId===b.id
      for(let n=1;n<=b.floors;n++) addFloor(assets,b,n,(n-1)*(explode?5.8:3.6))
      const roofY = b.floors*(explode?5.8:3.6)-(explode?2.2:0)
      box(assets,b.width+.5,.45,b.depth+.5,b.x,roofY,b.z,'#afbfba')
      box(assets,b.width-2,.18,b.depth-2,b.x,roofY+.3,b.z,'#7e9691')
      for(let i=0;i<3;i++) {box(assets,4.6,.3,3.3,b.x-6+i*5.5,roofY+.65,b.z-3,'#2d586e'); box(assets,2,1.1,2.5,b.x-5+i*4.5,roofY+.9,b.z+3,'#a9bab7')}
      if(!state.buildingId) labelNodes.push({id:b.id,kind:'building',text:b.name,sub:`${b.code} · ${b.floors}F`,position:new THREE.Vector3(b.x,roofY+3,b.z),warning:openAlerts.value.some(a=>getRoom(a.roomId)?.buildingId===b.id)})
    }
  }
  if(imported && !state.buildingId) imported.traverse(o=>{if(o.isMesh) {const bId=o.userData.buildingId;if(bId) {o.userData.kind='building';o.userData.id=bId;picks.push(o)}}})
  if(state.showDevices && !state.floor) for(const c of cameras) {
    const marker=new THREE.Mesh(new THREE.OctahedronGeometry(1,0),mat('#70e4cb',{emissive:'#247863',emissiveIntensity:.4}));marker.position.set(...c.position);assets.add(marker)
    labelNodes.push({id:c.id,kind:'device',text:'监控',sub:c.label,position:new THREE.Vector3(c.position[0],5,c.position[2]),roomId:c.roomId})
  }
  if(state.layer==='people'&&!state.floor){
    for(const b of buildings){const out=state.visitors.some(v=>v.buildingId===b.id&&v.outside&&v.status==='在院');line(assets,[[b.x-b.width/2-2,.5,b.z-b.depth/2-2],[b.x+b.width/2+2,.5,b.z-b.depth/2-2],[b.x+b.width/2+2,.5,b.z+b.depth/2+2],[b.x-b.width/2-2,.5,b.z+b.depth/2+2],[b.x-b.width/2-2,.5,b.z-b.depth/2-2]],out?'#ff9c62':'#72bca8',.8)}
  }
  if(state.pipes) for(let i=0;i<3;i++) {
    const points=[[-77,.6+i*.25,-55],[-25,.6+i*.25,-55],[-25,.6+i*.25,43],[73,.6+i*.25,43]]
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'catmullrom',0)
    const pipe=new THREE.Mesh(new THREE.TubeGeometry(curve,40,.23,6,false),mat(['#54afdd','#e0ac6a','#c982cb'][i]));assets.add(pipe)
    for(const b of buildings) line(assets,[[b.x,.6,b.z],[-25,.6,b.z]],['#54afdd','#e0ac6a','#c982cb'][i])
  }
  if(state.evacuation && state.roomId) {
    const plan=evacuation(getRoom(state.roomId),state.blocked);route=new THREE.Group();scene.add(route)
    const curve=new THREE.CurvePath();for(let i=1;i<plan.points.length;i++)curve.add(new THREE.LineCurve3(new THREE.Vector3(...plan.points[i-1]),new THREE.Vector3(...plan.points[i])))
    route.add(new THREE.Mesh(new THREE.TubeGeometry(curve,100,.24,6,false),mat('#77f2b6',{emissive:'#32a572',emissiveIntensity:.8})))
    const end=plan.points.at(-1);for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.RingGeometry(2+i*1.4,2.3+i*1.4,40),new THREE.MeshBasicMaterial({color:'#8af3bb',side:THREE.DoubleSide,transparent:true,opacity:.7-i*.15}));ring.rotation.x=-Math.PI/2;ring.position.set(end[0],.45,end[2]);route.add(ring)}
    labelNodes.push({id:'assembly',kind:'info',text:'应急集合点',sub:'运动场',position:new THREE.Vector3(-43,3,61)})
  }
  clickable=picks
  flyTo()
}
function flyTo() {
  if(!camera) return
  const b=buildings.find(b=>b.id===state.buildingId)
  if(state.evacuation || !b) {targetPosition=new THREE.Vector3(144,145,178);targetLook=new THREE.Vector3(0,0,6)}
  else if(state.floor) {targetPosition=new THREE.Vector3(b.x+16,34,b.z+23);targetLook=new THREE.Vector3(b.x,0,b.z)}
  else {targetPosition=new THREE.Vector3(b.x+60,66,b.z+77);targetLook=new THREE.Vector3(b.x,b.floors*(state.explode?5.8:3.6)*.38,b.z)}
  if(camera.aspect<1.35)targetPosition.sub(targetLook).multiplyScalar(1.35/camera.aspect).add(targetLook)
}
function pickItem(data) { if(data.kind==='building') selectBuilding(data.id);else if(data.kind==='floor')selectFloor(data.buildingId,data.number);else if(data.kind==='room')selectRoom(data.id);else if(data.kind==='device') {selectRoom(data.roomId);notify('已定位监控关联空间')} }
function onDown(e){down={x:e.clientX,y:e.clientY}}
function onUp(e) {
  if(!down || Math.hypot(e.clientX-down.x,e.clientY-down.y)>5 || e.button!==0)return
  const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera)
  const hit=raycaster.intersectObjects(clickable,false)[0];if(hit)pickItem(hit.object.userData)
}
function render(time) {
  frame=requestAnimationFrame(render)
  const delta = previousFrame === null ? 0 : (time - previousFrame) / 1000; previousFrame = time
  traffic?.update(delta,{running:trafficRunning.value,speed:trafficSpeed.value,mode:commuteMode.value,visible:!state.floor&&!state.evacuation})
  if(targetPosition){camera.position.lerp(targetPosition,.065);controls.target.lerp(targetLook,.065);if(camera.position.distanceTo(targetPosition)<.08){targetPosition=null;targetLook=null}}
  controls.autoRotate=state.autoRotate;controls.update();renderer.render(scene,camera)
  if(time-lastTime>80){lastTime=time;const width=host.value.clientWidth,height=host.value.clientHeight;const projected=labelNodes.map(l=>{const p=l.position.clone().project(camera);return {...l,x:(p.x+1)/2*width,y:(1-p.y)/2*height,anchorX:(p.x+1)/2*width,anchorY:(1-p.y)/2*height,visible:p.z<1&&p.z>-1&&Math.abs(p.x)<.98&&Math.abs(p.y)<.95}})
    const positioned=[]
    for(const l of projected.filter(l=>l.visible&&l.kind==='building').sort((a,b)=>a.y-b.y)){
      for(let attempt=0;attempt<8;attempt++){if(!positioned.some(p=>Math.abs(p.x-l.x)<108&&Math.abs(p.y-l.y)<42))break;l.y+=43}
      l.y=Math.min(l.y,height-70);positioned.push(l)
    }
    labels.value=projected
  }
}
function resetView(){flyTo()}
function focusEntrance(){
  const b=buildings.find(b=>b.id===state.buildingId&&b.type==='office')||buildings[0]
  targetPosition=new THREE.Vector3(b.x+12,10,b.z+b.depth/2+22)
  targetLook=new THREE.Vector3(b.x,1.6,b.z+b.depth/2+2)
}
function zoom(value){targetPosition=null;camera.position.sub(controls.target).multiplyScalar(value).add(controls.target)}
async function importModel(file) {
  if(!file || !file.name.toLowerCase().endsWith('.glb')) { notify('请选择 Blender 导出的 .glb 文件');return }
  if(file.size>100*1024*1024){notify('模型文件请小于 100 MB');return}
  try {
    const loader=new GLTFLoader()
    // Self-contained GLB only: external references must never trigger network fetches.
    loader.manager.setURLModifier(url=>{if(!url.startsWith('blob:')&&!url.startsWith('data:'))throw new Error('仅支持资源内嵌的 GLB');return url})
    const gltf=await loader.parseAsync(await file.arrayBuffer(),'')
    if(disposed){gltf.scene.traverse(o=>o.geometry?.dispose());return}
    let count=0;gltf.scene.traverse(o=>{if(o.isMesh&&buildings.some(b=>b.id===o.userData.buildingId))count++})
    if(!count){gltf.scene.traverse(o=>{o.geometry?.dispose();for(const m of [o.material].flat().filter(Boolean))m.dispose()});notify('模型缺少有效 buildingId，请使用项目 Blender 脚本导出');return}
    removeGroup(imported);imported=gltf.scene;scene.add(imported);hasImported.value=true;selectBuilding(null);rebuild();notify(`已载入 ${file.name}，${count} 个空间构件已绑定`)
  }catch(e){notify(`模型载入失败：${e.message.slice(0,80)}`)}
}
function clearModel(){removeGroup(imported);imported=null;hasImported.value=false;rebuild();notify('已恢复程序化院区模型')}
defineExpose({resetView,zoom,importModel,clearModel,hasImported})
watch(()=>[state.buildingId,state.floor,state.roomId,state.explode,state.layer,state.showDevices,state.pipes,state.evacuation,state.blocked,openAlerts.value.length,state.visitors.map(v=>v.outside).join(',')],rebuild)
watch(()=>state.night,()=>{if(!scene)return;scene.background.set(state.night?'#111e2c':'#203341');scene.fog.color.copy(scene.background);rebuild()})
onMounted(()=>{
  try {
    scene=new THREE.Scene();scene.background=new THREE.Color('#203341');scene.fog=new THREE.Fog('#203341',250,550)
    camera=new THREE.PerspectiveCamera(39,1,.1,1000);camera.position.set(144,145,178)
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;host.value.prepend(renderer.domElement)
    scene.add(new THREE.HemisphereLight('#d9f1ff','#506b60',2.4));const sun=new THREE.DirectionalLight('#ffedcf',3.3);sun.position.set(-70,120,50);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-125;sun.shadow.camera.right=125;sun.shadow.camera.top=125;sun.shadow.camera.bottom=-125;sun.shadow.camera.far=350;sun.shadow.bias=-.001;scene.add(sun)
    controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.maxPolarAngle=Math.PI*.47;controls.minDistance=15;controls.maxDistance=370;controls.target.set(0,0,6);controls.autoRotateSpeed=.35;controls.addEventListener('start',()=>{targetPosition=null;targetLook=null})
    makeCampus();traffic=createTraffic();scene.add(traffic.root);rebuild();renderer.domElement.addEventListener('pointerdown',onDown);renderer.domElement.addEventListener('pointerup',onUp)
    observer=new ResizeObserver(()=>{const w=host.value.clientWidth,h=host.value.clientHeight;if(!h||!w)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);flyTo()});observer.observe(host.value)
    ready.value=true;frame=requestAnimationFrame(render)
  }catch(e){error.value='三维视图初始化失败，请启用浏览器硬件加速后刷新。空间树和管理功能仍可使用。';console.error(e)}
})
onBeforeUnmount(()=>{disposed=true;cancelAnimationFrame(frame);observer?.disconnect();controls?.dispose();traffic?.dispose();renderer?.domElement.removeEventListener('pointerdown',onDown);renderer?.domElement.removeEventListener('pointerup',onUp);scene?.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of [o.material].flat()){m.map?.dispose();m.dispose()}});renderer?.dispose();renderer?.forceContextLoss()})
</script>

<template>
  <div ref="host" class="scene-host" aria-label="可交互三维院区，支持通过左侧空间树进行键盘导航">
    <div v-if="error" class="scene-error">{{ error }}</div>
    <div v-if="ready" class="scene-labels">
      <svg class="label-leaders"><line v-for="label in labels.filter(l=>l.visible&&l.kind==='building')" :key="label.id" :x1="label.anchorX" :y1="label.anchorY" :x2="label.x" :y2="label.y-15"/></svg>
      <template v-for="label in labels" :key="label.id">
        <button v-if="label.visible && label.kind !== 'info'" :class="['map-label',label.kind,{ warning:label.warning,selected:label.selected }]" :style="{left:label.x+'px',top:label.y+'px'}" @click.stop="pickItem(label)">
          <span v-if="label.kind==='building'" class="label-dot"></span><strong>{{ label.text }}</strong><small>{{ label.sub }}</small>
        </button>
        <span v-else-if="label.visible" class="map-label info" :style="{left:label.x+'px',top:label.y+'px'}">{{ label.text }}</span>
      </template>
    </div>
    <div class="scene-caption"><span class="live-dot"></span>{{ caption }}</div>
    <div v-if="ready && !state.floor && !state.evacuation" class="traffic-controls" aria-label="通勤动画控制">
      <div class="traffic-title"><span :class="['live-dot', { paused: !trafficRunning }]"/>通勤模拟 <small>双向车流 · 16 辆 / 行人 · 24 人</small></div>
      <div class="traffic-actions">
        <select v-model="commuteMode" aria-label="通勤场景"><option value="mixed">双向通勤</option><option value="arrival">上班 · 进入办公楼</option><option value="departure">下班 · 离开办公楼</option></select>
        <select v-model.number="trafficSpeed" aria-label="动画速度"><option :value="1">1×</option><option :value="2">2×</option><option :value="4">4×</option></select>
        <button type="button" :aria-label="trafficRunning ? '暂停通勤动画' : '继续通勤动画'" @click="trafficRunning = !trafficRunning">{{ trafficRunning ? '暂停' : '继续' }}</button>
        <button type="button" aria-label="查看办公楼入口" @click="focusEntrance">入口</button>
      </div>
    </div>
    <div class="compass"><span>N</span><i></i><small>北</small></div>
    <div class="scene-scale"><i></i><span>{{ state.floor ? '5 m' : '20 m' }} · 示意比例</span></div>
    <div class="scene-help">左键旋转 <span>·</span> 右键平移 <span>·</span> 滚轮缩放</div>
  </div>
</template>
