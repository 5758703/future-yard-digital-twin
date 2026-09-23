<script setup>
import { computed } from 'vue'
const props=defineProps({data:{type:Array,required:true},color:{type:String,default:'#48cab2'},height:{type:Number,default:80},id:{type:String,default:'trend'}})
const max=computed(()=>Math.max(...props.data.map(d=>d.value),1)*1.1)
const points=computed(()=>props.data.map((d,i)=>`${i/(props.data.length-1)*500},${props.height-8-d.value/max.value*(props.height-15)}`).join(' '))
const area=computed(()=>`0,${props.height} ${points.value} 500,${props.height}`)
</script>
<template><svg class="trend-svg" viewBox="0 0 500 100" preserveAspectRatio="none" role="img" aria-label="24 小时模拟用量趋势"><defs><linearGradient :id="id" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" :stop-color="color" stop-opacity=".28"/><stop offset="100%" :stop-color="color" stop-opacity="0"/></linearGradient></defs><path d="M0 20H500M0 50H500M0 80H500" stroke="#30404f" stroke-dasharray="3 5" fill="none"/><polygon :points="area" :fill="`url(#${id})`"/><polyline :points="points" fill="none" :stroke="color" stroke-width="2" vector-effect="non-scaling-stroke"/></svg></template>
