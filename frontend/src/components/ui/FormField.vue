<template>
  <div class="form-field">
    <div
      v-if="label"
      class="form-label"
      :class="align === 'center' ? 'form-label--center' : 'form-label--left'"
    >
      {{ label }}
    </div>

    <!-- Si multiline=true -> textarea -->
    <textarea
      v-if="multiline"
      class="form-textarea"
      :placeholder="placeholder"
      :rows="rows"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    ></textarea>

    <!-- Si multiline=false -> input normal -->
    <input
      v-else
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

  multiline: { type: Boolean, default: false },
  rows: { type: Number, default: 6 },
});

defineEmits(["update:modelValue"]);
</script>
