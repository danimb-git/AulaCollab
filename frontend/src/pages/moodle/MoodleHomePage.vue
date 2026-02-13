<template>
  <div class="app-shell">
    <!-- 1) BARRA SUPERIOR (sempre visible) -->
    <TopBar @logout="onLogout" />

    <!-- Drawers are rendered globally in App.vue via shared shell state -->

    <!-- 5) TÍTOL CENTRAL -->
    <h1 class="moodle-title">
      {{ isStudent ? "MOODLE" : "MOODLE - PROFESSORS" }}
    </h1>

    <!-- Loading indicator -->
    <div v-if="loading" style="text-align: center; padding: 20px; color: #999;">
      Carregant dades...
    </div>

    <!-- Error indicator -->
    <div v-if="error" style="text-align: center; padding: 20px; color: red;">
      ⚠️ {{ error }}
    </div>

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
            <button v-if="!isStudent" class="create-btn" @click="goToCreateClass">
              Crear una classe (+)
            </button>
          </div>

          <div class="cards">
            <div
              v-for="c in classes"
              :key="c.id"
              class="card"
              @click="goToClass(c.id)"
            >
              <div class="card-thumb"></div>
              <p class="card-name">{{ c.nom }}</p>
              <div class="card-arrow">→</div>
            </div>
          </div>
        </section>

        <!-- 6B) SECCIÓ GRUPS (només alumne) -->
        <section v-if="isStudent">
          <div class="section-header">
            <h3 class="title">Grups d’estudi</h3>
            <button class="create-btn" @click="goToCreateGroup">Crear un grup d’estudi (+)</button>
          </div>

          <div class="cards">
            <div
              v-for="g in groups"
              :key="g.id"
              class="card"
              @click="goToGroup(g.id)"
            >
              <div class="card-thumb"></div>
              <p class="card-name">{{ g.nom }}</p>
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

import { ref, onMounted, onActivated } from "vue";
import { useRouter } from "vue-router";
import { getClasses, getGroups, getCurrentUser } from "../../services/api";

import TopBar from "../../components/app/TopBar.vue";

const router = useRouter();

/* =========================================================
   A) DADES (MOCK)
   ========================================================= */

/**
 * BACKEND:
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
// Data real del backend
const classes = ref([]);
const groups = ref([]);
const loading = ref(false);
const error = ref("");

const mockChats = ref([
  { id: 1, name: "Usuari 1" },
  { id: 2, name: "Usuari 2" },
]);

/* =========================================================
  B) ROL (extret del JWT)
  ========================================================= */

const isStudent = ref(true);

/**
 * Extreu el rol del JWT token
 */
function loadUserRole() {
  const user = getCurrentUser();
  if (user) {
    // Backend usa "role" en JWT (ALUMNE, PROFESSOR, ADMIN)
    console.log("👤 User role from JWT:", user.role);
    isStudent.value = user.role === "ALUMNE";
  }
}

/* =========================================================
   D) FUNCIONS
   ========================================================= */

function toggleRoleForTesting() {
  isStudent.value = !isStudent.value;
}

/**
 * BACKEND LOGOUT:
 * Aquí aniria:
 *
 * 1. Petició POST /auth/logout
 * 2. Esborrar token del localStorage
 * 3. Redirigir a /auth/login
 */
 function onLogout() {
  localStorage.removeItem("accessToken");
  router.push("/auth/login");
}


/**
 * NAVEGACIÓ A CLASSE
 */
function goToClass(classId) {
  router.push(`/classes/${classId}`);
}

/**
 * 📡 NAVEGACIÓ A GRUP
 */
function goToGroup(groupId) {
  console.log("🔗 Navigating to group:", groupId);
  router.push(`/groups/${groupId}`);
}

function goToCreateClass() {
  router.push("/moodle/classes/create");
}

function goToCreateGroup() {
  router.push("/moodle/groups/create");
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

/**
 * Carrega dades reals del backend
 */
async function loadData() {
  loading.value = true;
  error.value = "";
  try {
    console.log("📡 Fetching classes and groups from API...");
    const [classesData, groupsData] = await Promise.all([
      getClasses(),
      getGroups().catch((err) => {
        console.warn("⚠️ Groups fetch failed (might be normal for professors):", err.message);
        return [];
      })
    ]);
    console.log("✅ Classes loaded:", classesData);
    console.log("✅ Groups loaded:", groupsData);
    classes.value = classesData;
    groups.value = groupsData;
  } catch (e) {
    error.value = e.message || "Error al caregar dades";
    console.error("❌ Error loading data:", error.value);
  } finally {
    loading.value = false;
  }
}

// Carrega dades al muntar i quan tornem a la pàgina (refresh)
onMounted(() => {
  loadUserRole();
  loadData();
});

onActivated(() => {
  // Refrescar quando tornem a aquesta pàgina (ex: després de crear classe)
  loadData();
});
</script>
