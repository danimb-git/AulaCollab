<template>
  <!-- Barra superior fixa -->
  <header class="topbar">
    <!-- Botó esquerre: obrir/tancar menú lateral esquerre -->
    <button class="icon-btn" @click="emitToggleLeft">
      <span class="hamburger"></span>
    </button>

    <!-- Part dreta: botó de xats + botó de perfil -->
    <div class="topbar-right">
      <!-- Botó xats (icona missatge) -->
      <button class="icon-btn" @click="emitToggleChat">
        <span class="msg-icon"></span>
      </button>

      <!-- Botó perfil -->
      <button class="profile-btn" @click="emitToggleProfile">
        <span class="profile-text">{{ profileName || "Perfil" }}</span>
        <span class="profile-avatar"></span>
      </button>
    </div>

    <!-- Dropdown del perfil (només es veu si el flag global o la prop està oberta) -->
    <div v-if="(isProfileOpen || showProfileDropdown) || profileMenuOpen" class="profile-menu">
      <div class="profile-item">{{ displayName }}</div>
      <button @click="emitLogout">Tancar sessió</button>
    </div>
  </header>
</template>

<script setup>
/**
 * TopBar.vue
 * Component de la barra superior.
 *
 * No gestiona l'estat intern (no guarda si està obert/tancat).
 * Només:
 *  - Mostra botons
 *  - Quan cliques, "avisa" el pare (MoodleHomePage) amb emits
 */

defineProps({
  // El pare li diu si el menú de perfil està obert o no
  isProfileOpen: { type: Boolean, default: false },

  // Nom (o email) a mostrar al botó de perfil
  profileName: { type: String, default: "" },
});

const emit = defineEmits([
  "toggle-left",
  "toggle-chat",
  "toggle-profile",
  "logout",
]);

import { getCurrentUser } from "../../services/api";
import { computed } from "vue";
import { toggleLeft, toggleChat, toggleProfile, profileMenuOpen } from "../../composables/useShell";

const user = getCurrentUser();
const displayName = computed(() => {
  if (!user) return "Perfil";
  const first = user.nom || user.firstName || "";
  const last = user.cognom || user.lastName || "";
  const combined = `${first} ${last}`.trim();
  return combined || user.email || "Perfil";
});

function emitToggleLeft() {
  // Toggle global left drawer
  toggleLeft();
  emit("toggle-left");
}

function emitToggleChat() {
  // Toggle global chat drawer
  toggleChat();
  emit("toggle-chat");
}

function emitToggleProfile() {
  toggleProfile();
  emit("toggle-profile");
}

function emitLogout() {
  /**
   * 🔐 BACKEND:
   * El pare (MoodleHomePage) rebrà aquest event
   * i farà:
   *
   *  - POST /auth/logout
   *  - localStorage.removeItem("token")
   *  - router.push("/auth/login")
   */
  emit("logout");
}
</script>

<style scoped>
.profile-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  max-width: 320px; /* reasonable cap */
}
.profile-text {
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}
.profile-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ccc;
}
.profile-menu { position: absolute; right: 12px; top: 56px; background: white; border: 1px solid #ddd; padding: 8px; border-radius: 6px; box-shadow: 0 6px 18px rgba(0,0,0,0.08); }
.profile-item { font-weight: 600; margin-bottom: 6px; }
</style>