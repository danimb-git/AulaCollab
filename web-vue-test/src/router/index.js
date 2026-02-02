import { createRouter, createWebHistory } from "vue-router";
import ClassesList from "../pages/ClassesList.vue";
import ClassDetail from "../pages/ClassDetail.vue";

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/classes" },
    { path: "/classes", component: ClassesList },
    { path: "/classes/:id", component: ClassDetail, props: true },
  ],
});
