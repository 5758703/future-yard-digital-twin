"""Generate the Future Yard Blender source and a self-contained glTF model.

Usage: blender --background --python blender/generate_campus.py
Run `npm run data:export` first. No third-party Python packages required.
"""
import argparse
import json
import math
import sys
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parent.parent
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
parser = argparse.ArgumentParser()
parser.add_argument('--data', default=str(ROOT / 'public/data/campus.json'))
parser.add_argument('--output', default=str(ROOT / 'public/models'))
options = parser.parse_args(args)
data = json.loads(Path(options.data).read_text(encoding='utf-8'))
output = Path(options.output)
output.mkdir(parents=True, exist_ok=True)

# This generator clears the current Blender scene. Use --background or a new file.
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for collection in list(bpy.data.collections):
    if collection.users == 0:
        bpy.data.collections.remove(collection)

scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1.0
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.render.resolution_x = 1600
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
scene.world.color = (0.15, 0.2, 0.25)


def material(name, color, metallic=0.1):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1.0)
    shader.inputs['Metallic'].default_value = metallic
    shader.inputs['Roughness'].default_value = 0.55
    return mat


mats = {
    'wall': material('Wall | limestone', (0.52, 0.64, 0.64)),
    'glass': material('Glass | blue grey', (0.12, 0.26, 0.34), 0.45),
    'slab': material('Slab | pale concrete', (0.67, 0.73, 0.70)),
    'room': material('Interior | teal floor', (0.30, 0.55, 0.53)),
    'roof': material('Roof | solar panels', (0.09, 0.23, 0.32), 0.5),
    'ground': material('Landscape | grass', (0.18, 0.31, 0.25)),
    'road': material('Road | asphalt', (0.15, 0.20, 0.24)),
    'leaf': material('Trees | canopy', (0.18, 0.40, 0.29)),
    'wood': material('Furniture | timber', (0.53, 0.46, 0.31)),
    'alert': material('Fire equipment', (0.81, 0.31, 0.18)),
}


def collection(name, parent=None):
    col = bpy.data.collections.new(name)
    (parent or scene.collection).children.link(col)
    return col


def to_blender(x, y, z):
    # glTF export transforms Blender Z-up to Three.js Y-up.
    return (x, -z, y)


