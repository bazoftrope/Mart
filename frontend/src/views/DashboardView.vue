<template>
    <div class="container" style="padding-top: 2rem; padding-bottom: 2rem">
        <!-- Приветствие -->
        <div class="mb-1">
            <h1>Привет, {{ authStore.user?.name }}! 👋</h1>
            <span class="badge" :class="authStore.user?.role">
                {{ roleText }}
            </span>
        </div>

        <!-- Для ментора: кнопка создания -->
        <div v-if="authStore.isMentor" class="mb-1">
            <button class="btn btn-primary" @click="openCreateModal">
                + Создать марафон
            </button>
        </div>

        <!-- Загрузка -->
        <div v-if="marathonsStore.isLoading" class="loading">Загрузка...</div>

        <!-- Ошибка -->
        <div v-else-if="marathonsStore.error" class="error">
            {{ marathonsStore.error }}
        </div>

        <!-- Список марафонов -->
        <div v-else class="card mb-1">
            <h2 style="margin-bottom: 1rem">
                {{ authStore.isMentor ? "Мои марафоны" : "Мои марафоны" }}
            </h2>

            <div
                v-if="marathonsStore.myMarathons.length === 0"
                class="text-center"
                style="color: var(--text-muted); padding: 2rem"
            >
                <p v-if="authStore.isMentor">
                    У вас пока нет марафонов. Создайте первый!
                </p>
                <p v-else>Вы пока не участвуете ни в одном марафоне.</p>
            </div>

            <!-- Подключение компонента списка -->
            <MarathonList
                v-else
                :marathons="marathonsStore.myMarathons"
                :current-user="authStore.user?.id || null"
                @marathon-click="goToMarathon"
                @join-click="handleJoin"
            />
        </div>

        <!-- Статистика -->
        <!-- Статистика (теперь отдельный компонент) -->
        <DashboardStats :marathons="marathonsStore.myMarathons" />

        <!-- Модалка создания/редактирования марафона -->
        <CreateEditMarathonModal
            v-if="showModal"
            :marathon="editingMarathon"
            @close="closeModal"
            @saved="onMarathonSaved"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useMarathonsStore } from "@/stores/marathons";
import CreateEditMarathonModal from "@/components/CreateEditMarathonModal.vue";
import MarathonList from "@/components/MarathonList.vue";
import DashboardStats from "@/components/DashboardStats.vue";
import type { Marathon } from "@/types";

const router = useRouter();
const authStore = useAuthStore();
const marathonsStore = useMarathonsStore();

const showModal = ref(false);
const editingMarathon = ref<Marathon | null>(null);

const roleText = computed(() => {
    return authStore.isMentor ? "Ментор" : "Участник";
});

const openCreateModal = () => {
    editingMarathon.value = null;
    showModal.value = true;
};

const openEditModal = (marathon: Marathon) => {
    editingMarathon.value = marathon;
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
    editingMarathon.value = null;
};

const goToMarathon = (id: string) => {
    router.push(`/marathon/${id}`);
};

const handleJoin = async (id: string) => {
    await marathonsStore.joinMarathon(id);
};

const onMarathonSaved = (marathonId: string) => {
    router.push(`/marathon/${marathonId}`);
};

onMounted(() => {
    marathonsStore.fetchMarathons();
});
</script>

<style scoped>
.badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    margin-top: 0.5rem;
}

.badge.mentor {
    background: #e3f2fd;
    color: #1976d2;
}

.badge.participant {
    background: #e8f5e9;
    color: #388e3c;
}
</style>
