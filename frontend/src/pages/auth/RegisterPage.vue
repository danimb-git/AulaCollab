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

const name = ref("");
const surname = ref("");
const email = ref("");
const password = ref("");
const isTeacher = ref(false);
const teacherSecret = ref("");
const router = useRouter()
const error = ref("")
const loading = ref(false)

async function onRegister() {
  error.value = "";

  if (!name.value.trim() || !surname.value.trim() || !email.value.trim() || !password.value.trim()) {
    error.value = "Omple tots els camps obligatoris.";
    return;
  }

  if (isTeacher.value && !teacherSecret.value.trim()) {
    error.value = "Si ets professor, cal introduir el PIN.";
    return;
  }

  const payload = {
    nom: name.value.trim(),
    cognom: surname.value.trim(),
    email: email.value.trim(),
    password: password.value,
    isTeacher: isTeacher.value,
    teacherPin: isTeacher.value ? teacherSecret.value.trim() : undefined,
  };

  try {
    loading.value = true;

    await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    router.push("/auth/login");
  } catch (e) {
    error.value = e.message || "No s'ha pogut crear el compte.";
  } finally {
    loading.value = false;
  }
}

</script>
