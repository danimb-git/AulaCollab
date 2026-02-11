<template>
  <div class="modalOverlay" @click.self="$emit('close')">
    <div class="modalBox">
      <button class="modalClose" type="button" @click="$emit('close')">x</button>
      <div class="modalContent">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(["close"]);
</script>
