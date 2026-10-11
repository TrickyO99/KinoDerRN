import { reactive, ref } from "vue";
import {
  TROLL_LINES, TROLL_COMEBACK_BAD,
  ALLY_LINES, ALLY_COMEBACK_BAD,
  TROLL_NAMES, ALLY_NAMES,
  INJECTION_PROMPT,
} from "./content.js";

const MAX_CONCURRENT = 4;
const SPAWN_TICK_MS = 650;
const ALLY_CHANCE = 0.2;
const FOLLOWUP_CHANCE = 0.22;
const MAX_PENDING_NOTIFICATIONS = 2;

// Tone isn't a perfect tell: a hostile-sounding account is usually an
// actual bot, but sometimes it's just a genuinely dumb, real person — and
// a supportive-sounding one is occasionally a bot astroturfing sympathy.
const IDENTITY_FLIP_CHANCE = 0.15;

const BASE_LIVES = 3;
const BASE_TOUCH_THRESHOLD = 2; // consecutive touches before a life is lost
const PERK_TOUCH_THRESHOLD = 5; // with Mastodonte active
const BASE_TOUCH_DECAY_MS = 10000; // one forgiven touch every 10s

// A Perk-a-Cola-style shop: bought with money earned from good reads and
// insulting trolls. Persistent perks are lost when you lose a life — same
// rule as the real Call of Duty Zombies perks ("si un joueur est blessé,
// il perd tous les atouts").
export const PERKS = {
  mastodonte: {
    name: "Mastodonte",
    icon: "🦣",
    cost: 100,
    desc: "5 touchés avant de perdre une vie, au lieu de 2.",
  },
  revive: {
    name: "Réanimation Rapide",
    icon: "❤️",
    cost: 60,
    desc: "+1 vie immédiatement.",
  },
  cola: {
    name: "Cola Énergisant",
    icon: "⚡",
    cost: 50,
    desc: "Les touchés s'effacent 2x plus vite.",
  },
  phd: {
    name: "PHD Flopper",
    icon: "💪",
    cost: 70,
    desc: "Insulter qui que ce soit rapporte toujours gros.",
  },
};

export const GAMEOVER_MESSAGES = {
  lives: "Deux comptes de suite t'ont débordé. Plus de vies.",
  "missed-notification": "Tu as laissé une notification sans réponse.",
};

