<script setup>
import { ref } from "vue"
import { getClasses, getClassDetail, addMembersByEmail } from "./services/classes.service.js"

const list = ref(null)
const detail = ref(null)
const loading = ref(false)
const error = ref("")

// Form add members
const emailsText = ref("")
const addResult = ref(null)

async function loadList() {
  loading.value = true
  error.value = ""
  detail.value = null
  addResult.value = null
  try {
    list.value = await getClasses()
  } catch (e) {
    error.value = e.message || "Error carregant llista"
  } finally {
    loading.value = false
  }
}

async function loadDetail(id) {
  loading.value = true
  error.value = ""
  addResult.value = null
  try {
    detail.value = await getClassDetail(id)
  } catch (e) {
    error.value = e.message || "Error carregant detall"
  } finally {
    loading.value = false
  }
}

function parseEmails(text) {
  return text
    .split(/[\n,; ]+/)
    .map(e => e.trim())
    .filter(Boolean)
}

async function submitAddMembers() {
  if (!detail.value?.id) {
    error.value = "Primer carrega el detall d'una classe."
    return
  }

  const emails = parseEmails(emailsText.value)
  if (emails.length === 0) {
    error.value = "Escriu almenys un email."
    return
  }

  loading.value = true
  error.value = ""
  addResult.value = null
  try {
    addResult.value = await addMembersByEmail(detail.value.id, emails)
  } catch (e) {
    error.value = e.message || "Error afegint membres"
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="padding: 24px">
    <h1>Prova Classes</h1>

    <button @click="loadList">Carregar totes les classes</button>

    <p v-if="loading">Carregant...</p>
    <p v-if="error" style="color:red">{{ error }}</p>

    <div v-if="list" style="margin-top:16px">
      <h3>Llista classes</h3>
      <pre>{{ list }}</pre>

      <h4>Provar detall</h4>
      <button @click="loadDetail(1)">Detall classe 1</button>
      <button @click="loadDetail(2)">Detall classe 2</button>
    </div>

    <div v-if="detail" style="margin-top:16px">
      <h3>Detall classe</h3>
      <pre>{{ detail }}</pre>

      <h3>Afegir membres per email</h3>
      <textarea
        v-model="emailsText"
        rows="4"
        style="width: 420px; max-width: 100%"
        placeholder="Ex: anna@gmail.com, pau@old.com, notfound404@mail.com"
      />
      <br />
      <button @click="submitAddMembers">Afegir</button>

      <div v-if="addResult" style="margin-top:12px">
        <b>✅ Afegits</b>
        <pre>{{ addResult.added }}</pre>

        <b>ℹ️ Ja eren membres</b>
        <pre>{{ addResult.alreadyMembers }}</pre>

        <b>⚠️ No trobats</b>
        <pre>{{ addResult.notFound }}</pre>
      </div>
    </div>
  </div>
</template>
