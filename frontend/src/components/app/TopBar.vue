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
        <span class="profile-text">Perfil</span>
        <span class="profile-avatar"></span>
      </button>
    </div>

    <!-- Dropdown del perfil (només es veu si isProfileOpen = true) -->
    <div v-if="isProfileOpen" class="profile-menu">
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
});

const emit = defineEmits([
  "toggle-left",
  "toggle-chat",
  "toggle-profile",
  "logout",
]);

function emitToggleLeft() {
  emit("toggle-left");
}

function emitToggleChat() {
  emit("toggle-chat");
}

function emitToggleProfile() {
  emit("toggle-profile");
}

function emitLogout() {
  emit("logout");
}
</script>