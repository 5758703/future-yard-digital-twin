import { mkdirSync, writeFileSync } from 'node:fs'
import { campus, buildings, floors, rooms, devices, cameras, facilities } from '../src/data/campus.js'
mkdirSync('public/data', { recursive: true })
writeFileSync('public/data/campus.json', JSON.stringify({ campus, buildings, floors, rooms, devices, cameras, facilities }, null, 2))
console.log(`已导出 ${buildings.length} 栋 / ${floors.length} 层 / ${rooms.length} 间 / ${devices.length} 台房间设备`)
