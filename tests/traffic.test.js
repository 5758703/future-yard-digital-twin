import test from 'node:test'
import assert from 'node:assert/strict'
import { buildings } from '../src/data/campus.js'
import { samplePath, sampleCommuter, vehicleRoutes, commuterRoutes, WALK_SPEED, VEHICLES_PER_LANE } from '../src/data/traffic.js'
import { createTraffic } from '../src/scene/traffic.js'

const close = (a, b, tolerance = 1e-6) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`)
test('车辆两条车道沿中心线两侧反向行驶，闭环无位置跳跃', () => {
  const [inner, outer] = vehicleRoutes
  const top = path => Array.from({ length: 1000 }, (_, i) => samplePath(path, i / 1000 * path.length)).find(p => Math.abs(p.x) < 2 && p.z < -50)
  const a = top(inner), b = top(outer)
  close(a.z, -58.8); close(b.z, -63.2)
  assert.ok(a.dx > .99 && b.dx < -.99)
  for (const path of vehicleRoutes) {
    const start = samplePath(path, 0), end = samplePath(path, path.length - .001), repeated = samplePath(path, path.length)
    close(start.x, repeated.x); close(start.z, repeated.z)
    assert.ok(Math.hypot(start.x - end.x, start.z - end.z) < .002)
    assert.ok(start.dx * end.dx + start.dz * end.dz > .99)
    assert.ok(path.length / VEHICLES_PER_LANE > 50)
  }
  // Dense samples across all four bends: two vehicle envelopes remain separated.
  const points = vehicleRoutes.map(path => Array.from({ length: 800 }, (_, i) => samplePath(path, i / 800 * path.length)))
  let minimum = Infinity
  for (const p of points[0]) for (const q of points[1]) minimum = Math.min(minimum, Math.hypot(p.x - q.x, p.z - q.z))
  assert.ok(minimum > 4.3)
})

test('车流不穿楼，行人在人行道并只进入目标办公楼门洞', () => {
  for (const path of vehicleRoutes) for (let d = 0; d < path.length; d += .4) {
    const p = samplePath(path, d)
    for (const b of buildings) assert.ok(Math.abs(p.x - b.x) > b.width / 2 + 2.3 || Math.abs(p.z - b.z) > b.depth / 2 + 2.3)
  }
  for (const route of commuterRoutes) for (const path of [route.inbound, route.outbound]) {
    for (let d = 0; d <= path.length; d += .1) {
      const p = samplePath(path, d)
      assert.ok(p.z < -4.8 && p.x < 10 && p.x > -72, '行人没有走入中心道路或环路')
      for (const b of buildings) if (Math.abs(p.x - b.x) < b.width / 2 && Math.abs(p.z - b.z) < b.depth / 2) {
        assert.equal(b.id, route.id); assert.ok(Math.abs(p.x - b.x) < 1.4); assert.ok(p.z > route.front - 1.6)
      }
    }
    const end = samplePath(path, path.length); close(end.z, route.front - 1.4)
  }
})

test('上班进入、下班离开，双向循环在室内停留且隐藏重置', () => {
  for (const route of commuterRoutes) {
    const incoming = sampleCommuter(route, route.inbound.length / WALK_SPEED - 1, 0, 'arrival')
    const outgoing = sampleCommuter(route, 1, 0, 'departure')
    assert.equal(incoming.direction, 'in'); assert.equal(outgoing.direction, 'out')
    assert.ok(Math.cos(incoming.heading) < -.99 && Math.cos(outgoing.heading) > .99)
    assert.equal(sampleCommuter(route, route.inbound.length / WALK_SPEED + 2, 0, 'mixed').visible, false)
    assert.equal(sampleCommuter(route, route.inbound.length / WALK_SPEED + 19, 0, 'mixed').direction, 'out')
    for (const mode of ['arrival', 'departure']) {
      assert.equal(sampleCommuter(route, 0, 0, mode).visible, false)
      assert.equal(sampleCommuter(route, (mode === 'arrival' ? route.inbound : route.outbound).length / WALK_SPEED + 1, 0, mode).visible, false)
    }
  }
})

test('暂停冻结车轮、步态和门；隐藏楼层视图冻结模拟；倍速和帧率正确', () => {
  const sim = createTraffic(), second = createTraffic()
  const snapshot = s => JSON.stringify(s.root.toJSON())
  try {
    for (let i = 0; i < 60; i++) sim.update(1 / 60, { speed: 1 })
    for (let i = 0; i < 30; i++) second.update(1 / 30, { speed: 1 })
    close(sim.cars[0].group.position.distanceTo(second.cars[0].group.position), 0)
    close(sim.walkers[1].group.position.distanceTo(second.walkers[1].group.position), 0)
    const before = snapshot(sim)
    for (let i = 0; i < 10; i++) sim.update(.016, { running: false })
    assert.equal(snapshot(sim), before)
    const carPosition = sim.cars[0].group.position.clone()
    sim.update(.1, { visible: false }); sim.update(0, { visible: true })
    close(sim.cars[0].group.position.distanceTo(carPosition), 0)
    sim.update(.05, { speed: 2 }); second.update(.1, { speed: 1 })
    close(sim.cars[0].group.position.distanceTo(second.cars[0].group.position), 0)
    assert.equal(sim.cars.length, 16); assert.equal(sim.walkers.length, 24)
    assert.ok(sim.doors.every(d => d.openness > 0), '有人靠近门时门打开')
  } finally { sim.dispose(); second.dispose() }
})
