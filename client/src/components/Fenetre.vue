<script setup lang="ts">
defineProps<{
  title: string
}>()

defineEmits<{
  close: []
}>()
</script>

<template>
  <section class="fenetre">
    <header class="fenetre__barre">
      <span class="fenetre__titre">{{ title }}</span>
      <button class="fenetre__fermer" type="button" aria-label="Fermer" @click="$emit('close')">
        ×
      </button>
    </header>

    <div class="fenetre__contenu">
      <slot />
    </div>
  </section>
</template>
