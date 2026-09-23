# 未来院区 · 数字孪生运营中心

根据《楼宇数字孪生.md》构建的 **Vue 3 + Three.js + Blender** 院区三维可视化管理项目。

6 栋楼宇、37 层、296 间房间、2,072 台房间设备，包含行政办公、研发办公、人才公寓与服务/能源中心。所有空间、遥测、人员、天气和视频示意均为模拟数据。无需后端即可完整演示空间钻取和运维业务。



https://github.com/user-attachments/assets/a69c5f0f-ad80-40a6-984d-e992a76f1e7a






<img width="1920" height="910" alt="image" src="https://github.com/user-attachments/assets/7b46d33a-27f9-419d-b04f-0587c42e69c3" />

<img width="1920" height="910" alt="image" src="https://github.com/user-attachments/assets/853fa67a-368a-4983-bc8c-9373862aca84" />


## 启动
推荐 Node.js 22.12+ 或 24 LTS。

```bash
npm install
npm run dev
```

打开终端显示的地址（本机推荐 `http://127.0.0.1:5173`，避免 localhost IPv6 命中其他服务）。生产构建与预览：

```bash
npm test
npm run build
npm run preview
```

如 Windows 的默认 npm 缓存目录没有写权限，可运行 `npm install --cache .npm-cache`。

## 操作
1. **院区 → 楼栋 → 楼层 → 房间**：点击三维模型、浮动标签或空间树；面包屑返回上一级。
2. **三维工具**：旋转、平移、缩放、楼层分离、昼夜、自动巡航、设备点位、管网透视、模型导入。
3. **房间管理**：查看物理尺寸/坐标、用途、人数、温湿度及设备；照明/空调模拟控制立即改变功率。
4. **告警中心**：定位至房间，按诊断 → 派单 → 处理 → 复核完成闭环，处置记录本地持久化。
5. **智慧安防**：访客登记、楼栋授权、电子围栏越界模拟、人员热力与视频示意。
6. **能源管理**：水电曲线、实时楼栋负荷排行、对无人房间应用节能模拟策略。
7. **明厨亮灶 / 公共设施**：后厨空间、模拟视频、冷藏/燃气监测，以及设备台账和维护计划。
8. **疏散推演**：从房间生成到运动场集合点的路径，支持东侧楼梯封堵和备用路线。仅供示意演示。
9. **通勤动画**：院区/楼栋视图默认显示 16 辆车和 24 个行人角色。车辆沿环路中心线两侧、按右侧通行方向对向行驶；行人沿独立人行道进出行政办公楼和研发办公楼，带摆臂迈步与感应门。选择“上班 / 下班 / 双向通勤”，支持暂停和 1× / 2× / 4× 倍速；点击“入口”观察近景，“重置视角”返回。进入楼层或疏散视图时隐藏并冻结通勤，返回后继续。

通勤为独立的演示动画，不会修改房间人数、访客或告警业务数据。24 人指角色池规模；人物在楼内停留和循环间隔时隐藏，因此屏幕可见人数会变化。车辆模拟速度为 5 m/s，行人为 1.25 m/s，默认演示速度为 2×。路线参数见 `src/data/traffic.js`，模型、步态与门动画见 `src/scene/traffic.js`。

GLB 与 Blender 脚本已为 A、B 楼首层预留 3.4 m 门洞；车流、行人、人行道与感应门由 Three.js 运行时叠加，未烘焙进 GLB。自行导入其他模型时，需要保留相同坐标、门洞位置及通行净空。

## Blender 工作流

前端默认使用可立即运行的 Three.js 参数化模型，不依赖 Blender 安装。Blender 用于生成、精修与交换模型。

**已附可用模型：** `public/models/future-yard.glb`（glTF 2.0，内嵌资源）。可以直接在网页导入，也可以在 Blender 中使用「文件 → 导入 → glTF 2.0」编辑。该交付模型由 Three.js 的统一空间数据导出；重新生成可运行 `npm run model:export`。

**原生 Blender 工程：** 以下脚本可进一步生成 `.blend` 和 Blender 导出的 `.glb`。本次环境没有 Blender，运行库下载和依赖安装未完成，因此没有把 `.blend` 生成标记为已验证；脚本已通过 Python 语法检查。

```bash
npm run data:export
blender --background --python blender/generate_campus.py
```

Windows 中未将 Blender 加入 PATH 时，使用实际安装路径：

```powershell
& 'C:\Program Files\Blender Foundation\Blender 4.5\blender.exe' --background --python blender/generate_campus.py
```

脚本创建：
- `public/models/future-yard.blend`：可编辑源文件，建筑/楼层分集合管理。
- `public/models/future-yard.glb`：内嵌资源的 glTF 2.0 模型，保留空间自定义属性。
- `public/models/manifest.json`：单位、坐标与模型统计。

脚本会清空当前 Blender 场景，请以后台模式运行或在新文件中执行。输出文件夹可用 `-- --output <路径>` 指定。网页点击 **导入模型** 选择 GLB；建筑外观使用导入模型，室内钻取仍基于统一空间数据。

## 目录
```text
src/
  data/campus.js               空间、设备、遥测、状态机、疏散模型
  data/traffic.js              双向车道、人行道、通勤循环与距离采样
  scene/traffic.js             车辆、人形、感应门、动画与资源回收
  composables/useTwin.js       共享状态、选择联动、控制与持久化
  components/CampusScene.vue   Three.js 沙盘和模型导入
  components/DetailPanel.vue   房间、告警、视频与疏散面板
  components/BusinessDialog.vue 设备、工单、访客、能源专题
  components/TrendChart.vue    SVG 趋势图
  App.vue                     总览与空间导航
  style.css                   响应式工作台样式
blender/generate_campus.py     Blender 建模与 glTF 导出
scripts/export-data.js        导出统一空间数据
scripts/export-model.js       导出可直接编辑/导入的标准 GLB
tests/domain.test.js          空间、遥测、状态机与疏散回归测试
tests/traffic.test.js         车道间距、行人路径、进出楼、暂停/倍速检查
docs/接入与数据规范.md          数据契约、算法与真实接入边界
docs/验收记录.md              自动化检查与浏览器验收记录
```

## 交付范围
这是完整可运行的前端模拟演示工程，并非接好真实设备的生产物联网平台。真实测绘模型、视频流、人员定位、暖通协议、天气预测、身份权限和服务端审计需对接实际系统；接口契约见 [接入与数据规范](docs/接入与数据规范.md)。默认 UI 始终显示“模拟数据”。

页面字体优先使用 Noto Sans SC / Space Grotesk；离线时自动使用系统中文字体，核心运行不依赖外部字体服务。所有状态可从当前浏览器保留，适用于单机演示；不同浏览器之间不自动同步。

## Star History
[![Star History Chart](https://api.star-history.com/svg?repos=5758703/future-yard-digital-twin&type=Date)](https://star-history.com/#5758703/future-yard-digital-twin&Date)


