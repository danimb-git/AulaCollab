<template>
  <!-- TOP BAR (mateixa que MoodleHomePage) -->
  <TopBar
    :onToggleLeft="toggleLeft"
    :onToggleRight="toggleRight"
    :onToggleProfile="toggleProfile"
    :showProfileDropdown="showProfileDropdown"
    @logout="handleLogout"
  />

  <main class="page">
    <!-- TÍTOL -->
    <h1 class="pageTitle">
      <!-- Wireframe: si ets prof posa "CLASSE X - VISTA DE PROFESSOR" -->
      {{ isTeacher ? `CLASSE ${classNumber} - VISTA DE PROFESSOR` : `CLASSE ${classNumber}` }}
    </h1>

    <!-- BANNER BOTONS (1 o 2 segons rol) -->
    <section class="wideBanner">
      <div class="wideBannerInner">
        <PrimaryButton class="btnGhost" type="button" @click="openStudentsList">
          Veure llistat d'alumnes
        </PrimaryButton>

        <PrimaryButton
          v-if="isTeacher"
          class="btnGhost"
          type="button"
          @click="openAddStudent"
        >
          Afegir un nou alumne (+)
        </PrimaryButton>
      </div>
    </section>

    <!-- DESCRIPCIÓ -->
    <section class="classDescription">
      <h2 class="subtitle">Descripció</h2>
      <p class="descText">
        {{ classDescription }}
      </p>
    </section>

    <!-- BOTONS CHAT + VIDEO -->
    <section class="twoButtonsRow">
      <button class="bigActionBtn" type="button" @click="openClassChat">
        <span class="circleIcon"></span>
        <span>Chat de classe</span>
      </button>

      <button class="bigActionBtn" type="button" @click="handleVideoCall">
        <span>Videotrucada de classe</span>
        <span class="circleIcon"></span>
      </button>
    </section>

    <!-- LLISTAT FITXERS -->
    <section class="filesSection">
      <div class="filesList">
        <div
          v-for="f in files"
          :key="f.id"
          class="fileRow"
          @click="downloadFile(f)"
        >
          <span class="fileName">{{ f.name }}</span>
          <span class="fileDate">{{ f.date }}</span>
        </div>
      </div>

      <!-- Només professor: botó per penjar fitxer -->
      <div class="filesFooter">
        <PrimaryButton
          v-if="isTeacher"
          class="btnSmall"
          type="button"
          @click="handleUploadFile"
        >
          Penjar un nou fitxer (+)
        </PrimaryButton>
      </div>
    </section>

    <!-- ✅ PETIT “DEV TOGGLE” per provar rols fàcilment (treu-ho quan connectis backend) -->
    <section class="devBox">
      <label class="devLabel">
        <input type="checkbox" v-model="isTeacher" />
        Dev: sóc professor (toggle)
      </label>
    </section>
  </main>

  <!-- MODAL: LLISTAT ALUMNES -->
  <AppModal v-if="showStudentsModal" @close="showStudentsModal = false">
    <div class="studentsModal">
      <h3 class="modalTitle">Alumnes</h3>

      <div class="studentsList">
        <div v-for="s in students" :key="s.id" class="studentItem">
          {{ s.name }}
        </div>
      </div>
    </div>
  </AppModal>

  <!-- MODAL: AFEGIR ALUMNE (només professor) -->
  <AppModal v-if="showAddStudentModal" @close="closeAddStudent">
    <div class="addStudentModal">
      <h3 class="modalTitle">Afegir alumne</h3>

      <FormField
        label="Correu electrònic"
        v-model="newStudentEmail"
        placeholder="exemple@exemple.exemple"
      />

      <div class="modalActions">
        <PrimaryButton class="btnSmall" type="button" @click="submitAddStudent">
          Afegir
        </PrimaryButton>
      </div>
    </div>
  </AppModal>

  <!-- MODAL: CHAT DE CLASSE -->
  <AppModal v-if="showChatModal" @close="showChatModal = false">
    <div class="chatModal">
      <div class="chatMessages">
        <div
          v-for="m in classMessages"
          :key="m.id"
          class="chatMsg"
        >
          <strong>{{ m.user }}:</strong> {{ m.text }}
        </div>
      </div>

      <div class="chatInputRow">
        <input
          class="chatInput"
          type="text"
          v-model="newMessage"
          placeholder="Escriu un missatge..."
          @keyup.enter="sendMessage"
        />
        <button class="chatSendBtn" type="button" @click="sendMessage">→</button>
      </div>
    </div>
  </AppModal>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

import TopBar from "../../components/app/TopBar.vue";
import AppModal from "../../components/ui/AppModal.vue";

/**
 * ⚠️ Reutilitza els components d'auth (inputs/botons).
 * Canvia aquests imports si el teu projecte els té amb un altre nom.
 */
import FormField from "../../components/ui/FormField.vue";
import PrimaryButton from "../../components/ui/PrimaryButton.vue";

const route = useRoute();
const router = useRouter();

/* =========================================================
   A) ESTAT (mock fins connectar backend)
   ========================================================= */

const classId = computed(() => route.params.classId);

