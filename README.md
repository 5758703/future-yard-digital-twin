<div align="center">
  <img src="public/brand/banner-zh.svg" width="100%" alt="未来院区 · 数字孪生运营中心" />

  <p><strong>让每一处空间，实时可感知。</strong></p>
  <p>从院区全景到房间设备，用一个三维工作台串联空间、能源与运维。</p>

  <p><strong>简体中文</strong> · <a href="README.en.md">English</a></p>
  <p>
    <a href="#quickstart">快速上手</a> ·
    <a href="#preview">项目预览</a> ·
    <a href="#features">功能特性</a> ·
    <a href="#documentation">文档</a> ·
    <a href="https://github.com/5758703/future-yard-digital-twin/issues">反馈问题</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/version-1.0.0-59d0b5?style=flat-square" alt="项目版本 1.0.0" />
    <img src="https://img.shields.io/badge/Vue-3-42b883?style=flat-square&amp;logo=vuedotjs&amp;logoColor=white" alt="Vue 3" />
    <img src="https://img.shields.io/badge/Three.js-WebGL-76b7d5?style=flat-square&amp;logo=threedotjs&amp;logoColor=white" alt="Three.js WebGL" />
    <img src="https://img.shields.io/badge/Vite-7-646cff?style=flat-square&amp;logo=vite&amp;logoColor=white" alt="Vite 7" />
    <img src="https://img.shields.io/badge/data-simulated-c1cf96?style=flat-square" alt="模拟数据演示" />
  </p>
</div>

<details>
<summary><strong>📑 目录</strong></summary>

