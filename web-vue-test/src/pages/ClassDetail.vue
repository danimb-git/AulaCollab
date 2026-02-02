<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getClassDetail } from "../services/classes.service.js";
import AddMembersForm from "../components/AddMembersForm.vue";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const error = ref("");
const detail = ref(null);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const res = await getClassDetail(route.params.id);
    detail.value = res.data;
  } catch (e) {
    error.value = e.message || "Error carregant detall";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div>
    <button @click="router.push('/classes')">← Tornar</button>

    <p v-if="loading">Carregant...</p>
    <p v-if="error" style="color:red">{{ error }}</p>

    <div v-if="detail">
      <h3>{{ detail.nom }}</h3>
      <p>Rol: <b>{{ detail.role }}</b></p>

      <h4>Membres</h4>
      <ul>
        <li v-for="m in detail.members" :key="m.id">
          {{ m.email }} ({{ m.rol }})
        </li>
      </ul>

      <div v-if="detail.role === 'PROFESSOR'" style="margin-top: 16px">
        <h4>Afegir membres</h4>
        <AddMembersForm :classId="detail.id" />
      </div>

      <p v-else style="opacity: 0.7; margin-top: 12px">
        Només el professor pot afegir membres.
      </p>
    </div>
  </div>
</template>
