<template>
  <div
    class="bot-token"
    :class="[
      bot.type,
      {
        selected: isSelected,
        exploding: bot.anim === 'exploding',
        leaking: bot.anim === 'leaking',
        fading: bot.anim === 'fading',
      },
    ]"
    :style="posStyle"
    @click="$emit('select')"
  >
    <div class="token-face">
      <Avatar :seed="bot.name" :background-color="avatarBg" class="token-avatar" />
      <div class="token-ring"><div class="token-ring-fill" :style="{ width: bot.timeLeftPct + '%' }"></div></div>
    </div>

    <div v-if="bot.killFx === 'robot'" class="robot-death">
      <PixelCanvas :shape="SHAPE_ROBOT_HEAD" :palette="PALETTES.robotHead" :scale="5" :width="50" :height="50" />
      <span class="spark spark-1"></span>
      <span class="spark spark-2"></span>
      <span class="spark spark-3"></span>
      <span class="spark spark-4"></span>
    </div>

    <div v-if="bot.deltaToast" class="delta-toast token-delta">
      <span v-if="bot.deltaToast.scoreDelta" class="delta-score">+{{ bot.deltaToast.scoreDelta }}</span>
      <span v-if="!bot.deltaToast.scoreDelta && !bot.deltaToast.moneyDelta && !bot.deltaToast.touched" class="delta-score">+0</span>
      <span v-if="bot.deltaToast.moneyDelta" class="delta-money">+{{ bot.deltaToast.moneyDelta }} 💰</span>
      <span v-if="bot.deltaToast.touched" class="delta-hp-down">touché 💥</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import Avatar from "./Avatar.vue";
import PixelCanvas from "./PixelCanvas.vue";
import { SHAPE_ROBOT_HEAD, PALETTES } from "../sprites.js";

const props = defineProps({
  bot: { type: Object, required: true },
  isSelected: { type: Boolean, default: false },
});
defineEmits(["select"]);

const AVATAR_BG = {
  troll: "ff4d5e",
  bluecheck: "4bd8e0",
  supertroll: "ffcc4d",
  ally: "3ddc84",
};
const avatarBg = computed(() => AVATAR_BG[props.bot.type] || "0d1117");

const MAX_RADIUS = 38; // % of the battlefield's half-size
const MIN_RADIUS = 9; // stop at the tower's edge (its avatar), not its center

// Reuses the same per-frame countdown that drives the timer bar: at 100%
// (just spawned) it sits out near the edge, shrinking toward the center —
// and growing in scale — as it closes in on the pinned tweet. It only ever
// closes down to MIN_RADIUS: "touching" means reaching the tower's profile
// picture, not overlapping its exact center point.
const posStyle = computed(() => {
  const t = props.bot.timeLeftPct / 100; // 1 = far, 0 = at the tower
  const dist = MIN_RADIUS + t * (MAX_RADIUS - MIN_RADIUS);
  const x = 50 + dist * Math.cos(props.bot.angle);
  const y = 50 + dist * Math.sin(props.bot.angle);
  const scale = (0.55 + 0.65 * (1 - t)).toFixed(3);
  return {
    left: x + "%",
    top: y + "%",
    transform: `translate(-50%, -50%) scale(${scale})`,
    zIndex: String(Math.round((1 - t) * 100) + 1),
  };
});
</script>
