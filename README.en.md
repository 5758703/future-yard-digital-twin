<div align="center">
  <img src="public/brand/banner-en.svg" width="100%" alt="Future Yard · Digital Twin Operations Center" />

  <p><strong>Every space. Connected. In view.</strong></p>
  <p>One 3D workspace for campus spaces, energy and operations, from buildings to room devices.</p>

  <p><a href="README.md">简体中文</a> · <strong>English</strong></p>
  <p>
    <a href="#quickstart">Quickstart</a> ·
    <a href="#preview">Preview</a> ·
    <a href="#features">Features</a> ·
    <a href="#documentation">Documentation</a> ·
    <a href="https://github.com/5758703/future-yard-digital-twin/issues">Report an issue</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/version-1.0.0-59d0b5?style=flat-square" alt="Project version 1.0.0" />
    <img src="https://img.shields.io/badge/Vue-3-42b883?style=flat-square&amp;logo=vuedotjs&amp;logoColor=white" alt="Vue 3" />
    <img src="https://img.shields.io/badge/Three.js-WebGL-76b7d5?style=flat-square&amp;logo=threedotjs&amp;logoColor=white" alt="Three.js WebGL" />
    <img src="https://img.shields.io/badge/Vite-7-646cff?style=flat-square&amp;logo=vite&amp;logoColor=white" alt="Vite 7" />
    <img src="https://img.shields.io/badge/data-simulated-c1cf96?style=flat-square" alt="Simulated data demo" />
  </p>
</div>

<details>
<summary><strong>📑 Table of Contents</strong></summary>

