<script setup>
import { ref } from "vue";
import { addMembersByEmail } from "../services/classes.service.js";

const props = defineProps({
  classId: { type: String, required: true },
});

const emailsText = ref("");
const loading = ref(false);
const error = ref("");
const result = ref(null);

function parseEmails(text) {
  return text
    .split(/[\n,; ]+/)
    .map((e) => e.trim())
    .filter(Boolean);
}

async function submit() {
  error.value = "";
  result.value = null;

  const emails = parseEmails(emailsText.value);
  if (emails.length === 0) {
    error.value = "Escriu almenys un email.";
    return;
  }

  loading.value = true;
  try {
    const res = await addMembersByEmail(props.classId, emails);
    result.value = res.data; // ✅ { added, alreadyMembers, notFound }
  } catch (e) {
    error.value = e.message || "Error afegint membres";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <textarea
      v-model="emailsText"
      rows="4"
      style="width: 420px; max-width: 100%"
      placeholder="Ex: anna@gmail.com, pau@gmail.com"
    />

    <div style="margin-top: 8px">
      <button @click="submit" :disabled="loading">
        {{ loading ? "Afegint..." : "Afegir" }}
      </button>
    </div>

    <p v-if="error" style="color:red">{{ error }}</p>

    <div v-if="result" style="margin-top: 12px">
      <div>
        <b>✅ Afegits</b>
        <pre>{{ result.added }}</pre>
      </div>
      <div>
        <b>ℹ️ Ja eren membres</b>
        <pre>{{ result.alreadyMembers }}</pre>
      </div>
      <div>
        <b>⚠️ No trobats</b>
        <pre>{{ result.notFound }}</pre>
      </div>
    </div>
  </div>
</template>
