export const campus = { id: 'FY', name: '未来院区', area: 28600, coordinateSystem: 'LOCAL_METERS_Y_UP', origin: [0, 0, 0], floorHeight: 3.6 }
export const buildings = [
  { id: 'A', name: '行政办公楼', type: 'office', category: '办公', floors: 8, x: -46, z: -29, width: 28, depth: 20, color: '#739fae', code: 'A01', manager: '张明' },
  { id: 'B', name: '研发办公楼', type: 'office', category: '办公', floors: 6, x: -8, z: -37, width: 26, depth: 20, color: '#86aab4', code: 'A02', manager: '李静' },
  { id: 'C', name: '人才公寓一期', type: 'residential', category: '住宅', floors: 10, x: 33, z: -30, width: 24, depth: 18, color: '#a5b9b9', code: 'B01', manager: '王宁' },
  { id: 'D', name: '人才公寓二期', type: 'residential', category: '住宅', floors: 8, x: 52, z: 20, width: 24, depth: 18, color: '#a5b9b9', code: 'B02', manager: '赵文' },
  { id: 'E', name: '生活服务中心', type: 'service', category: '配套', floors: 3, x: -47, z: 26, width: 30, depth: 22, color: '#a5b09a', code: 'C01', manager: '陈洁' },
  { id: 'F', name: '能源管理中心', type: 'utility', category: '配套', floors: 2, x: -6, z: 26, width: 24, depth: 18, color: '#9bacad', code: 'C02', manager: '刘洋' },
]

