<template>
  <section class="screen game-screen-layout">
    <div class="game-main">
      <div class="hud">
        <div class="hud-block">
          <span class="hud-label">VAGUE</span>
          <span class="hud-value">{{ state.wave }}</span>
        </div>
        <div class="hud-block hud-lives">
          <span class="hud-label">VIES</span>
          <span class="hud-value lives-value">
            <span v-for="n in 3" :key="n" class="life-icon">{{ n <= state.lives ? "❤" : "🖤" }}</span>
          </span>
        </div>
        <div class="hud-block">
          <span class="hud-label">SCORE</span>
          <span class="hud-value">{{ state.score }}</span>
        </div>
        <div class="hud-block">
          <span class="hud-label">ARGENT</span>
          <span class="hud-value money-value">💰 {{ state.money }}</span>
        </div>
      </div>

      <div class="touch-row">
        <span class="touch-label">Touches : {{ state.touchStreak }}/{{ state.touchThreshold }}</span>
      </div>

      <div class="pinned-tweet">
        <Avatar seed="toi" background-color="3ddc84" class="pinned-avatar" />
        <div class="tweet-body">
          <div class="tweet-handle">@toi · à l'instant</div>
          <div class="tweet-text">"{{ state.difficulty && state.difficulty.tweet }}"</div>
          <div class="tweet-stats">{{ randStat(state.wave) }} réponses · {{ randStat(state.wave * 3) }} vues</div>
        </div>
      </div>

      <div class="wave-banner" :class="{ hidden: !state.waveBannerVisible }">{{ state.waveBannerText }}</div>

      <div class="notification-lane">
        <BotCard
          v-for="bot in state.activeNotifications"
          :key="bot.id"
          :bot="bot"
          @guess-bot="guessBot(bot)"
          @guess-human="guessHuman(bot)"
          @insult="insultBot(bot)"
        />
      </div>

      <div class="battlefield">
        <div class="tower">
          <Avatar seed="toi" background-color="3ddc84" class="tower-avatar" />
        </div>
        <BotToken
          v-for="bot in state.activeBots"
          :key="bot.id"
          :bot="bot"
          :is-selected="selectedBot && bot.id === selectedBot.id"
          @select="selectedBotId = bot.id"
        />
      </div>

      <div class="reply-panel">
        <BotCard
          v-if="selectedBot"
          :bot="selectedBot"
          @guess-bot="guessBot(selectedBot)"
          @guess-human="guessHuman(selectedBot)"
          @insult="insultBot(selectedBot)"
        />
        <p v-else class="reply-panel-empty">Clique un compte qui approche pour lui répondre.</p>
      </div>
    </div>

    <aside class="shop-panel">
      <div class="shop-title">🏪 BOUTIQUE</div>
      <button
        v-for="(perk, key) in PERKS"
        :key="key"
        class="perk-btn"
        :class="{ owned: isOwned(key), unaffordable: state.money < perk.cost }"
        :disabled="isOwned(key) || state.money < perk.cost"
        @click="buyPerk(key)"
      >
        <span class="perk-head">
          <span class="perk-icon">{{ perk.icon }}</span>
          <span class="perk-name">{{ perk.name }}</span>
        </span>
        <span class="perk-desc">{{ perk.desc }}</span>
        <span class="perk-cost">{{ isOwned(key) ? "ACTIF" : `💰 ${perk.cost}` }}</span>
      </button>
    </aside>
  </section>
</template>

<script setup>
import { computed } from "vue";
import Avatar from "./Avatar.vue";
import BotCard from "./BotCard.vue";
import BotToken from "./BotToken.vue";
import { state, selectedBotId, guessBot, guessHuman, insultBot, buyPerk, PERKS, randStat } from "../gameStore.js";

const selectedBot = computed(
  () => state.activeBots.find((b) => b.id === selectedBotId.value) || state.activeBots[0] || null
);

function isOwned(key) {
  return key !== "revive" && state.perks[key];
}
</script>
