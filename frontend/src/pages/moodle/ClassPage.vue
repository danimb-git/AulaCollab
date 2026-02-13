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
      {{ isTeacher ? `CLASSE ${classData?.nom || "..."} - VISTA DE PROFESSOR` : `CLASSE ${classData?.nom || "..."}` }}
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
        {{ classData?.descripcio || "No hi ha descripció" }}
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
          <span class="fileName">{{ f.nom || f.name || f.originalname || f.filename }}</span>
          <span class="fileDate">{{ f.created_at ? new Date(f.created_at).toLocaleString() : (f.date || '') }}</span>
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

    <!-- Botó: Tornar -->
    <section style="text-align: center; margin-top: 40px; margin-bottom: 20px">
      <button class="auth-link" type="button" @click="goBack">
        ← Tornar al llistat
      </button>
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
      <h3 class="modalTitle">Afegir alumne per email</h3>

      <FormField
        label="Correu electrònic"
        v-model="newStudentEmail"
        placeholder="alumne@exemple.com"
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

  <!-- hidden file input -->
  <input ref="fileInput" type="file" style="display:none" @change="onFileSelected" />
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getClassById, addMemberToClass, getCurrentUser, getClassDocuments, uploadClassDocument } from "../../services/api";

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
   A) ESTAT (real data + mock fins connectar backends)
   ========================================================= */

const classId = computed(() => route.params.id);
const classData = ref(null);
const loading = ref(true);
const error = ref("");

// Determinar si és el propietari de la classe
const isTeacher = computed(() => {
  if (!classData.value) return false;
  const user = getCurrentUser();
  if (!user) return false;
  // Verificar si és el propietari (professor)
  return classData.value.professor_id === user.sub;
});

// Alumnes (carregats des del backend)
const students = ref([]);

// Fitxers (reals)
const files = ref([]);
const fileInput = ref(null);

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
  localStorage.removeItem("accessToken");
  router.push("/auth/login");
}

/**
 * Extreu el rol del JWT i determina si és professor
 */
function loadUserRole() {
  const user = getCurrentUser();
  if (user && classData.value) {
    // Es professor si és owner de la classe o si és ADMIN
    isTeacher.value = user.id === classData.value.professor_id || user.rol === "ADMIN";
  }
}

/**
 * Carrega els detalls de la classe des del backend
 */
async function loadClassDetail() {
  loading.value = true;
  error.value = "";
  try {
    console.log("📡 Fetching class details for ID:", classId.value);
    classData.value = await getClassById(classId.value);
    console.log("✅ Class data loaded, checking role...");
    // Populate students list from backend response
    try {
      const raw = classData.value;
      let list = [];
      if (raw?.class_members && Array.isArray(raw.class_members)) {
        list = raw.class_members.map((m) => {
          const u = m.users || m.user || {};
          const name = u.nom || u.name || u.email || "Usuari";
          return { id: u.id || Date.now() + Math.random(), name };
        });
      } else if (raw?.members && Array.isArray(raw.members)) {
        list = raw.members.map((u) => ({ id: u.id || Date.now() + Math.random(), name: u.nom || u.name || u.email }));
      }
      students.value = list;
    } catch (e) {
      console.warn("Could not parse students from class data", e);
      students.value = [];
    }
    // El rol s'actualitza automàticament via computed
    } catch (e) {
    error.value = e.message || "Error al caregar la classe";
    console.error("❌ Error loading class:", error.value);
  } finally {
    loading.value = false;
  }
    // intentar carregar documents també
    try { await loadClassDocuments(); } catch (_) {}
}

/* =========================================================
   C) MODALS (llistat alumnes / afegir alumne / chat)
   ========================================================= */

const showStudentsModal = ref(false);
const showAddStudentModal = ref(false);
const showChatModal = ref(false);

function openStudentsList() {
  // Carregar detalls (inclou membres) abans de mostrar
  loadClassDetail();
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

  // Afegir membre a la classe via API
  console.log("📝 Adding student:", newStudentEmail.value);
  addStudentByEmail(newStudentEmail.value.trim());
  closeAddStudent();
}

/**
 * Afegir alumne per email (connectat a backend)
 */
async function addStudentByEmail(email) {
  try {
    console.log("📤 Calling API to add member:", email);
    const result = await addMemberToClass(classId.value, [email]);
    console.log("✅ Member added successfully:", result);
    // Recarregar detalls per mostrar els nous membres
    await loadClassDetail();
  } catch (e) {
    console.error("❌ Error adding member:", e);
    alert("Error al afegir l'alumne: " + (e.message || "Error desconegut"));
  }
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
  if (!file || !file.id) return;
  window.open(`${window.location.protocol}//${window.location.hostname}:3000/api/classes/${classId.value}/documents/${file.id}/download`,'_blank');
}

function handleUploadFile() {
  // Trigger hidden file input
  fileInput.value && fileInput.value.click();
}

async function onFileSelected(e) {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  try {
    await uploadClassDocument(classId.value, f);
    // refresh documents
    await loadClassDocuments();
    alert('Fitxer pujat correctament');
  } catch (err) {
    console.error('Upload failed', err);
    alert('Error al pujar el fitxer: ' + (err.message || 'Error'));
  } finally {
    // clear input
    e.target.value = null;
  }
}

async function loadClassDocuments() {
  try {
    const docs = await getClassDocuments(classId.value);
    files.value = Array.isArray(docs) ? docs : [];
  } catch (e) {
    console.warn('Could not load class documents', e);
    files.value = [];
  }
}

/* =========================================================
   F) VIDEOTRUACADA
   ========================================================= */

function handleVideoCall() {
  // De moment sense funcionalitat (com has dit)
  console.log("Videotrucada (pending)");
}

/* =========================================================
   G) NAVEGACIÓ
   ========================================================= */

function goBack() {
  router.push("/moodle");
}

/* =========================================================
   G) ONMOUNTED: carregar dades reals
   ========================================================= */

onMounted(() => {
  // Carrega els detalls de la classe
  loadClassDetail();
});
</script>
