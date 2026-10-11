<template>
  <div class="booth">

    <div class="booth-wall">
      <div class="window">
        <div class="window-sky"></div>
        <div class="window-bar"></div>
        <div class="window-bar"></div>
        <div class="window-bar"></div>
      </div>
      <PixelCanvas :shape="SHAPE_PAPERS" :palette="PALETTES.papers" :scale="4" :width="36" :height="36" class="prop prop-papers-wall" />
    </div>

    <div class="booth-desk">
      <div class="lamp-col">
        <PixelCanvas :shape="SHAPE_LAMP" :palette="PALETTES.lamp" :scale="6" :width="48" :height="48" class="prop prop-lamp" />
        <div class="lamp-glow"></div>
      </div>

      <div class="monitor">
        <div class="monitor-bezel">
          <div class="crt-overlay"></div>

          <div id="app">
            <MenuScreen v-if="screen === 'menu'" @start="startGame" />
            <GameScreen v-else-if="screen === 'game'" />
            <GameOverScreen v-else-if="screen === 'gameover'" @replay="backToMenu" />
          </div>
        </div>
        <div class="monitor-stand-neck"></div>
        <div class="monitor-stand-base"></div>
      </div>

      <div class="desk-props">
        <PixelCanvas :shape="SHAPE_STAMP" :palette="PALETTES.stamp" :scale="3" :width="26" :height="26" class="prop prop-stamp" />
        <PixelCanvas :shape="SHAPE_COFFEE" :palette="PALETTES.coffee" :scale="3" :width="22" :height="26" class="prop prop-coffee" />
        <PixelCanvas :shape="SHAPE_PAPERS" :palette="PALETTES.papers" :scale="4" :width="30" :height="26" class="prop prop-papers" />
      </div>
    </div>

  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from "vue";
import PixelCanvas from "./components/PixelCanvas.vue";
import MenuScreen from "./components/MenuScreen.vue";
import GameScreen from "./components/GameScreen.vue";
import GameOverScreen from "./components/GameOverScreen.vue";
import { screen, state, selectedBotId, startGame, backToMenu, guessBot, guessHuman, insultBot } from "./gameStore.js";
import { SHAPE_LAMP, SHAPE_COFFEE, SHAPE_STAMP, SHAPE_PAPERS, PALETTES } from "./sprites.js";

function onKeydown(e) {
  if (!["1", "2", "3"].includes(e.key)) return;
  if (screen.value !== "game") return;
  // Pending notifications are urgent — answer those before the battlefield.
  // Otherwise act on whichever token is currently selected (same bot the
  // reply panel is showing), falling back to the oldest approaching one.
  const target = state.activeNotifications.find((b) => !b.resolved)
    || state.activeBots.find((b) => b.id === selectedBotId.value && !b.resolved)
    || state.activeBots.find((b) => !b.resolved);
  if (!target) return;
  if (e.key === "1") guessBot(target);
  else if (e.key === "2") guessHuman(target);
  else if (e.key === "3") insultBot(target);
}

onMounted(() => document.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => document.removeEventListener("keydown", onKeydown));
</script>
