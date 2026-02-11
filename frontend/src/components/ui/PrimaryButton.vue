<template>
  <!-- v-bind="$attrs" fa que funcionin class="", type="", disabled="", etc. -->
  <button class="btn" :type="type" v-bind="$attrs" @click="$emit('click')">
    <slot />
  </button>
</template>

<script setup>
defineProps({
  type: { type: String, default: "button" }, // ara sí: submit / button
});
defineEmits(["click"]);
</script>
