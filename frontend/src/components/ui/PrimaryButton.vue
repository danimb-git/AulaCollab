<template>
  <button class="btn" type="button" @click="$emit('click')">
    <slot />
  </button>
</template>

<script setup>
defineEmits(["click"]);
</script>
