import { createRouter, createWebHistory } from "vue-router";

// Pàgines
import LoginPage from "../pages/auth/LoginPage.vue";
import RegisterPage from "../pages/auth/RegisterPage.vue";
import MoodleHomePage from "../pages/moodle/MoodleHomePage.vue";
import CreateGroupPage from "../pages/moodle/CreateGroupPage.vue";
import CreateClassPage from "../pages/moodle/CreateClassPage.vue";

const routes = [
  { path: "/", redirect: "/auth/login" },

  { path: "/auth/login",
    nome: "login",
    component: LoginPage,
    meta: { guestOnly:true }, 
  },
  { path: "/auth/register",
    name: "register",
    component: RegisterPage,
    meta: { guestOnly:true },
  },

  {
    path: "/moodle",
    name: "moodle-home",
    component: MoodleHomePage,
    meta: { requiresAuth: true },
  },

  {
    path: "/moodle/groups/create",
    name: "create-group",
    component: CreateGroupPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/moodle/classes/create",
    name: "create-class",
    component: CreateClassPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/classes/:classId",
    name: "class",
    component: () => import("../pages/moodle/ClassPage.vue"),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const token = localStorage.getItem("accessToken");
  const isAuthenticated = Boolean(token);

  if (to.meta.requiresAuth && !isAuthenticated) {
    return "/auth/login";
  }

  if (to.meta.guestOnly && isAuthenticated) {
    return "/moodle";
  }

  return true;
});

export default router;


