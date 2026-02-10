import { createRouter, createWebHistory } from "vue-router";

// Pàgines
import LoginPage from "../pages/auth/LoginPage.vue";
import RegisterPage from "../pages/auth/RegisterPage.vue";
import MoodleHomePage from "../pages/moodle/MoodleHomePage.vue";

const routes = [
  { path: "/", redirect: "/auth/login" },

  { path: "/auth/login", component: LoginPage },
  { path: "/auth/register", component: RegisterPage },

  { path: "/moodle", component: MoodleHomePage },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
