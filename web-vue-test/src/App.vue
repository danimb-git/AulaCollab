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
  <div style="padding: 20px; font-family: sans-serif">
    <h2>AulaCollab – Classes</h2>
    <router-view />
  </div>
</template>

