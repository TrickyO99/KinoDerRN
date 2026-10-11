<template>
  <section class="screen">
    <h1 class="title">KINO DER RN</h1>
    <p class="subtitle">Une armée de bots d'extrême droite débarque sous ton tweet.<br>Tiens bon jusqu'à la dernière vague.</p>

    <div class="tweet-grid">
      <div v-for="d in DIFFICULTIES" :key="d.id" class="tweet-card" @click="$emit('start', d)">
        <span class="diff-label" :class="d.className">{{ d.label }}</span>
        <div class="tweet-text">"{{ d.tweet }}"</div>
      </div>
    </div>

    <p class="hint">
      Choisis un tweet pour lancer la partie. Les comptes approchent ton tweet de tous les côtés — clique-en un pour lui répondre.<br>
      🔴 C'est un bot · 🟢 C'est une vraie personne — devine juste pour marquer des points et de l'argent. Te tromper compte comme un touché.<br>
      😈 Insulte-le quand tu veux : sur un vrai troll c'est le meilleur coup du jeu, sur un vrai soutien ça ne rapporte rien.<br>
      Tu as 3 vies. Une vie tombe après 2 touchés d'affilée (un touché s'efface tout seul toutes les 10 secondes). Laisse un compte t'atteindre sans réponse et c'est un touché direct.<br>
      🦣 Ramasse le bonus Mastodon quand il apparaît : 5 touchés avant de perdre une vie, pendant 25 secondes.<br>
      🔔 Une notification peut revenir répondre à ce que tu viens de dire — rate son délai et c'est terminé.
    </p>
  </section>
</template>

<script setup>
import { DIFFICULTIES } from "../content.js";

defineEmits(["start"]);
</script>