- [👋 Hello](#hello)
- [🎬 Preview](#preview)
- [✨ Features](#features)
- [💻 Install](#install)
- [🔥 Quickstart](#quickstart)
- [🧊 Models and Blender](#models)
- [🗂️ Project Structure](#structure)
- [📚 Documentation](#documentation)
- [🤝 Contributing](#contributing)
- [⭐ Star History](#star-history)

</details>

<a id="hello"></a>
## 👋 Hello

**Future Yard is a ready-to-run frontend demo for a 3D campus digital twin.** Built with Vue 3, Three.js and a Blender workflow, it maps administrative offices, research offices, residential apartments and service / energy facilities into a shared spatial dataset. Explore spaces and operations without a backend.

| Buildings | Floors | Rooms | Room devices |
| :---: | :---: | :---: | :---: |
| **6** | **37** | **296** | **2,072** |

> Spatial data, telemetry, people, weather and video illustrations are simulated. The UI always labels the data as simulated. This project is a demo and development reference; real models, devices, video streams, positioning, weather, identity permissions and server audit require integration. Bilingual support covers the README; the application UI is currently in Chinese.

<a id="preview"></a>
## 🎬 Preview

<p align="center">
  <img src="https://github.com/user-attachments/assets/7b46d33a-27f9-419d-b04f-0587c42e69c3" width="100%" alt="Future Yard digital twin workspace screenshot one" />
  <img src="https://github.com/user-attachments/assets/853fa67a-368a-4983-bc8c-9373862aca84" width="100%" alt="Future Yard digital twin workspace screenshot two" />
</p>

<a id="features"></a>
## ✨ Features

| Capability | What you can do |
| --- | --- |
| 🏢 Spatial navigation | Drill down from campus → building → floor → room using the model, labels, tree and breadcrumbs |
| 🧭 3D workspace | Rotate, pan, zoom, separate floors, switch day / night, cruise automatically, and view devices or utility networks |
| 💡 Building controls | Inspect room dimensions, coordinates, use, occupancy and environment; simulate lighting / HVAC controls and power changes |
| 🔔 Alert workflow | Locate rooms, diagnose, dispatch, resolve and verify alerts; keep handling records locally |
| 🛡️ Security | Register visitors, authorize building access, simulate geofence crossings, view people heatmaps and video illustrations |
| 🌿 Energy | Explore water / electricity trends, building load rankings and simulated savings for unoccupied rooms |
| 🍳 Kitchens and facilities | View kitchen video illustrations, refrigeration / gas monitoring, asset records and maintenance plans |
| 🚶 Evacuation | Generate illustrative routes from rooms to the sports field assembly point, with blocked east stairs and alternate routes |
| 🚗 Commuting | Animate 16 vehicles and a pool of 24 pedestrians, with inbound / outbound / bidirectional modes, pause and speed controls |
| 🧊 Model exchange | Import GLB, export shared data and standard GLB, and generate editable projects using Blender scripts |

<a id="install"></a>
## 💻 Install

Use **Node.js 22.12+**, npm and a browser with WebGL support. The default Three.js scene is generated parametrically, so Blender is optional for running the demo.

```bash
git clone https://github.com/5758703/future-yard-digital-twin.git
cd future-yard-digital-twin
npm install
npm run dev
```

Open the URL printed in the terminal, usually `http://127.0.0.1:5173`. Prefer `127.0.0.1` locally to avoid localhost IPv6 resolution reaching another service. If the default npm cache is not writable on Windows, use `npm install --cache .npm-cache`.

<a id="quickstart"></a>
## 🔥 Quickstart

### Explore spaces

1. Select a building in the 3D scene, floating labels or the left spatial tree.
2. Select a floor and enter a room to inspect people, environmental readings and linked devices.
3. Navigate back using breadcrumbs; try floor separation, day / night and utility network views.

### Try operations

Open the alert center, select an alert, locate its room and complete diagnosis, dispatch, resolution and verification. Switch to energy, security, kitchen or facility modules to explore their workflows. Simulate lighting / HVAC controls in a room and observe power changes.

### Watch commuting

Commuting runs by default in campus / building views. Choose inbound (“上班”), outbound (“下班”) or bidirectional (“双向通勤”) mode; pause or select 1× / 2× / 4× speed. Use “入口” for an entrance close-up and “重置视角” to reset the view.

<details>
<summary>👉 Traffic parameters and model compatibility</summary>

Vehicles travel in opposite directions on either side of the loop centerline, following right-hand traffic. Pedestrians use separate sidewalks and enter administrative and research offices with walking and automatic-door animations. Traffic is hidden and frozen in floor or evacuation views, then resumes on return.

24 is the character pool size. Characters hide while indoors or between cycles, so the visible count varies. Simulated vehicle speed is 5 m/s and pedestrian speed is 1.25 m/s; the default demo speed is 2×. Traffic does not change room occupancy, visitor or alert data.

See [src/data/traffic.js](src/data/traffic.js) for routes and [src/scene/traffic.js](src/scene/traffic.js) for models, walking and doors. The GLB and Blender script reserve 3.4 m ground-floor door openings in buildings A and B. Vehicles, pedestrians, sidewalks and doors are added at runtime rather than baked into GLB. Imported models must preserve coordinates, entrance positions and clearance.

</details>

### Validate and build

```bash
npm test
npm run build
npm run preview
```

Production files are written to `dist/`. Use the preview URL printed in the terminal.

<a id="models"></a>
## 🧊 Models and Blender

The included [future-yard.glb](public/models/future-yard.glb) is a glTF 2.0 model with embedded resources, exported from the shared spatial data. Select “导入模型” in the app, or use File → Import → glTF 2.0 in Blender to edit it.

```bash
# Export a standard GLB ready to use
npm run model:export

# Export spatial data, then generate a project with an installed Blender
npm run data:export
blender --background --python blender/generate_campus.py
```

<details>
<summary>👉 Windows command and generated files</summary>

If Blender is not on PATH, replace this example with your installation path:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe' --background --python blender/generate_campus.py
```

| Output | Purpose |
| --- | --- |
| `public/models/future-yard.blend` | Editable source project with building / floor collections |
| `public/models/future-yard.glb` | glTF 2.0 model with embedded resources and spatial custom properties |
| `public/models/manifest.json` | Units, coordinates and model statistics |

The script clears the current Blender scene. Run it in background mode or in a new file. Set the output directory with `-- --output <path>`. Imported models supply building exteriors; indoor navigation continues to use the shared spatial data.

A usable GLB is included; generate the native `.blend` yourself. Existing acceptance records confirm Python syntax checks for the Blender script, but do not verify the Blender generation workflow.

</details>

<a id="structure"></a>
## 🗂️ Project Structure

```text
src/
  data/campus.js                 Spaces, devices, telemetry, state machines and evacuation
  data/traffic.js                Commuting routes and cycle parameters
  scene/traffic.js               Vehicles, pedestrians, doors and animation
  composables/useTwin.js         Shared state, controls and local persistence
  components/CampusScene.vue     Three.js scene and model imports
  components/DetailPanel.vue     Room, alert, video and evacuation panels
  components/BusinessDialog.vue  Assets, work orders, visitors and energy modules
  components/TrendChart.vue      SVG trend chart
  App.vue                       Overview and spatial navigation
  style.css                     Responsive workspace styles
public/brand/                   SVG logo and Chinese / English README banners
public/models/                  GLB and model manifest
blender/generate_campus.py       Blender modeling and glTF export
scripts/export-data.js          Shared spatial data export
scripts/export-model.js         Standard GLB export
tests/                          Domain, model and traffic regression tests
docs/                           Data contracts, design, acceptance and brand guidelines
```

<a id="documentation"></a>
## 📚 Documentation

| Document | Contents |
| --- | --- |
| [Integration and data specification](docs/接入与数据规范.md) | Data contracts, algorithms and real-system integration boundaries (Chinese) |
| [Design and implementation](docs/设计与实施说明.md) | Architecture, implementation and technical decisions (Chinese) |
| [Acceptance records](docs/验收记录.md) | Existing automated checks and browser acceptance records (Chinese) |
| [Brand and logo guidelines](docs/brand-guidelines.md) | Symbol meaning, palette and asset usage (Chinese / English) |
| [中文 README](README.md) | Chinese introduction and complete setup workflow |

State is saved in the current browser and does not automatically synchronize across browsers. Fonts prefer Noto Sans SC / Space Grotesk and fall back to system fonts offline; core functionality does not depend on external font services.

<a id="contributing"></a>
## 🤝 Contributing

Report bugs and suggestions through [Issues](https://github.com/5758703/future-yard-digital-twin/issues), or contribute through [Pull requests](https://github.com/5758703/future-yard-digital-twin/pulls). Include reproduction steps, expected behavior and actual behavior. Run `npm test` and `npm run build` before submitting code, and update both README languages when usage changes.

The documentation layout takes inspiration from the banner, badges, contents and quickstart structure of [Roboflow Supervision](https://github.com/roboflow/supervision). The logo was independently designed for this project.

<a id="star-history"></a>
## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=5758703/future-yard-digital-twin&type=Date)](https://star-history.com/#5758703/future-yard-digital-twin&Date)
