<template>
  <TopBar v-if="false" />
  <!-- Global drawers so they can be opened from any page via useShell -->
  <LeftDrawer
    v-if="leftMenuOpen"
    :classes="classes"
    :groups="groups"
    :showGroups="isStudent"
    @go-class="onGoClass"
    @go-group="onGoGroup"
  />

  <RightChatDrawer v-if="chatMenuOpen" :chats="mockChats" @back="closeChat" />

  <div v-if="leftMenuOpen || chatMenuOpen || profileMenuOpen" class="overlay" @click="onOverlayClick" />

  <router-view />
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import LeftDrawer from "./components/app/LeftDrawer.vue";
import RightChatDrawer from "./components/app/RightChatDrawer.vue";
import TopBar from "./components/app/TopBar.vue";
import { leftMenuOpen, chatMenuOpen, profileMenuOpen, closeAll, toggleProfile } from "./composables/useShell";
import { getClasses, getGroups, getCurrentUser } from "./services/api";

const router = useRouter();
const classes = ref([]);
const groups = ref([]);
const mockChats = ref([]);
const isStudent = ref(true);

function onGoClass(id) { router.push(`/classes/${id}`); leftMenuOpen.value = false; }
function onGoGroup(id) { router.push(`/groups/${id}`); leftMenuOpen.value = false; }
function closeChat() { chatMenuOpen.value = false; }

function onOverlayClick() {
  if (profileMenuOpen.value) {
    toggleProfile();
  } else {
    closeAll();
  }
}

async function load() {
  try {
    classes.value = await getClasses();
  } catch (e) { classes.value = []; }
  try {
    const user = getCurrentUser();
    isStudent.value = user ? user.role === "ALUMNE" : true;
    if (isStudent.value) groups.value = await getGroups();
  } catch (e) { groups.value = []; }
}

onMounted(() => { load(); });
</script>

<style>
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 900; }
</style>