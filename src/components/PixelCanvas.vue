<template>
  <canvas ref="canvasEl" :width="width" :height="height"></canvas>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { drawSprite } from "../sprites.js";

const props = defineProps({
  shape: { type: Array, required: true },
  palette: { type: Object, required: true },
  scale: { type: Number, default: 6 },
  width: { type: Number, default: 64 },
  height: { type: Number, default: 64 },
});

const canvasEl = ref(null);

function draw() {
  if (canvasEl.value) drawSprite(canvasEl.value, props.shape, props.palette, props.scale);
}

onMounted(draw);
watch(() => [props.shape, props.palette, props.scale], draw);
</script>
