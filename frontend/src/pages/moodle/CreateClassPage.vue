<template>
  <div class="auth-page auth-page--login">
    <AuthTitle>CREAR UNA NOVA CLASSE</AuthTitle>

    <form class="auth-form" @submit.prevent="onSubmit">
      <FormField
        label="Nom"
        align="center"
        placeholder="Exemple"
        v-model="name"
      />

      <FormField
        label="Descripció"
        align="left"
        placeholder="Exemple Exemple Exemple..."
        v-model="description"
        :multiline="true"
        :rows="6"
      />

      <div class="auth-actions">
        <button type="button" class="auth-link" @click="goBack">
          Tornar a pàgina d'inici
        </button>

        <PrimaryButton type="submit">Crear</PrimaryButton>
      </div>

      <p v-if="error" class="auth-error">{{ error }}</p>
    </form>

    <!--
      BACKEND:
      - Aquí faria POST /classes amb { name, description }
      - El backend agafa teacherId del JWT i crea la classe associada
      - Després: router.push('/moodle') i refrescar llistat de classes
    -->
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { createClass } from "../../services/api";

import AuthTitle from "../../components/ui/AuthTitle.vue";
import FormField from "../../components/ui/FormField.vue";
import PrimaryButton from "../../components/ui/PrimaryButton.vue";

const router = useRouter();

const name = ref("");
const description = ref("");
const error = ref("");
const loading = ref(false);

function goBack() {
  router.push("/moodle");
}

async function onSubmit() {
  error.value = "";

  if (!name.value.trim()) {
    error.value = "El nom és obligatori.";
    return;
  }

  loading.value = true;
  try {
    const payload = {
      nom: name.value.trim(),
      descripcio: description.value.trim() || null,
    };
    console.log("📝 Form submitted. Creating class with payload:", payload);
    await createClass(payload);
    console.log("✅ Class created successfully. Redirecting to /moodle");
    // Si tot ok, tornar a home
    await router.push("/moodle");
  } catch (e) {
    error.value = e.message || "Error al crear la classe";
    console.error("❌ Error creating class:", e);
  } finally {
    loading.value = false;
  }
}
</script>
