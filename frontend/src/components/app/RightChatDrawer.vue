<template>
  <aside class="drawer drawer-right">
    <h2 class="drawer-title">Xats</h2>

    <!--
      A) Mode "llista"
      ----------------
      Si NO hi ha cap xat seleccionat -> Mostrem llista d'usuaris.

      IMPORTANT: aquest component NO decideix quins usuaris hi ha.
      El pare (MoodleHomePage) li passa el prop `chats`.
    -->
    <div v-if="!selectedChatId">
      <div
        v-for="u in chats"
        :key="u.id"
        class="chat-row"
        @click="emitSelectChat(u.id)"
      >
        <div class="chat-avatar"></div>
        <div class="chat-name-box">
          {{ displayUserName(u) }}
        </div>
      </div>
    </div>

    <!--
      B) Mode "conversa"
      -------------------
      Si HI ha xat seleccionat -> Mostrem historial + input.

      Nota: aquest component tampoc carrega missatges.
      El pare:
        - fa GET /api/messages?contextType=dm&receiverId=...
        - es connecta per Socket.IO
        - i ens passa `messages` per pintar.
    -->
    <div v-else class="chat-conversation">
      <button class="create-btn" @click="emitBack">← Tornar</button>

      <!-- Petit títol de la conversa -->
      <div v-if="selectedUser" style="padding: 8px 0; font-weight: 600;">
        {{ displayUserName(selectedUser) }}
      </div>

      <!-- Zona de missatges (historial real via props) -->
      <div class="chat-messages">
        <div v-if="errorMessage" style="padding: 10px; color: red;">
          ⚠️ {{ errorMessage }}
        </div>

        <div v-else-if="loadingMessages" style="padding: 10px; color: #999;">
          Carregant missatges...
        </div>

        <div v-else-if="!messages || messages.length === 0" style="padding: 10px; color: #999;">
          No hi ha missatges encara. Escriu el primer.
        </div>

        <!--
          Cada missatge el pintem alineat amb classes CSS:
          - .msg-row.me => a la dreta (missatge meu)
          - .msg-row => a l'esquerra (missatge de l'altre)
        -->
        <div
          v-for="m in messages"
          :key="m.id"
          class="msg-row"
          :class="{ me: isMine(m) }"
        >
          <div class="msg-bubble">
            <div class="msg-text">{{ m.text }}</div>
            <div class="msg-meta">{{ formatDate(m.createdAt) }}</div>
          </div>
        </div>
      </div>

      <!--
        Input d'escriptura.
        - Aquest component només emet l'event "send-message" amb el text.
        - El pare és qui fa socket.emit('send_message', ...)
      -->
      <div class="chat-input-row">
        <input
          v-model="draft"
          class="chat-input"
          placeholder="Escriu..."
          @keydown.enter.prevent="onSend"
        />
        <button class="icon-btn" @click="onSend">
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

const props = defineProps({
  // Llista d'usuaris ("xats") a mostrar
  chats: { type: Array, default: () => [] },

  // Quin usuari està seleccionat (id). Si és null -> mode llista.
  selectedChatId: { type: [String, Number], default: null },

  // Usuari seleccionat (objecte sencer) per mostrar nom a la conversa
  selectedUser: { type: Object, default: null },

  // ID de l'usuari loguejat (per alinear missatges)
  currentUserId: { type: [String, Number], default: null },

  // Historial de missatges DM (ja carregats pel pare)
  messages: { type: Array, default: () => [] },

  // Estat de càrrega de l'historial
  loadingMessages: { type: Boolean, default: false },

  // Missatge d'error (si el pare no ha pogut carregar o enviar)
  errorMessage: { type: String, default: "" },
});

const emit = defineEmits(["select-chat", "back", "send-message"]);

import { ref } from "vue";

// Text escrit al input
const draft = ref("");

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

function onSend() {
  const text = (draft.value || "").trim();
  if (!text) return;

  // Emitim el text al pare.
  // El pare decidirà: enviar via Socket.IO i gestionar errors.
  emit("send-message", text);

  // Buida el camp local
  draft.value = "";
}

function displayUserName(u) {
  if (!u) return "";
  const fullName = [u.nom, u.cognom].filter(Boolean).join(" ").trim();
  return fullName || u.name || u.email || "(sense nom)";
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return String(iso);
  }
}

function isMine(m) {
  return String(m?.senderId) === String(props.currentUserId);
}
</script>