- [👋 项目介绍](#hello)
- [🎬 项目预览](#preview)
- [✨ 功能特性](#features)
- [💻 安装](#install)
- [🔥 快速上手](#quickstart)
- [🧊 模型与 Blender 工作流](#models)
- [🗂️ 项目结构](#structure)
- [📚 文档](#documentation)
- [🤝 参与贡献](#contributing)
- [⭐ Star History](#star-history)

</details>

<a id="hello"></a>
## 👋 项目介绍

**未来院区是一个可直接运行的三维数字孪生前端演示项目。** 基于 Vue 3、Three.js 与 Blender 工作流，将行政办公、研发办公、人才公寓及服务 / 能源中心映射到统一空间数据中，无需后端即可体验空间钻取与运维业务。

| 楼宇 | 楼层 | 房间 | 房间设备 |
| :---: | :---: | :---: | :---: |
| **6 栋** | **37 层** | **296 间** | **2,072 台** |

> 空间、遥测、人员、天气与视频示意均使用模拟数据，界面始终标注“模拟数据”。本项目用于演示与开发参考；真实模型、设备、视频、人员定位、天气、身份权限和服务端审计需另行对接。双语支持覆盖 README，应用界面目前为中文。

<a id="preview"></a>
## 🎬 项目预览

<p align="center">
  <img src="https://github.com/user-attachments/assets/7b46d33a-27f9-419d-b04f-0587c42e69c3" width="100%" alt="未来院区数字孪生工作台截图一" />
  <img src="https://github.com/user-attachments/assets/853fa67a-368a-4983-bc8c-9373862aca84" width="100%" alt="未来院区数字孪生工作台截图二" />
</p>

<a id="features"></a>
## ✨ 功能特性

| 能力 | 你可以做什么 |
| --- | --- |
| 🏢 空间钻取 | 院区 → 楼栋 → 楼层 → 房间；模型、标签、空间树与面包屑联动 |
| 🧭 三维工作台 | 旋转、平移、缩放、楼层分离、昼夜、自动巡航、设备点位及管网透视 |
| 💡 楼宇智控 | 查看房间尺寸、坐标、用途、人数与温湿度，模拟控制照明 / 空调并查看功率变化 |
| 🔔 告警闭环 | 定位房间，按诊断 → 派单 → 处理 → 复核流转，本地保存处置记录 |
| 🛡️ 智慧安防 | 访客登记、楼栋授权、电子围栏越界模拟、人员热力与视频示意 |
| 🌿 能源管理 | 水电曲线、楼栋负荷排行，对无人房间应用节能模拟策略 |
| 🍳 后厨与设施 | 后厨视频示意、冷藏 / 燃气监测、设备台账及维护计划 |
| 🚶 疏散推演 | 房间到运动场集合点的示意路径，支持东侧楼梯封堵与备用路线 |
| 🚗 通勤动画 | 16 辆车、24 个行人角色，上班 / 下班 / 双向模式，暂停及倍速控制 |
| 🧊 模型交换 | 导入 GLB，导出统一数据与标准 GLB，通过 Blender 脚本生成可编辑工程 |

<a id="install"></a>
## 💻 安装

使用 **Node.js 22.12+** 与 npm，浏览器需支持 WebGL。默认场景由 Three.js 参数化生成，启动演示无需安装 Blender。

```bash
git clone https://github.com/5758703/future-yard-digital-twin.git
cd future-yard-digital-twin
npm install
npm run dev
```

打开终端输出的地址，通常为 `http://127.0.0.1:5173`。本机优先使用 `127.0.0.1`，避免 localhost 的 IPv6 解析命中其他服务。Windows 默认 npm 缓存目录无写权限时，可使用 `npm install --cache .npm-cache`。

<a id="quickstart"></a>
## 🔥 快速上手

### 探索空间

1. 在三维模型、浮动标签或左侧空间树中选择楼栋。
2. 选择楼层并进入房间，查看人员、环境与关联设备。
3. 使用面包屑返回；通过三维工具体验楼层分离、昼夜和管网透视。

### 体验运维

打开告警中心，选择告警并定位房间，依次完成诊断、派单、处理与复核。切换能源、安防、明厨亮灶或公共设施专题，体验对应业务；在房间中模拟控制照明 / 空调并观察功率变化。

### 观察通勤

院区 / 楼栋视图默认显示通勤动画。选择“上班 / 下班 / 双向通勤”，支持暂停及 1× / 2× / 4× 倍速；点击“入口”观察近景，再用“重置视角”返回。

<details>
<summary>👉 通勤参数与模型适配</summary>

车辆沿环路中心线两侧按右侧通行方向对向行驶；行人走独立人行道，进出行政办公楼与研发办公楼，带步态及感应门动画。进入楼层或疏散视图时，通勤隐藏并冻结，返回后继续。

24 人是角色池规模；楼内停留与循环间隔期间角色会隐藏，因此可见人数会变化。车辆模拟速度为 5 m/s，行人为 1.25 m/s，默认演示速度为 2×。通勤不修改房间人数、访客或告警数据。

路线参数见 [src/data/traffic.js](src/data/traffic.js)，模型、步态与感应门见 [src/scene/traffic.js](src/scene/traffic.js)。GLB 与 Blender 脚本为 A、B 楼首层预留 3.4 m 门洞；车流、行人、人行道及门由运行时叠加，未烘焙进 GLB。导入其他模型时需保留相同坐标、门洞位置与通行净空。

</details>

### 检查与构建

```bash
npm test
npm run build
npm run preview
```

生产文件输出至 `dist/`，预览地址以终端输出为准。

<a id="models"></a>
## 🧊 模型与 Blender 工作流

已附 [future-yard.glb](public/models/future-yard.glb)，为资源内嵌的 glTF 2.0 模型，由统一空间数据导出。可以在网页点击“导入模型”，也可以在 Blender 中选择“文件 → 导入 → glTF 2.0”编辑。

```bash
# 重新导出可直接使用的标准 GLB
npm run model:export

# 导出空间数据，再通过已安装的 Blender 生成工程
npm run data:export
blender --background --python blender/generate_campus.py
```

<details>
<summary>👉 Windows 命令与输出文件</summary>

Blender 未加入 PATH 时，将以下路径替换为实际安装位置：

```powershell
& 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe' --background --python blender/generate_campus.py
```

| 输出 | 用途 |
| --- | --- |
| `public/models/future-yard.blend` | 可编辑源工程，建筑 / 楼层分集合管理 |
| `public/models/future-yard.glb` | glTF 2.0 模型，内嵌资源并保留空间自定义属性 |
| `public/models/manifest.json` | 单位、坐标与模型统计 |

脚本会清空当前 Blender 场景，请使用后台模式或在新文件中运行。输出目录可通过 `-- --output <路径>` 指定。导入模型用于建筑外观，室内钻取仍基于统一空间数据。

仓库附带可用 GLB；原生 `.blend` 需自行生成。已有验收记录仅确认 Blender 脚本通过 Python 语法检查，未验证 Blender 生成流程。

</details>

<a id="structure"></a>
## 🗂️ 项目结构

```text
src/
  data/campus.js                 空间、设备、遥测、状态机与疏散模型
  data/traffic.js                通勤路线与循环参数
  scene/traffic.js               车辆、行人、感应门与动画
  composables/useTwin.js         共享状态、控制与本地持久化
  components/CampusScene.vue     Three.js 场景与模型导入
  components/DetailPanel.vue     房间、告警、视频与疏散面板
  components/BusinessDialog.vue  设备、工单、访客与能源专题
  components/TrendChart.vue      SVG 趋势图
  App.vue                       总览与空间导航
  style.css                     响应式工作台样式
public/brand/                   SVG Logo 与中英文 README 横幅
public/models/                  GLB 与模型清单
blender/generate_campus.py       Blender 建模与 glTF 导出
scripts/export-data.js          导出统一空间数据
scripts/export-model.js         导出标准 GLB
tests/                          领域、模型与通勤回归测试
docs/                           数据规范、设计说明、验收与品牌指南
```

<a id="documentation"></a>
## 📚 文档

| 文档 | 内容 |
| --- | --- |
| [接入与数据规范](docs/接入与数据规范.md) | 数据契约、算法及真实系统接入边界 |
| [设计与实施说明](docs/设计与实施说明.md) | 架构、实现思路与技术选择 |
| [验收记录](docs/验收记录.md) | 已有自动化检查及浏览器验收记录 |
| [品牌与 Logo 指南](docs/brand-guidelines.md) | 图形含义、配色及资源使用方式（中英双语） |
| [English README](README.en.md) | 英文项目介绍与完整上手流程 |

状态保存在当前浏览器，不会跨浏览器自动同步。字体优先使用 Noto Sans SC / Space Grotesk；离线时回退到系统字体，核心运行不依赖外部字体服务。

<a id="contributing"></a>
## 🤝 参与贡献

欢迎通过 [Issues](https://github.com/5758703/future-yard-digital-twin/issues) 报告问题或提出建议，通过 [Pull requests](https://github.com/5758703/future-yard-digital-twin/pulls) 贡献改进。请说明复现步骤、预期表现和实际表现；提交代码前运行 `npm test` 与 `npm run build`，修改使用流程时同步更新中英文 README。

文档排版参考 [Roboflow Supervision](https://github.com/roboflow/supervision) 的品牌横幅、徽章、目录及快速上手组织方式；Logo 为本项目独立设计。

<a id="star-history"></a>
## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=5758703/future-yard-digital-twin&type=Date)](https://star-history.com/#5758703/future-yard-digital-twin&Date)
