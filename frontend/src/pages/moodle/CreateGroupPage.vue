<template>
  <div class="auth-page auth-page--login">
    <AuthTitle>CREAR UN NOU GRUP D'ESTUDI</AuthTitle>

    <form class="auth-form" @submit.prevent="onSubmit">
      <FormField
        label="Nom"
        align="center"
        placeholder="Exemple"
        v-model="name"
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
      - Aquí faria POST /groups amb { name }
      - El backend retornaria el grup creat
      - Després: router.push('/moodle') i refrescar llistat de grups
    -->
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { createGroup } from "../../services/api";

import AuthTitle from "../../components/ui/AuthTitle.vue";
import FormField from "../../components/ui/FormField.vue";
import PrimaryButton from "../../components/ui/PrimaryButton.vue";

const router = useRouter();

const name = ref("");
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
    };
    console.log("📝 Group form submitted. Creating group with payload:", payload);
    await createGroup(payload);
    console.log("✅ Group created successfully. Redirecting to /moodle");
    // Si tot ok, tornar a home
    await router.push("/moodle");
  } catch (e) {
    error.value = e.message || "Error al crear el grup";
    console.error("❌ Error creating group:", e);
  } finally {
    loading.value = false;
  }
}
</script>
