<template>
  <div class="auth-page auth-page--login">
    <AuthTitle>INICIA SESSIÓ</AuthTitle>

    <div class="auth-form">
      <FormField
        label="Correu electrònic"
        align="center"
        type="email"
        placeholder="exemple@exemple.exemple"
        autocomplete="email"
        v-model="email"
      />

      <FormField
        label="Contrasenya"
        align="center"
        type="password"
        placeholder="***************"
        autocomplete="current-password"
        v-model="password"
      />

      <div class="auth-actions">
        <RouterLink class="auth-link" to="/auth/register">Crear un nou compte</RouterLink>
        <PrimaryButton :disabled="loading" @click="onLogin">
          {{ loading ? "Entrant..." : "Entrar" }}
        </PrimaryButton>

      </div>
      <p v-if="error" class="auth-error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import AuthTitle from "../../components/ui/AuthTitle.vue";
import FormField from "../../components/ui/FormField.vue";
import PrimaryButton from "../../components/ui/PrimaryButton.vue";
import { apiRequest } from "../../services/api.js";
import { useRouter }  from "vue-router";

const email = ref("");
const password = ref("");
const error = ref(""); 
const loading = ref(false);
const router = useRouter();

async function onLogin() {
  error.value = "";

  if (!email.value.trim() || !password.value.trim()) {
    error.value = "Introdueix correu i contrasenya.";
    return;
  }

  try {
    loading.value = true;

    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: email.value.trim(),
        password: password.value,
      }),
    });

    localStorage.setItem("accessToken", data.accessToken);
    router.push("/moodle");
  } catch (e) {
    error.value = e.message || "No s'ha pogut iniciar sessió.";
  } finally {
    loading.value = false;
  }
}

</script>
