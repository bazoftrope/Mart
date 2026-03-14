import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"),
      meta: { public: true },
    },
    {
      path: "/register",
      name: "register",
      component: () => import("../views/RegisterView.vue"),
      meta: { public: true },
    },
    {
      path: "/dashboard",
      name: "dashboard",
      component: () => import("../views/DashboardView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/marathon/:id",
      name: "marathon",
      component: () => import("../views/MarathonView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/all-marathons", // Добавьте этот маршрут
      name: "AllMarathons",
      component: () => import("../views/AllMarathonsView.vue"),
      meta: { requiresAuth: true }, // Убедитесь, что она требует авторизации
    },
    {
      path: "/",
      redirect: "/dashboard",
    },
  ],
});

// Guard для проверки авторизации
router.beforeEach((to, from) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return "/login";
  }
  if (to.meta.public && authStore.isAuthenticated) {
    return "/dashboard";
  }
});

export default router;
