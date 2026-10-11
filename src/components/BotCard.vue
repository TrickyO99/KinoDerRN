<template>
  <div
    class="bot-card"
    :class="[
      bot.type,
      {
        notification: bot.isNotification,
        exploding: bot.anim === 'exploding',
        leaking: bot.anim === 'leaking',
        fading: bot.anim === 'fading',
      },
    ]"
  >
    <Avatar :seed="bot.name" :background-color="avatarBg" class="bot-sprite" />

    <div class="bot-main">
      <div v-if="bot.isNotification" class="notif-badge">🔔 nouvelle réponse</div>

      <div class="bot-meta">
        <span class="bot-name">{{ bot.name }}</span>
        <span class="bot-time">· {{ bot.mins }}m</span>
      </div>

      <div class="reply-to">En réponse à <span class="reply-to-handle">@toi</span></div>

      <div class="speech-bubble">{{ flashText || bot.line }}</div>

      <template v-if="!bot.specialMode && !bot.insultFlash">
        <div class="engagement-row">
          <span>💬 {{ bot.nReplies }}</span><span>🔁 {{ bot.nRetweets }}</span><span>❤ {{ bot.nLikes }}</span>
        </div>

        <div class="timer-track"><div class="timer-fill" :style="{ width: bot.timeLeftPct + '%' }"></div></div>

        <div class="guess-row">
          <button class="guess-btn guess-bot" @click="$emit('guessBot')">
            <span class="key">1</span>🔴 C'est un bot
          </button>
          <button class="guess-btn guess-human" @click="$emit('guessHuman')">
            <span class="key">2</span>🟢 C'est une vraie personne
          </button>
        </div>
        <button class="insult-btn" @click="$emit('insult')">
          <span class="key">3</span>😈 Insulte-le
        </button>
      </template>

      <div v-if="bot.deltaToast" class="delta-toast">
        <span v-if="bot.deltaToast.scoreDelta" class="delta-score">+{{ bot.deltaToast.scoreDelta }}</span>
        <span v-if="!bot.deltaToast.scoreDelta && !bot.deltaToast.moneyDelta && !bot.deltaToast.touched" class="delta-score">+0</span>
        <span v-if="bot.deltaToast.moneyDelta" class="delta-money">+{{ bot.deltaToast.moneyDelta }} 💰</span>
        <span v-if="bot.deltaToast.touched" class="delta-hp-down">touché 💥</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import Avatar from "./Avatar.vue";
import { INJECTION_PROMPT } from "../gameStore.js";

const props = defineProps({ bot: { type: Object, required: true } });
defineEmits(["guessBot", "guessHuman", "insult"]);

const AVATAR_BG = {
  troll: "ff4d5e",
  bluecheck: "4bd8e0",
  supertroll: "ffcc4d",
  ally: "3ddc84",
};
const avatarBg = computed(() => AVATAR_BG[props.bot.type] || "0d1117");

const flashText = computed(() => {
  if (props.bot.specialMode) return INJECTION_PROMPT;
  if (props.bot.insultFlash) return props.bot.insultFlash;
  return null;
});
</script>
