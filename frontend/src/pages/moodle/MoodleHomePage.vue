<template>
  <div class="app-shell">
    <!-- 1) BARRA SUPERIOR (sempre visible) -->
    <TopBar
      :isProfileOpen="isProfileMenuOpen"
      @toggle-left="onClickHamburger"
      @toggle-chat="onClickChatIcon"
      @toggle-profile="onClickProfile"
      @logout="onLogout"
    />

    <!-- 2) OVERLAY: quan hi ha algun menú lateral obert, fem fons semi-transparent.
         Si cliques fora, es tanca tot. -->
    <div
      v-if="leftMenuOpen || chatMenuOpen"
      class="overlay"
      @click="closeSidePanels"
    ></div>

    <!-- 3) MENÚ LATERAL ESQUERRE (classes i grups) -->
    <LeftDrawer
      v-if="leftMenuOpen"
      :classes="mockClasses"
      :groups="mockGroups"
      :showGroups="isStudent"
      @go-class="goToClass"
      @go-group="goToGroup"
    />

    <!-- 4) MENÚ LATERAL DRET (xats) -->
    <RightChatDrawer
      v-if="chatMenuOpen"
      :chats="mockChats"
      :selectedChatId="selectedChatId"
      @select-chat="openChat"
      @back="closeChatConversation"
    />

    <!-- 5) TÍTOL CENTRAL -->
    <h1 class="moodle-title">
      {{ isStudent ? "MOODLE" : "MOODLE - PROFESSORS" }}
    </h1>

    <!-- 6) CONTINGUT CENTRAL (cards) -->
    <main class="main">
      <!-- Si és professor: només 1 columna. Si és alumne: 2 columnes -->
      <div
        class="columns"
        :style="{ gridTemplateColumns: isStudent ? '1fr 1fr' : '1fr' }"
      >
        <!-- 6A) SECCIÓ CLASSES (sempre) -->
        <section>
          <div class="section-header">
            <h3 class="title">Classes</h3>

            <!-- Només professor pot crear classe -->
            <button v-if="!isStudent" class="create-btn">
              Crear una classe (+)
            </button>
          </div>

          <div class="cards">
            <div
              v-for="c in mockClasses"
              :key="c.id"
              class="card"
              @click="goToClass(c.id)"
            >
              <div class="card-thumb"></div>
              <p class="card-name">{{ c.name }}</p>
              <div class="card-arrow">→</div>
            </div>
          </div>
        </section>

        <!-- 6B) SECCIÓ GRUPS (només alumne) -->
        <section v-if="isStudent">
          <div class="section-header">
            <h3 class="title">Grups d’estudi</h3>
            <button class="create-btn">Crear un grup d’estudi (+)</button>
          </div>

          <div class="cards">
            <div
              v-for="g in mockGroups"
              :key="g.id"
              class="card"
              @click="goToGroup(g.id)"
            >
              <div class="card-thumb"></div>
              <p class="card-name">{{ g.name }}</p>
              <div class="card-arrow">→</div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- 7) BOTÓ TEMPORAL PER PROVAR (després s'elimina)
         Serveix per veure la diferència ALUMNE/PROFESSOR sense backend. -->
    <div style="position: fixed; left: 20px; bottom: 20px">
      <button class="create-btn" @click="toggleRoleForTesting">
        Mode: {{ isStudent ? "ALUMNE" : "PROFESSOR" }}
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * MoodleHomePage.vue
 *
 * Aquesta és la pàgina principal després de fer login.
 *
 * Actualment:
 *  - Les dades són MOCK (arrays locals).
 *  - No hi ha connexió real amb backend.
 *
 * Més endavant:
 *  - Les classes vindran de GET /classes
 *  - Els grups vindran de GET /groups
 *  - Els xats vindran de GET /chats o via WebSocket
 */

import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

import TopBar from "../../components/app/TopBar.vue";
import LeftDrawer from "../../components/app/LeftDrawer.vue";
import RightChatDrawer from "../../components/app/RightChatDrawer.vue";

const router = useRouter();

/* =========================================================
   A) DADES (MOCK)
   ========================================================= */

/**
 * 🔌 BACKEND:
 * Aquí NO haurien de ser arrays fixos.
 *
 * Aquí faríem:
 *
 *   onMounted(async () => {
 *     const response = await api.get("/classes")
 *     classes.value = response.data
 *   })
 *
 * I el mateix per grups.
 */

const mockClasses = ref([
  { id: 1, name: "Classe 1" },
  { id: 2, name: "Classe 2" },
  { id: 3, name: "Classe 3" },
]);

const mockGroups = ref([
  { id: 1, name: "Grup d’estudi 1" },
  { id: 2, name: "Grup d’estudi 2" },
]);

const mockChats = ref([
  { id: 1, name: "Usuari 1" },
  { id: 2, name: "Usuari 2" },
]);

/* =========================================================
   B) ESTAT UI
   ========================================================= */

const leftMenuOpen = ref(false);
const chatMenuOpen = ref(false);
const isProfileMenuOpen = ref(false);
const selectedChatId = ref(null);

/* =========================================================
   C) ROL (més endavant vindrà del token JWT)
   ========================================================= */

/**
 * 🔐 BACKEND:
 * El rol real (alumne/professor) vindrà del login.
 *
 * Per exemple:
 *  const user = decodeJWT(token)
 *  isStudent.value = user.role === "STUDENT"
 */

const isStudent = ref(true);

/* =========================================================
   D) FUNCIONS
   ========================================================= */

function closeSidePanels() {
  leftMenuOpen.value = false;
  chatMenuOpen.value = false;
  isProfileMenuOpen.value = false;
  selectedChatId.value = null;
}

function onClickHamburger() {
  leftMenuOpen.value = !leftMenuOpen.value;
  chatMenuOpen.value = false;
  isProfileMenuOpen.value = false;
}

function onClickChatIcon() {
  chatMenuOpen.value = !chatMenuOpen.value;
  leftMenuOpen.value = false;
  isProfileMenuOpen.value = false;
}

function onClickProfile() {
  isProfileMenuOpen.value = !isProfileMenuOpen.value;
}

/**
 * 🔐 BACKEND LOGOUT:
 * Aquí aniria:
 *
 * 1. Petició POST /auth/logout
 * 2. Esborrar token del localStorage
 * 3. Redirigir a /auth/login
 */
function onLogout() {
  router.push("/auth/login");
}

/**
 * 📡 NAVEGACIÓ A CLASSE
 *
 * Més endavant:
 *   router.push(`/classes/${classId}`)
 *
 * I la pàgina ClassDetail faria:
 *   GET /classes/:id
 */
function goToClass(classId) {
  console.log("Anar a classe:", classId);
}

/**
 * 📡 NAVEGACIÓ A GRUP
 *
 * router.push(`/groups/${groupId}`)
 */
function goToGroup(groupId) {
  console.log("Anar a grup:", groupId);
}

/**
 * 💬 XATS
 *
 * Més endavant:
 * - Obrir WebSocket
 * - Subscriure's a sala
 * - Rebre missatges en temps real
 */
function openChat(chatId) {
  selectedChatId.value = chatId;

  // 🔌 Aquí podríem fer:
  // await api.get(`/chats/${chatId}/messages`)
}

function closeChatConversation() {
  selectedChatId.value = null;
}
</script>
