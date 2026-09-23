import test from 'node:test'
import assert from 'node:assert/strict'
import { buildings, floors, rooms, devices, initialAlerts, getRoom, telemetry, transitionAlert, evacuation, energySeries, hvacTelemetry, deviceReading } from '../src/data/campus.js'

test('空间与设备 ID 唯一，关联完整，房间物理空间不越出建筑', () => {
  const all = [...buildings, ...floors, ...rooms, ...devices]
  assert.equal(new Set(all.map(x => x.id)).size, all.length)
  assert.equal(floors.length, 37); assert.equal(rooms.length, 296)
  for (const r of rooms) { const b = buildings.find(b => b.id === r.buildingId); assert.ok(floors.some(f => f.id === r.floorId)); assert.ok(Math.abs(r.x - b.x) + r.width / 2 <= b.width / 2 + 1e-9); assert.ok(Math.abs(r.z - b.z) + r.depth / 2 <= b.depth / 2 + 1e-9); assert.ok(r.occupants <= r.capacity); assert.ok(r.area > 0) }
  for (const d of devices) assert.ok(getRoom(d.roomId))
})
test('控制影响房间模拟功率，遥测保持有效数值', () => {
  for (const r of rooms) { const on = telemetry(r, 10), off = telemetry(r, 10, { light: false, hvac: false }); assert.ok(off.power < on.power); assert.equal(off.hvac, false); for (const key of ['temperature','humidity','co2','power','water']) assert.ok(Number.isFinite(on[key])) }
})
test('告警闭环强制按序流转并保留审计记录', () => {
  let a = structuredClone(initialAlerts[0])
  assert.throws(() => transitionAlert(a, 'close'))
  a = transitionAlert(a, 'diagnose', '值班员', '已核实传感器')
  a = transitionAlert(a, 'assign', '张工')
  assert.equal(a.assignee, '张工'); assert.throws(() => transitionAlert(a, 'resolve', '张工', ' '))
  a = transitionAlert(a, 'resolve', '张工', '更换故障传感器，模拟值恢复')
  a = transitionAlert(a, 'close', '值班员', '已复核')
  assert.equal(a.status, 'closed'); assert.equal(a.history.length, 4)
  assert.throws(() => transitionAlert(a, 'assign'))
})
test('疏散备用路径避开原楼梯，容量下降并计入排队时间', () => {
  for (const r of [getRoom('A-301'), getRoom('C-502')]) { const a = evacuation(r), b = evacuation(r, true); assert.notEqual(a.points[2][0], b.points[2][0]); assert.ok(b.capacity < a.capacity); assert.ok(b.seconds > b.distance / 1.1); assert.ok(b.seconds - b.distance / 1.1 > a.seconds - a.distance / 1.1); assert.deepEqual(a.points.at(-1), [-43, 0.5, 61]); assert.deepEqual(a.points[0], [r.x, r.y + 0.45, r.z]) }
})
test('历史曲线遵循楼栋、楼层和房间作用范围', () => {
  const sum=series=>series.reduce((s,d)=>s+d.value,0)
  const building=sum(energySeries('A')), floor=sum(energySeries('A','electricity',{floor:3})), room=sum(energySeries('A','electricity',{floor:3,roomId:'A-301'}))
  assert.ok(Math.abs(building/floor-8)<.02);assert.ok(Math.abs(floor/room-8)<.05)
  assert.equal(sum(energySeries('A','electricity',{roomId:'C-502'})),0)
})
test('暖通停机归零、设温影响室温、告警闭环恢复设备读数', () => {
  const r=getRoom('A-301'),off=hvacTelemetry(r,0,{hvac:false})
  assert.equal(off.load,0);assert.equal(off.fanRpm,0);assert.equal(off.cop,0)
  assert.ok(telemetry(r,0,{setpoint:28}).temperature>telemetry(r,0,{setpoint:20}).temperature)
  assert.ok(telemetry(r,0,{brightness:30}).power<telemetry(r,0,{brightness:100}).power)
  const smoke=devices.find(d=>d.id==='A-301:smoke')
  assert.match(deviceReading(smoke,0,{},initialAlerts),/异常/)
  assert.equal(deviceReading(smoke,0,{},initialAlerts.map(a=>({...a,status:'closed'}))),'0.02 dB/m')
})