function pickOne(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Same incoming line never shows up twice back-to-back.
const lastLine = { ally: null, hostile: null };
function pickLine(stance) {
  const pool = stance === "ally" ? ALLY_LINES : TROLL_LINES;
  const key = stance === "ally" ? "ally" : "hostile";
  let pick = pickOne(pool);
  if (pool.length > 1) {
    while (pick === lastLine[key]) pick = pickOne(pool);
  }
  lastLine[key] = pick;
  return pick;
}

let botIdCounter = 0;
let spawnTimer = null;
let rafId = null;
let touchDecayTimer = null;

export const screen = ref("menu"); // "menu" | "game" | "gameover"

// Which approaching bot the reply panel currently shows. Shared between
// GameScreen (click-to-select tokens) and the global keyboard handler.
export const selectedBotId = ref(null);

export const state = reactive({
  difficulty: null,
  wave: 1,
  lives: BASE_LIVES,
  touchStreak: 0,
  touchThreshold: BASE_TOUCH_THRESHOLD,
  perks: { mastodonte: false, cola: false, phd: false },
  money: 0,
  score: 0,
  kills: 0,
  activeBots: [],
  activeNotifications: [],
  botsSpawnedThisWave: 0,
  botsInWave: 0,
  running: false,
  waveBannerText: "",
  waveBannerVisible: false,
  gameoverReason: "lives",
});

function timeForWave() {
  const d = state.difficulty;
  return Math.max(d.minTime, d.baseTime - 180 * (state.wave - 1));
}

function pickSpawnProfile() {
  const w = state.wave;
  if (w >= 2 && Math.random() < ALLY_CHANCE) {
    return { stance: "ally", type: "ally" };
  }
  const roll = Math.random();
  if (w >= 4 && roll < 0.2) return { stance: "hostile", type: "supertroll" };
  if (w >= 2 && roll < 0.5) return { stance: "hostile", type: "bluecheck" };
  return { stance: "hostile", type: "troll" };
}

function buildBot(profile, opts) {
  const { stance, type } = profile;
  const isNotification = !!(opts && opts.isNotification);
  const duration = isNotification ? timeForWave() * 1.3 : timeForWave();
  const line = pickLine(stance);
  const name = profile.name || (stance === "ally" ? pickOne(ALLY_NAMES) : pickOne(TROLL_NAMES));
  // A follow-up notification is the same account replying again — it keeps
  // whatever true identity it already had, rather than rolling a new one.
  const isActuallyBot = typeof profile.isActuallyBot === "boolean"
    ? profile.isActuallyBot
    : (Math.random() < IDENTITY_FLIP_CHANCE ? stance !== "hostile" : stance === "hostile");

  return reactive({
    id: ++botIdCounter,
    stance,
    type,
    name,
    isActuallyBot,
    line,
    duration,
    startedAt: performance.now(),
    resolved: false,
    isNotification,
    specialMode: false, // true while the "guess: bot" prompt-injection flash plays
    insultFlash: null, // set briefly to show which insult you actually sent
    timeLeftPct: 100,
    anim: null,
    killFx: null,
    deltaToast: null,
    // Fixed at spawn — which direction it approaches the pinned tweet from.
    angle: Math.random() * Math.PI * 2,
    mins: 1 + Math.floor(Math.random() * 12),
    nReplies: Math.floor(Math.random() * 40),
    nRetweets: Math.floor(Math.random() * 90),
    nLikes: Math.floor(Math.random() * 400),
  });
}

function spawnBot() {
  const profile = pickSpawnProfile();
  state.activeBots.push(buildBot(profile, { isNotification: false }));
}

function spawnNotification(profile) {
  if (!state.running) return;
  if (state.activeNotifications.length >= MAX_PENDING_NOTIFICATIONS) return;
  state.activeNotifications.push(buildBot(profile, { isNotification: true }));
}

function trySpawn() {
  if (!state.running) return;
  if (state.activeBots.length >= MAX_CONCURRENT) return;
  if (state.botsSpawnedThisWave >= state.botsInWave) return;
  spawnBot();
  state.botsSpawnedThisWave++;
}

function flashWaveBanner(text) {
  state.waveBannerText = text;
  state.waveBannerVisible = true;
  setTimeout(() => { state.waveBannerVisible = false; }, 1400);
}

function startWave() {
  const d = state.difficulty;
  state.botsInWave = d.startBots + d.botIncrement * (state.wave - 1);
  state.botsSpawnedThisWave = 0;

  flashWaveBanner(`VAGUE ${state.wave}`);

  clearInterval(spawnTimer);
  spawnTimer = setInterval(trySpawn, SPAWN_TICK_MS);
  trySpawn();
}

function checkWaveProgress() {
  if (!state.running) return;
  if (state.botsSpawnedThisWave >= state.botsInWave && state.activeBots.length === 0) {
    state.score += 50 * state.wave;
    state.wave++;
    setTimeout(startWave, 900);
  }
}

// action: "guess-bot" (🔴) | "guess-human" (🟢) | "insult" | "miss" (timer
// ran out / reached the tower untouched). Guessing right pays out; guessing
// wrong counts as a touch. Insulting a hostile account is rewarded — the
// whole point of the game — but insulting a genuine supporter still isn't.
function applyResolution(bot, action) {
  const isAlly = bot.stance === "ally";
  const bigMult = bot.type === "supertroll" ? 1.5 : 1;

  let scoreDelta = 0;
  let moneyDelta = 0;
  let animClass = "fading";
  let touched = false;
  let killFx = null;

  if (action === "guess-bot" || action === "guess-human") {
    const guessedBot = action === "guess-bot";
    const correct = guessedBot === bot.isActuallyBot;
    if (correct) {
      state.kills++;
      scoreDelta = Math.round((isAlly ? 20 : bot.type === "supertroll" ? 20 : 10) * (isAlly ? 1 : bigMult));
      moneyDelta = 10; // a correct, great read is what pays out
      animClass = "exploding";
      if (guessedBot) killFx = "robot"; // caught an actual bot — show it shutting down
    } else {
      scoreDelta = 0;
      animClass = "leaking";
      touched = true;
    }
  } else if (action === "insult") {
    if (isAlly && !state.perks.phd) {
      // Being rude to someone actually on your side still isn't the point —
      // unless PHD Flopper is active, which pays out on literally everyone.
      scoreDelta = 0;
      animClass = "leaking";
    } else {
      // Insulting a troll back — the whole point of the game.
      state.kills++;
      scoreDelta = Math.round((bot.type === "supertroll" ? 35 : 18) * bigMult);
      animClass = "exploding";
    }
  } else {
    // "miss" — nobody answered in time and it reached the tower. A genuine
    // supporter reaching you unanswered still wins; a troll getting through
    // counts as a touch.
    if (isAlly) {
      state.kills++;
      scoreDelta = 20;
      moneyDelta = 10;
      animClass = "exploding";
    } else {
      scoreDelta = 0;
      animClass = "leaking";
      touched = true;
    }
  }

  state.score += scoreDelta;
  state.money += moneyDelta;
  bot.anim = animClass;
  bot.killFx = killFx;
  bot.deltaToast = { scoreDelta, moneyDelta, touched };

  if (touched) {
    state.touchStreak++;
    if (state.touchStreak >= state.touchThreshold) {
      state.touchStreak = 0;
      state.lives--;
      losePerks(); // getting hit costs you your perks, same as real Zombies
    }
  } else {
    // Any deliberate, successful engagement forgives a pending touch.
    state.touchStreak = 0;
  }

  // The robot-shutdown flourish needs more time on screen to actually read.
  const cleanupDelay = killFx === "robot" ? 900 : 320;
  setTimeout(() => {
    if (bot.isNotification) {
      state.activeNotifications = state.activeNotifications.filter((b) => b.id !== bot.id);
    } else {
      state.activeBots = state.activeBots.filter((b) => b.id !== bot.id);
      checkWaveProgress();
    }
  }, cleanupDelay);

  if (state.lives <= 0) {
    endGame("lives");
    return;
  }

  // The account sometimes comes back to answer what you just said — that
  // follow-up lands as an urgent notification, not a regular wave bot.
  if (!bot.isNotification && state.running && Math.random() < FOLLOWUP_CHANCE) {
    const delay = 1200 + Math.random() * 1400;
    setTimeout(() => {
      spawnNotification({ stance: bot.stance, type: bot.type, name: bot.name, isActuallyBot: bot.isActuallyBot });
    }, delay);
  }
}

export function guessBot(bot) {
  if (bot.resolved) return;
  bot.resolved = true; // claim immediately so the countdown can't also resolve it
  bot.specialMode = true; // flashes the prompt-injection line briefly
  setTimeout(() => applyResolution(bot, "guess-bot"), 650);
}

export function guessHuman(bot) {
  if (bot.resolved) return;
  bot.resolved = true;
  applyResolution(bot, "guess-human");
}

export function insultBot(bot) {
  if (bot.resolved) return;
  bot.resolved = true;
  bot.insultFlash = pickOne(bot.stance === "ally" ? ALLY_COMEBACK_BAD : TROLL_COMEBACK_BAD);
  setTimeout(() => applyResolution(bot, "insult"), 650);
}

function tick(now) {
  if (!state.running) return;

  for (const bot of state.activeBots) {
    if (bot.resolved) continue;
    const elapsed = now - bot.startedAt;
    bot.timeLeftPct = Math.max(0, (1 - elapsed / bot.duration) * 100);
    if (elapsed >= bot.duration) {
      bot.resolved = true;
      applyResolution(bot, "miss");
    }
  }

  // Notifications are higher-stakes: missing the deadline ends the run.
  for (const bot of state.activeNotifications) {
    if (bot.resolved) continue;
    const elapsed = now - bot.startedAt;
    bot.timeLeftPct = Math.max(0, (1 - elapsed / bot.duration) * 100);
    if (elapsed >= bot.duration) {
      bot.resolved = true;
      bot.anim = "leaking";
      endGame("missed-notification");
      return;
    }
  }

  rafId = requestAnimationFrame(tick);
}

function restartTouchDecay(intervalMs) {
  clearInterval(touchDecayTimer);
  touchDecayTimer = setInterval(() => {
    if (state.touchStreak > 0) state.touchStreak--;
  }, intervalMs);
}

function losePerks() {
  state.perks.mastodonte = false;
  state.perks.cola = false;
  state.perks.phd = false;
  state.touchThreshold = BASE_TOUCH_THRESHOLD;
  restartTouchDecay(BASE_TOUCH_DECAY_MS);
}

export function buyPerk(key) {
  const perk = PERKS[key];
  if (!perk || state.money < perk.cost) return;
  if (key !== "revive" && state.perks[key]) return; // already owned

  state.money -= perk.cost;

  if (key === "revive") {
    state.lives++;
  } else if (key === "mastodonte") {
    state.perks.mastodonte = true;
    state.touchThreshold = PERK_TOUCH_THRESHOLD;
  } else if (key === "cola") {
    state.perks.cola = true;
    restartTouchDecay(BASE_TOUCH_DECAY_MS / 2);
  } else if (key === "phd") {
    state.perks.phd = true;
  }
}

export function startGame(difficulty) {
  state.difficulty = difficulty;
  state.wave = 1;
  state.lives = BASE_LIVES;
  state.touchStreak = 0;
  state.touchThreshold = BASE_TOUCH_THRESHOLD;
  state.perks.mastodonte = false;
  state.perks.cola = false;
  state.perks.phd = false;
  state.money = 0;
  state.score = 0;
  state.kills = 0;
  state.activeBots = [];
  state.activeNotifications = [];
  selectedBotId.value = null;

  screen.value = "game";
  startWave();

  if (!state.running) {
    state.running = true;
    requestAnimationFrame(tick);
  }

  restartTouchDecay(BASE_TOUCH_DECAY_MS);
}

function endGame(reason) {
  state.running = false;
  clearInterval(spawnTimer);
  clearInterval(touchDecayTimer);
  if (rafId) cancelAnimationFrame(rafId);
  state.gameoverReason = reason;
  setTimeout(() => { screen.value = "gameover"; }, 400);
}

export function backToMenu() {
  screen.value = "menu";
}

export function randStat(base) {
  return (base * 37 + 12).toLocaleString("fr-FR");
}

export { INJECTION_PROMPT };
