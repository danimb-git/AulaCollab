import { createRouter, createWebHistory } from "vue-router";

// Pàgines
import LoginPage from "../pages/auth/LoginPage.vue";
import RegisterPage from "../pages/auth/RegisterPage.vue";
import MoodleHomePage from "../pages/moodle/MoodleHomePage.vue";
import CreateGroupPage from "../pages/moodle/CreateGroupPage.vue";
import CreateClassPage from "../pages/moodle/CreateClassPage.vue";

const routes = [
  { path: "/", redirect: "/auth/login" },

  { path: "/auth/login", component: LoginPage },
  { path: "/auth/register", component: RegisterPage },

  { path: "/moodle", component: MoodleHomePage },

  {
    path: "/moodle/groups/create",
    name: "create-group",
    component: CreateGroupPage,
  },
  {
    path: "/moodle/classes/create",
    name: "create-class",
    component: CreateClassPage,
  },
  {
    path: "/classes/:classId",
    name: "class",
    component: () => import("../pages/moodle/ClassPage.vue"),
  },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
