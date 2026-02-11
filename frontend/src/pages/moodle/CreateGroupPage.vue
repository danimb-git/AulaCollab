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

        <PrimaryButton @click="onSubmit">Crear</PrimaryButton>
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

import AuthTitle from "../../components/ui/AuthTitle.vue";
import FormField from "../../components/ui/FormField.vue";
import PrimaryButton from "../../components/ui/PrimaryButton.vue";

const router = useRouter();

const name = ref("");
const error = ref("");

function goBack() {
  router.push("/moodle");
}

async function onSubmit() {
  error.value = "";

  if (!name.value.trim()) {
    error.value = "El nom és obligatori.";
    return;
  }

  // await api.post("/groups", { name: name.value })

  console.log("Crear grup (mock):", name.value);

  router.push("/moodle");
}
</script>
