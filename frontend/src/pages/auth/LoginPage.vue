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
        <PrimaryButton @click="onLogin">Entrar</PrimaryButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import AuthTitle from "../../components/ui/AuthTitle.vue";
import FormField from "../../components/ui/FormField.vue";
import PrimaryButton from "../../components/ui/PrimaryButton.vue";

const email = ref("");
const password = ref("");

function onLogin() {
  console.log("login", email.value, password.value);
}
</script>
