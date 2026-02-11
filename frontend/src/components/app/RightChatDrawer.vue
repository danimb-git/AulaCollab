<template>
  <aside class="drawer drawer-right">
    <h2 class="drawer-title">Xats</h2>

    <!-- A) Si NO hi ha cap xat seleccionat -> Mostrem llista de xats -->
    <div v-if="!selectedChatId">
      <div
        v-for="u in chats"
        :key="u.id"
        class="chat-row"
        @click="emitSelectChat(u.id)"
      >
        <div class="chat-avatar"></div>
        <div class="chat-name-box">
          {{ u.name }}
        </div>
      </div>
    </div>

    <!-- B) Si HI ha xat seleccionat -> Mostrem conversa -->
    <div v-else class="chat-conversation">
      <button class="create-btn" @click="emitBack">← Tornar</button>

      <!-- Zona de missatges (ara és mock) -->
      <div class="chat-messages">
        <div class="msg-left"></div>
        <div class="msg-right"></div>
        <div class="msg-left small"></div>
      </div>

      <!-- Input per escriure (encara sense funcionalitat) -->
      <div class="chat-input-row">
        <input class="chat-input" placeholder="Escriu..." />
        <button class="icon-btn">
          <span class="send-arrow">→</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
/**
 * RightChatDrawer.vue
 * Menú lateral dret.
 *
 * Mode 1: llista de xats (si selectedChatId és null)
 * Mode 2: conversa (si selectedChatId té un id)
 *
 * Igual que els altres components:
 *  - No guarda estat de "quin xat", ho rep per props
 *  - Quan cliques, emet events
 */

defineProps({
  chats: { type: Array, default: () => [] },
  selectedChatId: { type: [String, Number], default: null },
});

const emit = defineEmits(["select-chat", "back"]);

function emitSelectChat(id) {
  /**
   * 💬 BACKEND (WebSocket):
   *
   * Aquí no obrim el socket.
   * El pare podria:
   *
   * - connectar-se via socket.io
   * - unir-se a la sala del chat
   * - carregar historial via GET /chats/:id/messages
   */
  emit("select-chat", id);
}

function emitBack() {
  emit("back");
}
</script>