import * as THREE from 'three'
import { ringPath, samplePath, sampleCommuter, vehicleRoutes, commuterRoutes, offices, VEHICLES_PER_LANE, PEOPLE_PER_OFFICE, VEHICLE_SPEED } from '../data/traffic.js'

export function createTraffic() {
  const root = new THREE.Group(), cars = [], walkers = [], doors = []
  root.name = 'Campus commuting simulation'
  const materials = new Map(), geometries = new Map()
  function material(color) {
    if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: .65, metalness: .15 }))
    return materials.get(color)
  }
  function box(parent, w, h, d, x, y, z, color) {
    const key = `${w}/${h}/${d}`
    if (!geometries.has(key)) geometries.set(key, new THREE.BoxGeometry(w, h, d))
    const mesh = new THREE.Mesh(geometries.get(key), material(color))
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh)
    return mesh
  }
  // A continuous asphalt band rounds the four road junctions; markings use its centre path.
  const outer = ringPath(-4.5).points, inner = ringPath(4.5).points, vertices = []
  for (let i = 1; i < outer.length; i++) {
    for (const p of [outer[i - 1], outer[i], inner[i], outer[i - 1], inner[i], inner[i - 1]]) vertices.push(p[0], .015, p[1])
  }
  const surface = new THREE.BufferGeometry(); surface.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); surface.computeVertexNormals()
  const roadMaterial = new THREE.MeshStandardMaterial({ color: '#354651', side: THREE.DoubleSide, roughness: .95 })
  const roadMesh = new THREE.Mesh(surface, roadMaterial); roadMesh.receiveShadow = true; root.add(roadMesh)
  const centre = ringPath()
  for (let d = 0; d < centre.length; d += 8) {
    const p = samplePath(centre, d), stripe = box(root, .15, .025, 2.7, p.x, .04, p.z, '#b8bca2')
    stripe.rotation.y = p.heading
  }
  // Sidewalks are raised above the adjacent road and remain clear of driving lanes.
  box(root, 81, .3, 3.2, -30.5, .15, -5.8, '#91a49b')
  box(root, 81, .08, .18, -30.5, .33, -4.2, '#cbd4c6')
  for (const office of offices) {
    const length = -5.8 - office.front + 1.6
    box(root, 3.2, .3, length, office.x, .15, -5.8 - length / 2, '#91a49b')
    box(root, 5.4, .1, 3.8, office.x, .28, office.front + .9, '#afbbb1')
    box(root, .18, 2.7, .22, office.x - 1.7, 1.68, office.front + .08, '#d0dcd4')
    box(root, .18, 2.7, .22, office.x + 1.7, 1.68, office.front + .08, '#d0dcd4')
    box(root, 4.8, .2, 2.3, office.x, 3.1, office.front + .8, '#648f94')
    box(root, 3.25, .16, .16, office.x, 2.97, office.front + .16, '#72e6cb')
    const panels = [-1, 1].map(side => {
      const mesh = box(root, 1.52, 2.5, .09, office.x + side * .78, 1.6, office.front + .08, '#387c8d')
      mesh.material = new THREE.MeshStandardMaterial({ color: '#80c9d2', transparent: true, opacity: .38, metalness: .2, roughness: .15, depthWrite: false })
      return { mesh, side }
    })
    doors.push({ ...office, panels, openness: 0 })
  }
  const wheelGeometry = new THREE.CylinderGeometry(.38, .38, .22, 10)
  wheelGeometry.rotateZ(Math.PI / 2)
  for (let lane = 0; lane < 2; lane++) for (let index = 0; index < VEHICLES_PER_LANE; index++) {
    const group = new THREE.Group(); root.add(group)
    const color = ['#d6e2df', '#629fba', '#d8a06a', '#81b6ab', '#ae9bb8', '#c2cfb0'][index % 6]
    box(group, 1.86, .62, 4.15, 0, .72, 0, color)
    box(group, 1.62, .65, 2.05, 0, 1.28, -.23, '#254b5b')
    box(group, 1.68, .12, 2.08, 0, 1.63, -.23, color)
    box(group, 1.65, .13, .14, 0, .59, 2.1, '#b9cbcc')
    for (const side of [-1, 1]) {
      box(group, .46, .18, .07, side * .59, .83, 2.09, '#fff2b4')
      box(group, .43, .18, .07, side * .61, .82, -2.09, '#ed735d')
      box(group, .07, .62, .12, side * .83, 1.29, -.2, color)
    }
    const wheels = []
    for (const x of [-.95, .95]) for (const z of [-1.3, 1.3]) {
      const wheel = new THREE.Mesh(wheelGeometry, material('#182833')); wheel.position.set(x, .4, z); group.add(wheel); wheels.push(wheel)
    }
    cars.push({ group, wheels, lane, phase: (index + lane * .5) / VEHICLES_PER_LANE })
  }
  const headGeometry = new THREE.SphereGeometry(.21, 8, 6)
  for (const route of commuterRoutes) for (let index = 0; index < PEOPLE_PER_OFFICE; index++) {
    const group = new THREE.Group(); root.add(group)
    const jacket = ['#7bd7c7', '#edb775', '#96b8de', '#dd947f', '#bbcda6', '#c5abda'][index % 6]
    box(group, .48, .59, .29, 0, 1.12, 0, jacket)
    const head = new THREE.Mesh(headGeometry, material('#dbb898')); head.position.y = 1.66; group.add(head)
    const limbs = []
    for (const side of [-1, 1]) {
      const leg = new THREE.Group(); leg.position.set(side * .14, .86, 0); group.add(leg)
      box(leg, .18, .65, .19, 0, -.33, 0, '#334b60'); box(leg, .2, .13, .32, 0, -.7, .05, '#1d303c')
      const arm = new THREE.Group(); arm.position.set(side * .32, 1.4, 0); group.add(arm)
      box(arm, .15, .52, .17, 0, -.25, 0, jacket); box(arm, .13, .13, .14, 0, -.55, 0, '#dbb898')
      if (side === 1 && index % 3 === 0) box(arm, .16, .3, .4, 0, -.77, 0, '#687a78')
      limbs.push({ leg, arm, side })
    }
    // Each person's opacity is independent; geometries and opaque vehicle materials remain shared.
    const privateMaterials = new Map()
    group.traverse(mesh => {
      if (!mesh.isMesh) return
      if (!privateMaterials.has(mesh.material)) { const m = mesh.material.clone(); m.transparent = true; privateMaterials.set(mesh.material, m) }
      mesh.material = privateMaterials.get(mesh.material)
    })
    walkers.push({ group, route, phase: index / PEOPLE_PER_OFFICE, limbs, materials: [...privateMaterials.values()] })
  }
  let elapsed = 0, pedestrianTime = 0, currentMode = 'mixed'
  function update(delta, { running = true, speed = 2, mode = 'mixed', visible = true } = {}) {
    root.visible = visible
    if (mode !== currentMode) { currentMode = mode; pedestrianTime = 0 }
    const dt = running && visible ? Math.max(0, Math.min(delta, .1)) * speed : 0
    elapsed += dt; pedestrianTime += dt
    for (const car of cars) {
      const path = vehicleRoutes[car.lane], distance = elapsed * VEHICLE_SPEED + car.phase * path.length, p = samplePath(path, distance)
      car.group.position.set(p.x, .07, p.z); car.group.rotation.y = p.heading
      for (const wheel of car.wheels) wheel.rotation.x = distance / .38
    }
    for (const person of walkers) {
      const p = sampleCommuter(person.route, pedestrianTime, person.phase, currentMode)
      person.group.visible = p.visible
      if (!p.visible) continue
      person.group.position.set(p.x, .34 + Math.sin(p.travelled * 10) * .018, p.z); person.group.rotation.y = p.heading
      for (const m of person.materials) { m.opacity = p.opacity; m.depthWrite = p.opacity > .98 }
      for (const limb of person.limbs) { limb.leg.rotation.x = Math.sin(p.travelled * 5.2) * .52 * limb.side; limb.arm.rotation.x = -limb.leg.rotation.x * .85 }
    }
    for (const door of doors) {
      const near = walkers.some(p => p.route.id === door.id && p.group.visible && Math.hypot(p.group.position.x - door.x, p.group.position.z - door.front) < 4.5)
      door.openness = THREE.MathUtils.damp(door.openness, near ? 1 : 0, 5, dt)
      for (const panel of door.panels) panel.mesh.position.x = door.x + panel.side * (.78 + door.openness * 1.55)
    }
  }
  function dispose() {
    root.removeFromParent()
    const allGeometry = new Set(geometries.values()), allMaterials = new Set(materials.values())
    root.traverse(o => { if (o.geometry) allGeometry.add(o.geometry); if (o.material) allMaterials.add(o.material) })
    for (const g of allGeometry) g.dispose()
    for (const m of allMaterials) m.dispose()
  }
  update(0)
  return { root, cars, walkers, doors, update, dispose }
}
