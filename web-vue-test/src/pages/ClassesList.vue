<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { getClasses } from "../services/classes.service.js";

const router = useRouter();
const loading = ref(false);
const error = ref("");
const classes = ref([]);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const res = await getClasses();
    classes.value = res.data || [];
  } catch (e) {
    error.value = e.message || "Error carregant classes";
  } finally {
    loading.value = false;
  }
}

function goToClass(id) {
  router.push(`/classes/${id}`);
}

onMounted(load);
</script>

<template>
  <div>
    <h3>Llista de classes</h3>

    <p v-if="loading">Carregant...</p>
    <p v-if="error" style="color:red">{{ error }}</p>

    <p v-if="!loading && classes.length === 0">No tens classes encara.</p>

    <ul v-if="classes.length">
      <li v-for="c in classes" :key="c.id" style="margin-bottom: 8px">
        <button @click="goToClass(c.id)">
          {{ c.nom || c.name || c.id }}
        </button>
      </li>
    </ul>
  </div>
</template>
