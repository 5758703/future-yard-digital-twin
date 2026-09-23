import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildings, floors, rooms } from '../src/data/campus.js'

test('交付 GLB 合法、内嵌资源并完整保留空间 ID', () => {
  const binary=readFileSync(new URL('../public/models/future-yard.glb',import.meta.url))
  assert.equal(binary.toString('utf8',0,4),'glTF')
  assert.equal(binary.readUInt32LE(4),2)
  assert.equal(binary.readUInt32LE(8),binary.length)
  const json=JSON.parse(binary.subarray(20,20+binary.readUInt32LE(12)).toString())
  assert.equal(json.asset.version,'2.0')
  assert.ok(json.buffers.every(b=>!b.uri))
  for(const [key,list] of [['buildingId',buildings],['floorId',floors],['roomId',rooms]]){
    const actual=new Set(json.nodes.map(n=>n.extras?.[key]).filter(Boolean))
    assert.deepEqual(actual,new Set(list.map(x=>x.id)))
  }
})

test('GLB 办公楼首层门洞与通勤路径对齐，停车位退出环路', () => {
  const binary=readFileSync(new URL('../public/models/future-yard.glb',import.meta.url))
  const json=JSON.parse(binary.subarray(20,20+binary.readUInt32LE(12)).toString())
  const transform=n=>n.matrix?{p:n.matrix.slice(12,15),s:[n.matrix[0],n.matrix[5],n.matrix[10]]}:{p:n.translation||[0,0,0],s:n.scale||[1,1,1]}
  for(const b of buildings.filter(b=>b.type==='office')) {
    const parts=json.nodes.filter(n=>n.mesh!==undefined&&n.extras?.floorId===`${b.id}-F1`)
    for(const x of [-1,0,1]) for(let z=b.depth/2-1.4;z<=b.depth/2+1;z+=.1) {
      for(const n of parts) {
        const {p,s}=transform(n)
        const blocked=Math.abs(x-p[0])<s[0]/2&&Math.abs(1.2-p[1])<s[1]/2&&Math.abs(z-p[2])<s[2]/2
        assert.ok(!blocked,`${b.id} 门洞被 ${n.name} 阻挡`)
      }
    }
  }
  for(const n of json.nodes.filter(n=>n.name?.startsWith('Parking marking')||n.name?.startsWith('Vehicle body'))) assert.ok(transform(n).p[2]>=58)
})
