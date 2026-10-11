<template>
  <section class="screen">
    <h1 class="title small">FIN DE PARTIE</h1>
    <p class="subtitle">{{ subtitle }}</p>
    <div class="stats-box">
      <div class="stat-row"><span class="hud-label">Vagues survécues</span><span class="hud-value">{{ state.wave }}</span></div>
      <div class="stat-row"><span class="hud-label">Bots éliminés</span><span class="hud-value">{{ state.kills }}</span></div>
      <div class="stat-row"><span class="hud-label">Score final</span><span class="hud-value">{{ state.score }}</span></div>
      <div class="stat-row"><span class="hud-label">Argent gagné</span><span class="hud-value">💰 {{ state.money }}</span></div>
    </div>

    <div v-if="phase === 'entry'" class="highscore-entry">
      <div class="highscore-label">Entre tes initiales :</div>
      <div class="letter-wheel">
        <div
          v-for="(letter, i) in initials"
          :key="i"
          class="letter-slot"
          :class="{ active: i === activeSlot }"
          @click="activeSlot = i"
        >
          <button class="letter-arrow" @click.stop="cycle(i, 1)">▲</button>
          <div class="letter-display">{{ letter }}</div>
          <button class="letter-arrow" @click.stop="cycle(i, -1)">▼</button>
        </div>
      </div>
      <p class="highscore-hint">↑ / ↓ change la lettre · ← / → change de case · Entrée valide</p>
      <button class="pixel-btn" :disabled="submitting" @click="submit">
        {{ submitting ? "ENVOI..." : "VALIDER" }}
      </button>
      <p v-if="submitError" class="highscore-error">Classement injoignable, mais bien joué quand même.</p>
    </div>

    <div v-else class="leaderboard">
      <div class="leaderboard-title">🏆 MEILLEURS SCORES</div>
      <ol v-if="topScores.length" class="leaderboard-list">
        <li
          v-for="(row, i) in topScores"
          :key="i"
          class="leaderboard-row"
          :class="{ self: isThisRun(row) }"
        >
          <span class="leaderboard-rank">{{ i + 1 }}</span>
          <span class="leaderboard-initials">{{ row.initials }}</span>
          <span class="leaderboard-score">{{ row.score }}</span>
        </li>
      </ol>
      <p v-else class="highscore-error">Pas de classement disponible pour l'instant.</p>
    </div>

    <button class="pixel-btn" @click="$emit('replay')">REJOUER</button>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { state, GAMEOVER_MESSAGES } from "../gameStore.js";
import { fetchTopScores, submitScore } from "../api.js";

defineEmits(["replay"]);

const subtitle = computed(() => GAMEOVER_MESSAGES[state.gameoverReason] || GAMEOVER_MESSAGES.lives);

const phase = ref("entry"); // "entry" | "done"
const activeSlot = ref(0);
const submitting = ref(false);
const submitError = ref(false);
const topScores = ref([]);
const submittedInitials = ref("");

const storedInitials = (localStorage.getItem("kinoderrn_initials") || "AAA").padEnd(3, "A").slice(0, 3).toUpperCase();
const initials = ref(storedInitials.split(""));

function cycle(i, dir) {
  const code = initials.value[i].charCodeAt(0) + dir;
  const wrapped = code < 65 ? 90 : code > 90 ? 65 : code;
  initials.value[i] = String.fromCharCode(wrapped);
}

function isThisRun(row) {
  return phase.value === "done" && row.initials === submittedInitials.value && row.score === state.score;
}

async function submit() {
  if (submitting.value) return;
  submitting.value = true;
  submitError.value = false;
  const text = initials.value.join("");
  localStorage.setItem("kinoderrn_initials", text);
  submittedInitials.value = text;

  try {
    await submitScore(text, state.score, state.wave);
    topScores.value = await fetchTopScores(10);
  } catch {
    submitError.value = true;
  } finally {
    submitting.value = false;
    phase.value = "done";
  }
}

function onKeydown(e) {
  if (phase.value !== "entry") return;
  if (e.key === "ArrowUp") { cycle(activeSlot.value, 1); e.preventDefault(); }
  else if (e.key === "ArrowDown") { cycle(activeSlot.value, -1); e.preventDefault(); }
  else if (e.key === "ArrowLeft") { activeSlot.value = Math.max(0, activeSlot.value - 1); }
  else if (e.key === "ArrowRight") { activeSlot.value = Math.min(2, activeSlot.value + 1); }
  else if (e.key === "Enter") { submit(); }
}

onMounted(() => document.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => document.removeEventListener("keydown", onKeydown));
</script>