// Per fer que al títol surti "CLASSE 1" com al wireframe
const classNumber = computed(() => {
  // si classId és "1" -> 1, si és uuid -> posa 1 per defecte
  const n = Number(classId.value);
  return Number.isFinite(n) ? n : 1;
});

// ✅ Dev role toggle (després vindrà del login/JWT)
const isTeacher = ref(false);

// Text descripció
const classDescription = ref(
  "Descripció de la classe Descripció de la classe Descripció de la classe Descripció de la classe..."
);

// Alumnes
const students = ref([
  { id: 1, name: "Alumne 1" },
  { id: 2, name: "Alumne 2" },
  { id: 3, name: "Alumne 3" },
  { id: 4, name: "Alumne 4" },
  { id: 5, name: "Alumne 5" },
  { id: 6, name: "Alumne 6" },
  { id: 7, name: "Alumne 7" },
  { id: 8, name: "Alumne 8" },
  { id: 9, name: "Alumne 9" },
  { id: 10, name: "Alumne 10" },
  { id: 11, name: "Alumne 11" },
  { id: 12, name: "Alumne 12" },
]);

// Fitxers
const files = ref([
  { id: 1, name: "Fitxer 1", date: "01/01/2026" },
  { id: 2, name: "Fitxer 2", date: "02/01/2026" },
  { id: 3, name: "Fitxer 3", date: "03/01/2026" },
  { id: 4, name: "Fitxer 4", date: "04/01/2026" },
  { id: 5, name: "Fitxer 5", date: "05/01/2026" },
  { id: 6, name: "Fitxer 6", date: "06/01/2026" },
]);

/* =========================================================
   B) TOPBAR (mateixes funcionalitats que MoodleHomePage)
   ========================================================= */

const showProfileDropdown = ref(false);

function toggleLeft() {
  // ✅ Aquí aniria obrir el menú lateral esquerra (classes/grups)
  // Exemple: leftDrawerOpen.value = !leftDrawerOpen.value
  console.log("toggle left drawer");
}

function toggleRight() {
  // ✅ Aquí aniria obrir el menú lateral dret (chats)
  console.log("toggle right drawer");
}

function toggleProfile() {
  showProfileDropdown.value = !showProfileDropdown.value;
}

function handleLogout() {
  // ✅ BACKEND:
  // - esborrar token de localStorage
  // - cridar POST /auth/logout (si ho teniu)
  // - redirigir a /auth/login
  router.push("/auth/login");
}

/* =========================================================
   C) MODALS (llistat alumnes / afegir alumne / chat)
   ========================================================= */

const showStudentsModal = ref(false);
const showAddStudentModal = ref(false);
const showChatModal = ref(false);

function openStudentsList() {
  // ✅ BACKEND:
  // GET /classes/:id/students
  showStudentsModal.value = true;
}

const newStudentEmail = ref("");

function openAddStudent() {
  showAddStudentModal.value = true;
}

function closeAddStudent() {
  showAddStudentModal.value = false;
  newStudentEmail.value = "";
}

function submitAddStudent() {
  if (!newStudentEmail.value.trim()) return;

  // ✅ BACKEND:
  // POST /classes/:id/members  { email: newStudentEmail }
  // Si tot ok -> refrescar llista d'alumnes
  console.log("Afegir alumne:", newStudentEmail.value);

  // Mock: afegim a la llista perquè es vegi
  students.value.push({
    id: Date.now(),
    name: newStudentEmail.value,
  });

  closeAddStudent();
}

/* =========================================================
   D) CHAT (mock)
   ========================================================= */

const classMessages = ref([
  { id: 1, user: "Usuari 1", text: "Hola!" },
  { id: 2, user: "Usuari 2", text: "Ei, què tal?" },
]);

const newMessage = ref("");

function openClassChat() {
  // ✅ BACKEND:
  // - (REST) GET /classes/:id/messages
  // - (Sockets) connectar-te a room "class:<id>"
  showChatModal.value = true;
}

function sendMessage() {
  const text = newMessage.value.trim();
  if (!text) return;

  // ✅ BACKEND:
  // - (REST) POST /classes/:id/messages { text }
  // - (Sockets) emit "message" a la room
  classMessages.value.push({
    id: Date.now(),
    user: "Jo",
    text,
  });

  newMessage.value = "";
}

/* =========================================================
   E) FITXERS
   ========================================================= */

function downloadFile(file) {
  // ✅ BACKEND:
  // GET /classes/:id/files/:fileId (download)
  console.log("Download:", file);
}

function handleUploadFile() {
  // ✅ BACKEND:
  // POST /classes/:id/files (FormData)
  console.log("Upload file");
}

/* =========================================================
   F) VIDEOTRUACADA
   ========================================================= */

function handleVideoCall() {
  // De moment sense funcionalitat (com has dit)
  console.log("Videotrucada (pending)");
}

/* =========================================================
   G) ONMOUNTED: carregar dades reals
   ========================================================= */

onMounted(() => {
  // ✅ BACKEND:
  // GET /classes/:id  -> nom, descripció
  // GET /classes/:id/files
  // GET /classes/:id/students
  // I el rol real vindrà del token del login (JWT)
});
</script>