export function hash(value) { let n = 2166136261; for (const c of value) n = Math.imul(n ^ c.charCodeAt(0), 16777619); return n >>> 0 }
export function seeded(id, min, max) { return min + (hash(id) % 10000) / 10000 * (max - min) }
export function getBuilding(id) { return buildings.find(b => b.id === id) }
export const floors = buildings.flatMap(b => Array.from({ length: b.floors }, (_, i) => ({ id: `${b.id}-F${i + 1}`, buildingId: b.id, number: i + 1, height: campus.floorHeight, elevation: i * campus.floorHeight, grossArea: b.width * b.depth, name: `${i + 1}F`, capacity: b.type === 'residential' ? 32 : 96 })))
export const rooms = floors.flatMap(f => {
  const b = getBuilding(f.buildingId)
  return Array.from({ length: 8 }, (_, i) => {
    const number = `${f.number}${String(i + 1).padStart(2, '0')}`
    const id = `${b.id}-${number}`
    const width = (b.width - 1) / 4, depth = (b.depth - 3.4) / 2
    const use = b.type === 'residential' ? (i % 3 === 0 ? '双人公寓' : '单人公寓') : b.type === 'office' ? ['开放办公', '项目办公室', '会议室', '资料室'][i % 4] : b.type === 'service' ? ['员工餐厅', '后厨操作间', '活动室', '便利服务'][i % 4] : ['配电间', '水泵房', '空调机房', '控制室'][i % 4]
    const capacity = b.type === 'residential' ? (i % 3 === 0 ? 2 : 1) : b.type === 'office' ? 12 : 8
    return { id, buildingId: b.id, floorId: f.id, floor: f.number, number, name: `${number} ${use}`, use, width, depth, area: Number((width * depth).toFixed(1)), height: 3.3,
      x: b.x + (i % 4 - 1.5) * width, y: f.elevation, z: b.z + (i < 4 ? -1 : 1) * (depth / 2 + 1.7), capacity, occupants: Math.floor(seeded(id, 0, capacity + 1)), status: id === 'A-301' || id === 'C-502' || id === 'F-101' ? 'warning' : 'normal' }
  })
})
export function getRoom(id) { return rooms.find(r => r.id === id) }
export const deviceTypes = [ ['temperature', '温湿度传感器', '楼控'], ['smoke', '烟感探测器', '消防'], ['access', '智能门禁', '安防'], ['meter', '智能电表', '能源'], ['water', '智能水表', '能源'], ['hvac', 'VRV 空调', '楼控'], ['light', '智能照明', '楼控'] ]
export const devices = rooms.flatMap(r => deviceTypes.map(([type, label, system], i) => ({ id: `${r.id}:${type}`, roomId: r.id, buildingId: r.buildingId, floorId: r.floorId, type, label, system, online: hash(`${r.id}:${type}`) % 97 !== 0, position: [r.x + (i % 3 - 1) * 1.3, r.y + 2.5, r.z + (Math.floor(i / 3) - 1) * 1.2], installedAt: '2025-06-18', maintenanceAt: '2026-10-15' })))
export const cameras = buildings.map(b => ({ id: `${b.id}-CAM`, buildingId: b.id, roomId: `${b.id}-101`, label: `${b.name} · 大堂`, position: [b.x, 3, b.z + b.depth / 2 + 1], type: 'camera', online: true, system: '安防' }))
export const facilities = [
  { id: 'HY-01', type: 'hydrant', label: '室外消防栓 01', position: [-26, 0.7, 1], system: '消防', online: true },
  { id: 'HY-02', type: 'hydrant', label: '室外消防栓 02', position: [26, 0.7, 10], system: '消防', online: true },
  { id: 'AS-01', type: 'assembly', label: '应急集合点', position: [-43, 0.5, 61], system: '消防', online: true },
  { id: 'GT-01', type: 'gate', label: '南门访客闸机', position: [23, 1, 72], system: '安防', online: true },
]
export const initialAlerts = [
  { id: 'AL-001', roomId: 'A-301', deviceId: 'A-301:smoke', title: '烟感浓度异常', level: 'critical', system: '消防', detail: '烟感模拟值 0.18 dB/m，超过演示阈值 0.15 dB/m。请核实现场并检查探测器。', createdAt: '2026-09-23T09:42:18+08:00', status: 'new', history: [] },
  { id: 'AL-002', roomId: 'C-502', deviceId: 'C-502:access', title: '门禁长时间未关闭', level: 'warning', system: '安防', detail: '房门持续开启 180 秒；建议核实访客记录与门锁状态。', createdAt: '2026-09-23T09:38:06+08:00', status: 'new', history: [] },
  { id: 'AL-003', roomId: 'F-101', deviceId: 'F-101:meter', title: '配电负载偏高', level: 'warning', system: '能源', detail: '模拟配电负载达到额定容量的 86%；建议检查空调与照明调度。', createdAt: '2026-09-23T09:31:42+08:00', status: 'new', history: [] },
]

