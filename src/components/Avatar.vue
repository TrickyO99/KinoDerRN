<template>
  <img :src="dataUri" class="avatar-img" :alt="seed" />
</template>

<script setup>
import { computed } from "vue";
import { createAvatar } from "@dicebear/core";
import { avataaars } from "@dicebear/collection";

// Illustrated, fully synthetic portraits (DiceBear) seeded by account name —
// same account always gets the same face, nobody real depicted.
const props = defineProps({
  seed: { type: String, required: true },
  backgroundColor: { type: String, default: "0d1117" },
});

const dataUri = computed(() => {
  const avatar = createAvatar(avataaars, {
    seed: props.seed,
    backgroundColor: [props.backgroundColor],
    backgroundType: ["solid"],
  });
  return avatar.toDataUri();
});
</script>

<style scoped>
/* No width/height here on purpose — the caller sizes this via the
   fallthrough class (.bot-sprite / .pinned-avatar), and a scoped rule would
   out-specificity that global class and ignore it. */
.avatar-img {
  display: block;
  object-fit: cover;
}
</style>
