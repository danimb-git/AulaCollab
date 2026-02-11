<template>
  <div class="auth-page auth-page--register">
    <AuthTitle>CREAR UN NOU COMPTE</AuthTitle>

    <div class="auth-form">
      <FormField
        label="Nom"
        placeholder="Exemple"
        v-model="name"
      />

      <FormField
        label="Cognom"
        placeholder="Exemple Exemple"
        v-model="surname"
      />

      <FormField
        label="Correu electrònic"
        type="email"
        placeholder="exemple@exemple.exemple"
        autocomplete="email"
        v-model="email"
      />

      <FormField
        label="Contrasenya"
        type="password"
        placeholder="***************"
        autocomplete="new-password"
        v-model="password"
      />

      <!-- Checkbox professor -->
      <div class="teacher-row">
        <input
          id="isTeacher"
          class="teacher-checkbox"
          type="checkbox"
          v-model="isTeacher"
        />
        <label for="isTeacher" class="teacher-label">
          Crear compte de professor
        </label>
      </div>

      <!-- Camp secret (només si és professor) -->
      <div v-if="isTeacher" class="secret-field">
        <input
          class="form-input secret-input"
          type="password"
          placeholder="pinsecret"
          v-model="teacherSecret"
        />
      </div>

      <div class="auth-actions">
        <RouterLink class="auth-link" to="/auth/login">
          Tornar a inici de sessió
        </RouterLink>

        <PrimaryButton @click="onRegister">
          Entrar
        </PrimaryButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

import AuthTitle from "../../components/ui/AuthTitle.vue";
import FormField from "../../components/ui/FormField.vue";
import PrimaryButton from "../../components/ui/PrimaryButton.vue";

const name = ref("");
const surname = ref("");
const email = ref("");
const password = ref("");
const isTeacher = ref(false);
const teacherSecret = ref("");

function onRegister() {
  console.log("REGISTER", {
    name: name.value,
    surname: surname.value,
    email: email.value,
    password: password.value,
    isTeacher: isTeacher.value,
    teacherSecret: teacherSecret.value,
  });
}
</script>