export function telemetry(room, tick = 0, control = {}) {
  const wave = Math.sin(tick / 5 + hash(room.id) % 13)
  const light = control.light ?? true, hvac = control.hvac ?? true, brightness = control.brightness ?? 100
  return { temperature: +((hvac ? (control.setpoint ?? 24) + seeded(room.id + 't', -.5, 1.5) : seeded(room.id + 't', 26, 29)) + wave * .4).toFixed(1), humidity: Math.round(seeded(room.id + 'h', 40, 62) + wave), co2: Math.round(seeded(room.id + 'c', 420, 810) + wave * 14), power: +(seeded(room.id + 'p', 0.3, 2.8) * (light ? .6 + brightness / 250 : 0.6) * (hvac ? 1 : 0.38)).toFixed(2), water: +seeded(room.id + 'w', 0.02, 0.6).toFixed(2), light, hvac, brightness, setpoint: control.setpoint ?? 24 }
}
export function energySeries(buildingId, kind = 'electricity', scope = {}) {
  const count = rooms.filter(r => (!buildingId || r.buildingId === buildingId) && (!scope.floor || r.floor === scope.floor) && (!scope.roomId || r.id === scope.roomId)).length
  return Array.from({ length: 24 }, (_, hour) => ({ hour, value: +(count * (kind === 'water' ? 0.015 : 0.58) * (0.35 + Math.max(0, Math.sin((hour - 5) * Math.PI / 18))) * seeded(`${buildingId || 'all'}-${hour}`, 0.85, 1.15)).toFixed(2) }))
}
export function hvacTelemetry(room, tick = 0, control = {}) {
  const current = telemetry(room, tick, control)
  const load = current.hvac ? Math.round(seeded(room.id + 'load', 32, 87) + Math.sin(tick / 8) * 3) : 0
  const cop = current.hvac ? +seeded(room.id + 'cop', 2.8, 4.8).toFixed(2) : 0
  return { load, cop, fanRpm: current.hvac ? Math.round(720 + load * 8) : 0, heatingKw: +(current.power * .28).toFixed(2), forecastLoad: Math.min(100, Math.round(load * 1.08)), risk: load > 80 || (current.hvac && cop < 3), lightLux: current.light ? 420 : 65 }
}
export function deviceReading(device, tick, controls = {}, alerts = []) {
  if (!device.online) return '离线，无实时读数'
  const r = getRoom(device.roomId)
  if (!r) return device.type === 'hydrant' ? '0.42 MPa' : '正常'
  const t = telemetry(r, tick, controls[r.id])
  const alarm = alerts.some(a => a.deviceId === device.id && !['resolved', 'closed'].includes(a.status))
  return ({ temperature: `${t.temperature} °C / ${t.humidity}%`, smoke: alarm ? '0.18 dB/m · 异常' : '0.02 dB/m', access: alarm ? '开启超时 · 180 s' : '已关闭', meter: `${t.power} kW`, water: `${t.water} m³/h`, hvac: t.hvac ? `运行 · ${t.setpoint} °C` : '已关闭', light: t.light ? '开启 · ' + Math.round(t.brightness * 4.2) + ' lx' : '关闭 · 65 lx', camera: '模拟通道在线' })[device.type] || '正常'
}
export const weatherForecast = [ {time:'12:00',temperature:27}, {time:'14:00',temperature:29}, {time:'16:00',temperature:28}, {time:'18:00',temperature:26} ]
export function transitionAlert(alert, action, actor = '运维值班员', note = '') {
  const transitions = { diagnose: ['new', 'diagnosed'], assign: ['diagnosed', 'assigned'], resolve: ['assigned', 'resolved'], close: ['resolved', 'closed'] }
  const rule = transitions[action]
  if (!rule || alert.status !== rule[0]) throw new Error('当前状态不支持此操作')
  if (action === 'resolve' && !note.trim()) throw new Error('请填写处理记录')
  return { ...alert, status: rule[1], assignee: action === 'assign' ? actor : alert.assignee, history: [...alert.history, { action, actor, note: note.trim(), at: new Date().toISOString() }] }
}
export function evacuation(room, blocked = false) {
  const b = getBuilding(room.buildingId)
  const side = blocked ? -1 : 1
  const stairX = b.x + side * (b.width / 2 - 1)
  const roadZ = b.z < 0 ? 1 : 48
  const points = [[room.x, room.y + 0.45, room.z], [room.x, room.y + 0.45, b.z], [stairX, room.y + 0.45, b.z], [stairX, 0.5, b.z], [stairX, 0.5, roadZ], [-24, 0.5, roadZ], [-24, 0.5, 61], [-43, 0.5, 61]]
  const distance = points.slice(1).reduce((sum, p, i) => sum + Math.hypot(...p.map((n, k) => n - points[i][k])), 0)
  const occupants = rooms.filter(r => r.buildingId === b.id).reduce((n, r) => n + r.occupants, 0)
  return { points, distance: Math.round(distance), seconds: Math.ceil(distance / 1.1 + occupants / (blocked ? 1.3 : 2.6)), occupants, capacity: blocked ? 78 : 156, stair: blocked ? '西侧备用楼梯' : '东侧疏散楼梯', assembly: '运动场集合点' }
}

