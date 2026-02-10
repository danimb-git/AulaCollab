<template>
  <div class="form-field">
    <div
      v-if="label"
      class="form-label"
      :class="align === 'center' ? 'form-label--center' : 'form-label--left'"
    >
      {{ label }}
    </div>

    <input
      class="form-input"
      :type="type"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, default: "" },
  type: { type: String, default: "text" },
  placeholder: { type: String, default: "" },
  autocomplete: { type: String, default: "" },
  align: { type: String, default: "left" }, // 'left' | 'center'
  modelValue: { type: String, default: "" },
});

defineEmits(["update:modelValue"]);
</script>