def box(name, size, position, mat, col, metadata=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=to_blender(*position))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = (size[0], size[2], size[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for old in list(obj.users_collection):
        old.objects.unlink(obj)
    col.objects.link(obj)
    obj.data.materials.append(mats[mat])
    for key, value in (metadata or {}).items():
        obj[key] = value
    return obj


campus_col = collection('FY | Future Yard')
outdoor = collection('Outdoor | Roads and landscape', campus_col)
box('Terrain', (181, 0.5, 155), (0, -0.5, 5), 'ground', outdoor)
for width, depth, x, z in [(166, 9, 0, -61), (166, 9, 0, 48), (9, 116, -79, -4), (9, 116, 79, -4), (149, 8, 0, 1), (8, 109, 17, -5), (8, 31, 23, 63)]:
    box('Road', (width, .12, depth), (x, -.1, z), 'road', outdoor)
box('Assembly and sports ground', (40, .15, 18), (-43, .05, 61), 'room', outdoor, {'facilityId': 'AS-01'})
for x in range(-69, 76, 9):
    for z in [-70, 76]:
        if z == 76 and 13 < x < 35:
            continue
        box('Tree trunk', (.4, 2.2, .4), (x, 1.1, z), 'wood', outdoor)
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1.9, location=to_blender(x, 3, z))
        obj = bpy.context.object
        obj.name = 'Tree canopy'
        obj.data.materials.append(mats['leaf'])
        for old in list(obj.users_collection):
            old.objects.unlink(obj)
        outdoor.objects.link(obj)

for b in data['buildings']:
    building_col = collection(f"{b['id']} | {b['name']}", campus_col)
    for floor in range(1, b['floors'] + 1):
        floor_id = f"{b['id']}-F{floor}"
        floor_col = collection(floor_id, building_col)
        y = (floor - 1) * data['campus']['floorHeight']
        metadata = {'buildingId': b['id'], 'floorId': floor_id, 'kind': 'floor', 'number': floor}
        box(f'{floor_id}_slab', (b['width'], .25, b['depth']), (b['x'], y + .2, b['z']), 'slab', floor_col, metadata)
        for side in [-1, 1]:
            box(f'{floor_id}_facade_{side}', (b['width'], 2.9, .22), (b['x'], y + 1.8, b['z'] + side * b['depth'] / 2), 'wall', floor_col, metadata)
            box(f'{floor_id}_glazing_{side}', (b['width'] - .8, 1.5, .08), (b['x'], y + 1.8, b['z'] + side * (b['depth'] / 2 + .14)), 'glass', floor_col, metadata)
            box(f'{floor_id}_side_{side}', (.2, 2.9, b['depth']), (b['x'] + side * b['width'] / 2, y + 1.8, b['z']), 'wall', floor_col, metadata)
            for i in range(int(b['width'] / 2.7)):
                box(f'{floor_id}_mullion', (.16, 2.95, .15), (b['x'] - b['width'] / 2 + 1.2 + i * 2.7, y + 1.8, b['z'] + side * (b['depth'] / 2 + .19)), 'slab', floor_col, metadata)
        for r in [r for r in data['rooms'] if r['floorId'] == floor_id]:
            room_meta = {**metadata, 'roomId': r['id'], 'kind': 'room', 'area': r['area'], 'use': r['use']}
            box(r['id'], (r['width'] - .2, .08, r['depth'] - .2), (r['x'], y + .39, r['z']), 'room', floor_col, room_meta)
            box(f"{r['id']}_partition", (.12, 2.7, r['depth']), (r['x'] - r['width'] / 2, y + 1.7, r['z']), 'wall', floor_col, room_meta)
            box(f"{r['id']}_furniture", (2, .6, 2.4 if b['type'] == 'residential' else 1.1), (r['x'], y + .7, r['z']), 'wood', floor_col, room_meta)
    height = b['floors'] * data['campus']['floorHeight']
    box(f"{b['id']}_roof", (b['width'] + .4, .35, b['depth'] + .4), (b['x'], height, b['z']), 'slab', building_col, {'buildingId': b['id']})
    for i in range(3):
        box(f"{b['id']}_solar_{i}", (4.5, .3, 3.2), (b['x'] - 6 + i * 5.5, height + .4, b['z']), 'roof', building_col, {'buildingId': b['id']})

for f in data['facilities']:
    if f['type'] == 'hydrant':
        box(f['id'], (.6, 1.2, .6), f['position'], 'alert', outdoor, {'facilityId': f['id']})

# Camera and studio sunlight are retained in the editable .blend source.
from mathutils import Vector
bpy.ops.object.camera_add(location=to_blender(150, 150, 185))
camera = bpy.context.object
camera.rotation_euler = (Vector(to_blender(0, 0, 5)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 220
scene.camera = camera
bpy.ops.object.light_add(type='SUN', location=(0, 0, 100))
sun = bpy.context.object
sun.rotation_euler = (math.radians(28), math.radians(-25), math.radians(-30))
sun.data.energy = 3
sun.data.angle = math.radians(12)

bpy.ops.wm.save_as_mainfile(filepath=str(output / 'future-yard.blend'))
bpy.ops.export_scene.gltf(filepath=str(output / 'future-yard.glb'), export_format='GLB', export_extras=True, export_yup=True, export_cameras=False, export_lights=False)
manifest = {'source': 'Blender generator', 'coordinateSystem': 'LOCAL_METERS_Y_UP', 'units': 'meters', 'buildings': len(data['buildings']), 'floors': len(data['floors']), 'rooms': len(data['rooms']), 'model': 'future-yard.glb'}
(output / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print(f"Exported: {output / 'future-yard.blend'} and {output / 'future-yard.glb'}")
