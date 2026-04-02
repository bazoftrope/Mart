<template>
    <div class="app">
        <header v-if="authStore.isAuthenticated" class="header">
            <div class="container header-content">
                <router-link to="/dashboard" class="logo">
                    🥗 Марафон ЗОЖ
                </router-link>

                <nav class="nav">
                    <router-link to="/dashboard">Главная</router-link>

                    <router-link to="/all-marathons"
                        >Список всех марафонов</router-link
                    >
                    <!-- Добавьте эту строку -->
                </nav>

                <div class="user-menu">
                    <span>{{ authStore.user?.name }}</span>
                    <span class="badge">{{ roleLabel }}</span>
                    <button @click="handleLogout" class="btn btn-secondary">
                        Выйти
                    </button>
                </div>
            </div>
        </header>

        <main :class="{ 'with-header': authStore.isAuthenticated }">
            <router-view />
        </main>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const roleLabel = computed(() => {
    return authStore.isMentor ? "Ментор" : "Участник";
});

const handleLogout = () => {
    authStore.logout();
    router.push("/login");
};
</script>

<style scoped>
.header {
    background: white;
    border-bottom: 1px solid var(--border);
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
}

.header-content {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.logo {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--primary);
    text-decoration: none;
}

.nav {
    display: flex;
    gap: 1.5rem;
}

.nav a {
    color: var(--text-muted);
    text-decoration: none;
}

.nav a.router-link-active {
    color: var(--primary);
}

.user-menu {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    background: #e8f5e9;
    color: #2e7d32;
    border-radius: 4px;
}

.with-header {
    padding-top: 60px;
}
</style>
