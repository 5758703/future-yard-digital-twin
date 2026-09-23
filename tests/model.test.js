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
