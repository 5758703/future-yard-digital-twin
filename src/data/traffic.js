// Metres, seconds, Y-up. Motion is sampled by distance, independent of frame rate.
export function makePath(points, closed = false) {
  const nodes = points.map(p => [...p])
  if (closed) nodes.push([...nodes[0]])
  const lengths = [0]
  for (let i = 1; i < nodes.length; i++) lengths.push(lengths[i - 1] + Math.hypot(nodes[i][0] - nodes[i - 1][0], nodes[i][1] - nodes[i - 1][1]))
  return { points: nodes, lengths, length: lengths.at(-1), closed }
}

export function samplePath(path, distance) {
  const d = path.closed ? ((distance % path.length) + path.length) % path.length : Math.max(0, Math.min(path.length, distance))
  let i = 1
  while (i < path.lengths.length - 1 && path.lengths[i] < d) i++
  const a = path.points[i - 1], b = path.points[i], span = path.lengths[i] - path.lengths[i - 1]
  const t = (d - path.lengths[i - 1]) / span, dx = (b[0] - a[0]) / span, dz = (b[1] - a[1]) / span
  return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, dx, dz, heading: Math.atan2(dx, dz) }
}

export const road = { left: -79, right: 79, top: -61, bottom: 48, radius: 8.2, laneOffset: 2.2 }

export function ringPath(offset = 0, reverse = false) {
  const { left, right, top, bottom, radius } = road
  const r = radius - offset, points = []
  for (const [cx, cz, start] of [[right - radius, top + radius, -Math.PI / 2], [right - radius, bottom - radius, 0], [left + radius, bottom - radius, Math.PI / 2], [left + radius, top + radius, Math.PI]]) {
    for (let i = 0; i <= 24; i++) {
      const angle = start + i / 24 * Math.PI / 2
      points.push([cx + r * Math.cos(angle), cz + r * Math.sin(angle)])
    }
  }
  return makePath(reverse ? points.reverse() : points, true)
}

export const vehicleRoutes = [ringPath(road.laneOffset), ringPath(-road.laneOffset, true)]
export const VEHICLES_PER_LANE = 8
export const PEOPLE_PER_OFFICE = 12
export const VEHICLE_SPEED = 5
export const WALK_SPEED = 1.25
export const offices = [
  { id: 'A', x: -46, front: -19, origin: -70 },
  { id: 'B', x: -8, front: -27, origin: 8.5 },
]

function walkPath(office, offset) {
  const z = -5.8, turn = office.origin < office.x ? 1 : -1, r = 1.4
  const points = [[office.origin, z], [office.x - turn * r, z]]
  for (let i = 1; i <= 12; i++) {
    const angle = i / 12 * Math.PI / 2
    points.push([office.x - turn * r + turn * r * Math.sin(angle), z - r + r * Math.cos(angle)])
  }
  points.push([office.x, office.front - 1.4])
  // Two separated streams on the same paved sidewalk, including the bend.
  return makePath(points.map((p, i) => {
    const prev = points[Math.max(0, i - 1)], next = points[Math.min(points.length - 1, i + 1)]
    const len = Math.hypot(next[0] - prev[0], next[1] - prev[1])
    return [p[0] - (next[1] - prev[1]) / len * offset, p[1] + (next[0] - prev[0]) / len * offset]
  }))
}
export const commuterRoutes = offices.map(office => ({ ...office, inbound: walkPath(office, .42), outbound: walkPath(office, -.42) }))

export function sampleCommuter(route, elapsed, phase = 0, mode = 'mixed') {
  const inward = route.inbound.length / WALK_SPEED, outward = route.outbound.length / WALK_SPEED
  const duration = mode === 'arrival' ? inward + 8 : mode === 'departure' ? outward + 8 : inward + 18 + outward + 8
  const t = ((elapsed + phase * duration) % duration + duration) % duration
  let direction, progress
  if (mode === 'arrival') { direction = 'in'; progress = t }
  else if (mode === 'departure') { direction = 'out'; progress = t }
  else if (t < inward) { direction = 'in'; progress = t }
  else if (t < inward + 18) return { visible: false, direction: 'in' }
  else { direction = 'out'; progress = t - inward - 18 }
  const path = direction === 'in' ? route.inbound : route.outbound
  const travelled = progress * WALK_SPEED
  if (travelled >= path.length) return { visible: false, direction }
  const distance = direction === 'in' ? travelled : path.length - travelled
  const sample = samplePath(path, distance)
  const opacity = Math.min(1, travelled / .7, (path.length - travelled) / .7)
  return { ...sample, visible: opacity > 0, opacity, direction, travelled, heading: sample.heading + (direction === 'out' ? Math.PI : 0) }
}
