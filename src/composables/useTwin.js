import { computed, reactive, ref } from 'vue'
import { buildings, rooms, devices, initialAlerts, getBuilding, getRoom, telemetry, transitionAlert } from '../data/campus.js'

const KEY = 'future-yard-twin-v1'
function readSaved() { try { const value = JSON.parse(localStorage.getItem(KEY) || '{}'); return value && typeof value === 'object' ? value : {} } catch { return {} } }
const saved = readSaved()
const validStatuses = ['new', 'diagnosed', 'assigned', 'resolved', 'closed']
const state = reactive({
  buildingId: null, floor: null, roomId: null, module: 'overview', layer: 'normal', explode: false, night: false, autoRotate: false, showDevices: false, pipes: false, evacuation: false, blocked: false,
  controls: saved.controls && typeof saved.controls === 'object' && !Array.isArray(saved.controls) ? saved.controls : {},
  alerts: initialAlerts.map(a => { const s = Array.isArray(saved.alerts) ? saved.alerts.find(x => x?.id === a.id && validStatuses.includes(x.status) && Array.isArray(x.history)) : null; return s ? { ...a, status: s.status, history: s.history, assignee: s.assignee } : structuredClone(a) }),
  visitors: Array.isArray(saved.visitors) ? saved.visitors.filter(v => v && typeof v.name === 'string' && getBuilding(v.buildingId)).slice(0, 100) : [{ id: 'V-001', name: '陈访客', company: '协作科技', buildingId: 'A', status: '在院', at: '09:18', outside: false }],
})
const tick = ref(0), now = ref(new Date()), toast = ref(''), modal = ref(null), selectedAlertId = ref(null)
let toastTimer
function notify(message) { toast.value = message; clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.value = '', 3500) }
function persist() { try { localStorage.setItem(KEY, JSON.stringify({ controls: state.controls, alerts: state.alerts, visitors: state.visitors })) } catch { notify('浏览器存储不可用，本次操作仅在当前会话保留') } }
function selectBuilding(id) { if (id && !getBuilding(id)) return; state.buildingId = id; state.floor = null; state.roomId = null; state.evacuation = false; state.explode = Boolean(id) }
function selectFloor(buildingId, number) { const b = getBuilding(buildingId); if (!b || number < 1 || number > b.floors) return; state.buildingId = buildingId; state.floor = number; state.roomId = null; state.explode = false; state.evacuation = false }
function selectRoom(id) { const r = getRoom(id); if (!r) return; state.buildingId = r.buildingId; state.floor = r.floor; state.roomId = id; state.explode = false }
function locateAlert(alert) { selectRoom(alert.roomId); selectedAlertId.value = alert.id; state.showDevices = true; notify(`已定位 ${getBuilding(getRoom(alert.roomId).buildingId).name} · ${getRoom(alert.roomId).number} 室`) }
function controlRoom(id, patch) {
  if (!getRoom(id)) return
  const normalized = {}
  for (const key of ['light', 'hvac']) if (typeof patch[key] === 'boolean') normalized[key] = patch[key]
  if (Number.isFinite(patch.setpoint)) normalized.setpoint = Math.min(30, Math.max(16, Math.round(patch.setpoint)))
  if (Number.isFinite(patch.brightness)) normalized.brightness = Math.min(100, Math.max(10, Math.round(patch.brightness)))
  state.controls[id] = { ...state.controls[id], ...normalized }; persist()
}
function advanceAlert(id, action, actor, note) { const index = state.alerts.findIndex(a => a.id === id); if (index < 0) return; try { state.alerts[index] = transitionAlert(state.alerts[index], action, actor, note); persist(); notify('处置记录已保存') } catch (e) { notify(e.message) } }
function addVisitor(value) { if (!value.name.trim() || !getBuilding(value.buildingId)) return false; state.visitors.unshift({ ...value, name: value.name.trim(), id: `V-${Date.now()}`, at: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), status: '在院', outside: false }); persist(); return true }
function toggleVisitor(id) { const v = state.visitors.find(v => v.id === id); if (!v) return; v.outside = !v.outside; persist(); notify(v.outside ? '模拟越界事件：访客偏离授权区域' : '访客已返回授权区域') }
const building = computed(() => getBuilding(state.buildingId))
const room = computed(() => getRoom(state.roomId))
const scopedRooms = computed(() => rooms.filter(r => (!state.buildingId || r.buildingId === state.buildingId) && (!state.floor || r.floor === state.floor) && (!state.roomId || r.id === state.roomId)))
const openAlerts = computed(() => state.alerts.filter(a => a.status !== 'closed'))
const metrics = computed(() => { const list = scopedRooms.value; return { area: list.reduce((n, r) => n + r.area, 0), people: list.reduce((n, r) => n + r.occupants, 0), power: list.reduce((n, r) => n + telemetry(r, tick.value, state.controls[r.id]).power, 0), water: list.reduce((n, r) => n + telemetry(r, tick.value, state.controls[r.id]).water, 0), rooms: list.length } })
export function useTwin() { return { state, tick, now, toast, modal, selectedAlertId, building, room, scopedRooms, openAlerts, metrics, notify, persist, selectBuilding, selectFloor, selectRoom, locateAlert, controlRoom, advanceAlert, addVisitor, toggleVisitor, buildings, rooms, devices } }
