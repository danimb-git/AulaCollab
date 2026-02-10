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
    <div style="position: fixed; left: 20px; bottom: 20px;">
      <button class="create-btn" @click="toggleRoleForTesting">
        Mode: {{ isStudent ? "ALUMNE" : "PROFESSOR" }}
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * MoodleHomePage.vue
 * Aquesta pàgina és la HOME després de fer login.
 * - Mostra el TopBar
 * - Obre / tanca menús laterals
 * - Mostra cards de Classes i (si és alumne) Grups
 */

import { ref } from "vue";
import { useRouter } from "vue-router";

import TopBar from "../../components/app/TopBar.vue";
import LeftDrawer from "../../components/app/LeftDrawer.vue";
import RightChatDrawer from "../../components/app/RightChatDrawer.vue";

const router = useRouter();

/* =========================================================
   A) "DADES MOCK" (falses)
   Més endavant aquestes dades vindran del backend.
   ========================================================= */
const mockClasses = ref([
  { id: 1, name: "Classe 1" },
  { id: 2, name: "Classe 2" },
  { id: 3, name: "Classe 3" },
  { id: 4, name: "Classe 4" },
  { id: 5, name: "Classe 5" },
  { id: 6, name: "Classe 6" },
]);

const mockGroups = ref([
  { id: 1, name: "Grup d’estudi 1" },
  { id: 2, name: "Grup d’estudi 2" },
  { id: 3, name: "Grup d’estudi 3" },
  { id: 4, name: "Grup d’estudi 4" },
  { id: 5, name: "Grup d’estudi 5" },
  { id: 6, name: "Grup d’estudi 6" },
]);

const mockChats = ref([
  { id: 1, name: "Usuari 1" },
  { id: 2, name: "Usuari 2" },
  { id: 3, name: "Usuari 3" },
  { id: 4, name: "Usuari 4" },
]);

/* =========================================================
   B) ESTAT DE LA UI (què està obert / tancat)
   ========================================================= */
const leftMenuOpen = ref(false);        // menú esquerre
const chatMenuOpen = ref(false);        // menú dret (xats)
const isProfileMenuOpen = ref(false);   // dropdown perfil
const selectedChatId = ref(null);       // quin xat estem veient (conversa)

/* =========================================================
   C) ROL (temporal)
   Després, vindrà del login/token.
   ========================================================= */
const isStudent = ref(true);

/* =========================================================
   D) FUNCIONS (què passa quan l'usuari clica)
   ========================================================= */

/* Tanca menús laterals i perfil */
function closeSidePanels() {
  leftMenuOpen.value = false;
  chatMenuOpen.value = false;
  isProfileMenuOpen.value = false;
  selectedChatId.value = null;
}

/* Botó hamburger (esquerra) */
function onClickHamburger() {
  leftMenuOpen.value = !leftMenuOpen.value;

  // Si obres l'esquerra, tanquem la resta
  chatMenuOpen.value = false;
  isProfileMenuOpen.value = false;
}

/* Botó xat (dreta) */
function onClickChatIcon() {
  chatMenuOpen.value = !chatMenuOpen.value;

  // Si obres el xat, tanquem la resta
  leftMenuOpen.value = false;
  isProfileMenuOpen.value = false;
}

/* Botó perfil */
function onClickProfile() {
  isProfileMenuOpen.value = !isProfileMenuOpen.value;
}

/* Logout */
function onLogout() {
  // Més endavant: cridar backend + esborrar token/localStorage
  router.push("/auth/login");
}

/* Obrir conversa d’un xat */
function openChat(chatId) {
  selectedChatId.value = chatId;
}

/* Tornar del xat (tanca conversa però deixa el panel obert) */
function closeChatConversation() {
  selectedChatId.value = null;
}

/* Clicar una classe */
function goToClass(classId) {
  console.log("Anar a classe:", classId);
  // Més endavant:
  // router.push(`/classes/${classId}`)
}

/* Clicar un grup */
function goToGroup(groupId) {
  console.log("Anar a grup:", groupId);
  // Més endavant:
  // router.push(`/groups/${groupId}`)
}

/* Botó temporal per provar rols */
function toggleRoleForTesting() {
  isStudent.value = !isStudent.value;
  closeSidePanels();
}
</script>
