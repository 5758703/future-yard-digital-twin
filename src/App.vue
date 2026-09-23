<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Activity, ArrowDownLeft, ArrowUpRight, Bell, Box, Building2, Check, ChevronDown, ChevronRight, CircleHelp, Crosshair, Download, Droplets, Expand, Eye, Flame, Layers3, Leaf, Lightbulb, LocateFixed, Maximize2, Minus, Moon, Network, Plus, RotateCcw, Search, Settings2, ShieldCheck, Sun, Trees, Upload, Users, Utensils, Video, Wind, X, Zap } from 'lucide-vue-next'
import CampusScene from './components/CampusScene.vue'
import DetailPanel from './components/DetailPanel.vue'
import BusinessDialog from './components/BusinessDialog.vue'
import TrendChart from './components/TrendChart.vue'
import { useTwin } from './composables/useTwin.js'
import { buildings, rooms, devices, floors, energySeries, getRoom, getBuilding } from './data/campus.js'

const twin=useTwin()
const {state,tick,now,toast,modal,building,room,openAlerts,metrics,selectBuilding,selectFloor,selectRoom,locateAlert,notify}=twin
const scene=ref(null),query=ref(''),category=ref('全部'),fileInput=ref(null),mobileTree=ref(false)
const modules=[{id:'overview',name:'全域态势',icon:Box},{id:'security',name:'智慧安防',icon:ShieldCheck},{id:'building',name:'楼宇智控',icon:Building2},{id:'energy',name:'能源管理',icon:Zap},{id:'kitchen',name:'明厨亮灶',icon:Utensils},{id:'facility',name:'公共设施',icon:Network}]
const filteredBuildings=computed(()=>buildings.filter(b=>(category.value==='全部'||b.category===category.value)&&(!query.value||b.name.includes(query.value)||b.code.toLowerCase().includes(query.value.toLowerCase())||rooms.some(r=>r.buildingId===b.id&&r.name.includes(query.value)))))
const searchRooms=computed(()=>query.value?rooms.filter(r=>`${getBuilding(r.buildingId).name}${r.name}${r.id}`.toLowerCase().includes(query.value.toLowerCase())).slice(0,20):[])
const series=computed(()=>energySeries(state.buildingId,'electricity',{floor:state.floor,roomId:state.roomId}))
const totalEnergy=computed(()=>series.value.reduce((n,d)=>n+d.value,0))
const scopeDevices=computed(()=>devices.filter(d=>(!state.buildingId||d.buildingId===state.buildingId)&&(!state.floor||getRoom(d.roomId).floor===state.floor)&&(!state.roomId||d.roomId===state.roomId)))
const onlineDevices=computed(()=>scopeDevices.value.filter(d=>d.online).length)
const onlineRate=computed(()=>(onlineDevices.value/Math.max(scopeDevices.value.length,1)*100).toFixed(1))
const scopedAlertCount=computed(()=>openAlerts.value.filter(a=>(!state.buildingId||getRoom(a.roomId)?.buildingId===state.buildingId)&&(!state.floor||getRoom(a.roomId)?.floor===state.floor)&&(!state.roomId||a.roomId===state.roomId)).length)
const scope=computed(()=>room.value?`${room.value.number} 室`:building.value?`${building.value.name}${state.floor?' · '+state.floor+'F':''}`:'院区总览')
let interval
function switchModule(id){state.module=id;state.layer=id==='energy'?'energy':id==='security'?'people':'normal';state.showDevices=['security','facility'].includes(id);if(id==='kitchen'){selectFloor('E',1);selectRoom('E-102')} }
function exportData(){const payload={exportedAt:new Date().toISOString(),source:'simulation',buildings,floors,rooms,devices,controls:state.controls,alerts:state.alerts,visitors:state.visitors};const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='未来院区-模拟数据.json';a.click();URL.revokeObjectURL(url);notify('院区空间与运行数据已导出')}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{notify('当前浏览器不支持全屏，请使用窗口最大化')}}
function handleImport(event){scene.value?.importModel(event.target.files?.[0]);event.target.value=''}
function keydown(e){if(e.key==='Escape'){modal.value=null;mobileTree.value=false}}
onMounted(()=>{interval=setInterval(()=>{tick.value++;now.value=new Date()},3000);window.addEventListener('keydown',keydown)})
onBeforeUnmount(()=>{clearInterval(interval);window.removeEventListener('keydown',keydown)})
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" href="#" @click.prevent="selectBuilding(null);switchModule('overview')"><div class="brand-mark"><Building2 :size="23"/><span></span></div><div><h1>未来院区<span>数字孪生运营中心</span></h1><p>让每一处空间，实时可感知</p></div></a>
      <nav class="topnav" aria-label="业务专题"><button v-for="m in modules" :key="m.id" :class="{active:state.module===m.id}" @click="switchModule(m.id)"><component :is="m.icon" :size="16"/>{{m.name}}</button></nav>
      <div class="header-actions"><button class="icon-button notification" title="告警中心" aria-label="打开告警中心" @click="modal='alerts'"><Bell :size="19"/><i v-if="openAlerts.length"></i></button><span class="avatar">运</span></div>
    </header>

    <div class="statusbar"><div><span class="live-dot"></span><strong>院区运行中</strong><span class="divider"></span><span class="muted">数据更新于 {{now.toLocaleTimeString('zh-CN',{hour12:false})}}</span><span class="simulation-badge">模拟数据</span></div><div class="weather"><Sun :size="15"/><span>晴 26°C</span><span class="muted">东南风 2 级 · 模拟天气</span><span class="divider"></span><span>{{now.toLocaleDateString('zh-CN')}} {{['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][now.getDay()]}}</span></div></div>

    <main class="workspace">
      <aside class="space-panel panel" :class="{mobileOpen:mobileTree}">
        <div class="panel-heading"><h2><Layers3 :size="17"/>空间资源</h2><span class="small-chip">{{buildings.length}} 栋</span></div>
        <label class="search-box"><Search :size="16"/><input v-model="query" placeholder="搜索楼栋、楼层或房间" aria-label="搜索空间"/><button v-if="query" aria-label="清空搜索" @click="query=''"><X :size="13"/></button></label>
        <div class="segmented"><button v-for="c in ['全部','办公','住宅','配套']" :key="c" :class="{active:category===c}" @click="category=c">{{c}}</button></div>
        <button class="campus-root" :class="{active:!state.buildingId}" @click="selectBuilding(null)"><Trees :size="18"/><span>未来院区</span><small>{{floors.length}} 层 / {{rooms.length}} 间</small></button>
        <div class="space-tree">
          <div v-for="b in filteredBuildings" :key="b.id" class="building-tree" :class="{selected:state.buildingId===b.id}">
            <button class="building-row" @click="selectBuilding(state.buildingId===b.id&&!state.floor?null:b.id)"><component :is="state.buildingId===b.id?ChevronDown:ChevronRight" :size="13"/><Building2 :size="17"/><div><strong>{{b.name}}</strong><small>{{b.code}} <span>·</span> {{b.floors}} 层</small></div><span :class="['type-dot',b.type]"></span></button>
            <div v-if="state.buildingId===b.id" class="floor-tree"><template v-for="n in b.floors" :key="n"><button :class="['floor-row',{active:state.floor===n}]" @click="selectFloor(b.id,n)"><Layers3 :size="13"/><span>{{n}}F</span><small>{{n===1?'首层公共空间':b.category+'空间'}}</small><span>8 间</span></button><div v-if="state.floor===n" class="room-tree"><button v-for="r in rooms.filter(r=>r.buildingId===b.id&&r.floor===n)" :key="r.id" :class="{active:state.roomId===r.id}" @click="selectRoom(r.id)"><span :class="['room-state',{warn:openAlerts.some(a=>a.roomId===r.id)}]"></span>{{r.number}}<small>{{r.use}}</small></button></div></template></div>
          </div>
          <div v-if="!filteredBuildings.length" class="empty-state">没有找到相关空间</div>
          <div v-if="searchRooms.length" class="search-results"><p>房间匹配 · 最多显示 20 项</p><button v-for="r in searchRooms" :key="r.id" @click="selectRoom(r.id);query=''">{{getBuilding(r.buildingId).code}} / {{r.name}}<ChevronRight :size="13"/></button></div>
        </div>
        <div class="space-summary"><div class="section-label">空间数字底座<span>已建模</span></div><div class="mini-stats"><div><strong>{{(floors.reduce((n,f)=>n+f.grossArea,0)/10000).toFixed(2)}}<small>万 m²</small></strong><span>建筑总面积</span></div><div><strong>{{rooms.length}}<small>间</small></strong><span>可管理空间</span></div></div><div class="progress-line"><i style="width:100%"></i></div><p><Check :size="12"/>空间与设备关联完成 <span>100%</span></p></div>
        <div class="left-bottom"><button @click="modal='assets'"><Settings2 :size="15"/>设备台账</button><button @click="modal='help'"><CircleHelp :size="15"/>使用指南</button></div>
      </aside>

      <section class="center-column">
        <div class="overview-heading"><div><div class="breadcrumb"><button @click="selectBuilding(null)">未来院区</button><ChevronRight :size="13"/><button v-if="building" @click="selectBuilding(building.id)">{{building.name}}</button><span v-else>全域态势</span><template v-if="state.floor"><ChevronRight :size="13"/><button @click="selectFloor(state.buildingId,state.floor)">{{state.floor}}F</button></template><template v-if="room"><ChevronRight :size="13"/><span>{{room.number}} 室</span></template></div><h2>{{scope}}<span>{{state.floor?'室内空间管理':state.buildingId?'楼栋运行态势':'全域运行态势'}}</span></h2></div><button class="quiet-button export" @click="exportData"><Download :size="14"/>导出数据</button></div>
        <div class="kpi-row"><div class="kpi"><div class="kpi-top"><span>{{state.buildingId?'当前空间':'院区建筑'}}</span><Building2 :size="16"/></div><strong>{{state.buildingId?metrics.rooms:buildings.length}}<small>{{state.buildingId?'间':'栋'}}</small></strong><p><span class="positive">{{state.buildingId?state.floor||building.floors:floors.length}}</span> {{state.floor?'当前楼层':'楼层纳入管理'}}</p></div><div class="kpi"><div class="kpi-top"><span>{{state.buildingId?'当前空间人数':'实时在院人数'}}</span><Users :size="16"/></div><strong>{{metrics.people.toLocaleString()}}<small>人</small></strong><p><span class="positive"><Activity :size="11"/>模拟感知</span> 人员分布可视</p></div><div class="kpi"><div class="kpi-top"><span>设备在线率</span><Activity :size="16"/></div><strong>{{onlineRate}}<small>%</small></strong><p>{{onlineDevices.toLocaleString()}} / {{scopeDevices.length.toLocaleString()}} 台设备</p></div><button class="kpi alert-kpi" @click="modal='alerts'"><div class="kpi-top"><span>待闭环告警</span><Bell :size="16"/></div><strong>{{scopedAlertCount.toString().padStart(2,'0')}}<small>条</small></strong><p><span class="warning-text">{{openAlerts.filter(a=>a.level==='critical').length}} 条重点关注</span><ChevronRight :size="12"/></p></button></div>

        <div class="scene-panel panel">
          <CampusScene ref="scene"/>
          <div class="view-tabs"><button :class="{active:state.layer==='normal'}" @click="state.layer='normal'"><Box :size="14"/>空间视图</button><button :class="{active:state.layer==='people'}" @click="state.layer='people'"><Users :size="14"/>人流热力</button><button :class="{active:state.layer==='energy'}" @click="state.layer='energy'"><Zap :size="14"/>能耗分布</button></div>
          <div class="scene-toolbar"><button title="重置视角" aria-label="重置视角" @click="scene?.resetView()"><LocateFixed :size="17"/></button><button title="放大" aria-label="放大三维视图" @click="scene?.zoom(.8)"><Plus :size="18"/></button><button title="缩小" aria-label="缩小三维视图" @click="scene?.zoom(1.2)"><Minus :size="18"/></button><span></span><button :class="{active:state.night}" title="切换昼夜" aria-label="切换昼夜" @click="state.night=!state.night"><component :is="state.night?Sun:Moon" :size="17"/></button><button :class="{active:state.autoRotate}" title="自动巡航" aria-label="自动巡航" @click="state.autoRotate=!state.autoRotate"><RotateCcw :size="17"/></button><button title="全屏展示" aria-label="全屏展示" @click="fullscreen"><Maximize2 :size="17"/></button></div>
          <div class="scene-bottom-controls"><button :class="{active:state.showDevices}" @click="state.showDevices=!state.showDevices"><Eye :size="14"/>设备点位</button><button :class="{active:state.pipes}" @click="state.pipes=!state.pipes"><Network :size="14"/>地下管网</button><button v-if="state.buildingId&&!state.floor" :class="{active:state.explode}" @click="state.explode=!state.explode"><Layers3 :size="14"/>楼层分离</button><button title="导入 Blender GLB 模型" @click="fileInput.click()"><Upload :size="14"/>导入模型</button><button v-if="scene?.hasImported" @click="scene.clearModel()"><RotateCcw :size="14"/>默认模型</button><input ref="fileInput" type="file" accept=".glb" hidden @change="handleImport"/></div>
          <div class="map-legend"><span><i class="legend-normal"></i>正常</span><span><i class="legend-warning"></i>告警</span><span><i class="legend-selected"></i>当前空间</span></div>
          <div v-if="state.pipes" class="pipe-legend">管网透视示意 <span style="color:#54afdd">━ 给水</span><span style="color:#e0ac6a">━ 电力</span><span style="color:#c982cb">━ 暖通</span></div>
        </div>

        <div class="bottom-insights"><section class="energy-panel panel"><div class="panel-heading"><h2><Zap :size="15"/>能耗运行趋势</h2><button @click="modal='energy'">分析详情<ChevronRight :size="13"/></button></div><div class="energy-content"><div class="energy-number"><span>今日用电 · 模拟</span><strong>{{totalEnergy.toLocaleString('zh-CN',{maximumFractionDigits:0})}}<small>kWh</small></strong><p><ArrowDownLeft :size="12"/>较模拟基线降低 8.6%</p></div><div class="chart-wrap"><TrendChart :data="series" id="overview-energy" :height="100"/><div class="chart-axis"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span></div></div></div></section><section class="environment-panel panel"><div class="panel-heading"><h2><Leaf :size="15"/>环境与运行</h2><span class="small-chip green">舒适</span></div><div class="environment-values"><div><Sun :size="17"/><strong>{{(25.2+Math.sin(tick/4)*.2).toFixed(1)}}<small>°C</small></strong><span>平均温度</span></div><div><Droplets :size="17"/><strong>54<small>%</small></strong><span>相对湿度</span></div><div><Wind :size="17"/><strong>486<small>ppm</small></strong><span>平均 CO₂</span></div></div></section></div>
      </section>

      <DetailPanel/>
    </main>
    <footer class="app-footer"><span><span class="live-dot"></span>数字底座已连接 <span class="muted">Vue / Three.js / Blender</span></span><span>本地坐标系 · 米制空间 <i></i>模拟遥测 3 秒刷新 <i></i>演示环境 v1.0</span><button class="mobile-tree-button" @click="mobileTree=!mobileTree"><Layers3 :size="14"/>空间树</button></footer>
    <div v-if="toast" class="toast" role="status"><Check :size="16"/>{{toast}}</div>
    <BusinessDialog v-if="modal"/>
  </div>
</template>


