<template>
    <div class="container" style="padding-top: 2rem; padding-bottom: 2rem">
        <div v-if="marathonsStore.isLoading" class="loading">Загрузка...</div>

        <div v-else-if="!marathonsStore.currentMarathon" class="error">
            Марафон не найден
        </div>

        <div v-else-if="!canViewMarathon" class="error">
            У вас нет доступа к этому марафону
            <button class="btn btn-primary" style="margin-top: 1rem" @click="router.push('/all-marathons')">
                ← Назад к марафонам
            </button>
        </div>

        <div v-else>
            <!-- Шапка марафона -->
            <div class="card mb-1" :class="{ 'mentor-mode': isMentorOfMarathon }">
                <div v-if="isMentorOfMarathon" class="mentor-badge">
                    👨‍🏫 Режим ментора
                </div>
                <button
                    class="btn btn-secondary"
                    style="margin-bottom: 1rem"
                    @click="router.back()"
                >
                    ← Назад
                </button>
                <h1>{{ marathonsStore.currentMarathon.title }}</h1>
                <p style="color: var(--text-muted); margin: 0.5rem 0">
                    {{ marathonsStore.currentMarathon.description }}
                </p>

                <div
                    style="
                        display: flex;
                        gap: 1rem;
                        font-size: 0.875rem;
                        color: var(--text-muted);
                        flex-wrap: wrap;
                    "
                >
                    <span
                        >📅
                        {{ marathonsStore.currentMarathon.durationDays }}
                        дней</span
                    >
                    <span
                        >👥
                        {{ marathonsStore.currentMarathon.participants.length }}
                        участников</span
                    >
                    <span
                        :style="{
                            color: getStatusInfo(marathonsStore.currentMarathon.status || 'draft').color,
                            marginLeft: 'auto',
                            fontWeight: 500,
                        }"
                    >
                        {{
                            getStatusInfo(marathonsStore.currentMarathon.status || 'draft').label
                        }}
                    </span>
                </div>
            </div>

            <!-- Для ментора: управление -->
            <div
                v-if="isMentorOfMarathon"
                class="card mb-1"
                style="background: #e3f2fd"
            >
                <h3 style="margin-bottom: 0.5rem">Панель ментора</h3>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap">
                    <!-- Опубликовать (только для draft) -->
                    <button
                        v-if="marathonsStore.currentMarathon.status === 'draft'"
                        class="btn btn-success"
                        @click="handlePublish"
                    >
                        📢 Опубликовать
                    </button>
                    <button class="btn btn-primary" @click="openEditModal">
                        ✏️ Редактировать
                    </button>
                    <button class="btn btn-primary" @click="showAddTask = true">
                        + Добавить задание
                    </button>
                </div>
            </div>

            <!-- Для участника: присоединиться -->
            <div
                v-else-if="canJoinMarathon && !isParticipant && !isMentorOfMarathon"
                class="card mb-1"
                style="background: #e8f5e9; text-align: center"
            >
                <h3 style="margin-bottom: 0.5rem">Хотите участвовать?</h3>
                <p style="color: var(--text-muted); margin-bottom: 1rem">
                    Марафон открыт для записи
                </p>
                <button class="btn btn-success" @click="handleJoin" :disabled="isJoining">
                    {{ isJoining ? "Запись..." : "🙋 Присоединиться" }}
                </button>
            </div>

            <!-- Уже участник -->
            <div
                v-else-if="isParticipant"
                class="card mb-1"
                style="background: #e8f5e9; text-align: center"
            >
                <span style="font-size: 1.125rem; font-weight: 500; color: #388e3c">
                    ✅ Вы участник
                </span>
            </div>

            <!-- Список дней -->
            <div class="card mb-1">
                <h2 style="margin-bottom: 1rem">Дни марафона</h2>

                <div
                    v-if="marathonsStore.tasks.length === 0"
                    class="text-center"
                    style="color: var(--text-muted); padding: 2rem"
                >
                    Заданий пока нет
                </div>

                <div
                    v-for="task in marathonsStore.tasks"
                    :key="task.id"
                    class="card"
                    style="margin-bottom: 1rem; border: 1px solid var(--border)"
                >
                    <div
                        style="
                            display: flex;
                            justify-content: space-between;
                            margin-bottom: 0.5rem;
                        "
                    >
                        <span style="font-weight: 600; color: var(--primary)"
                            >День {{ task.dayNumber }}</span
                        >
                        <span
                            style="
                                font-size: 0.875rem;
                                color: var(--text-muted);
                            "
                        >
                            {{ taskTypeLabel(task.type) }}
                        </span>
                    </div>

                    <h4 style="margin-bottom: 0.5rem">{{ task.title }}</h4>
                    <p
                        style="
                            color: var(--text-muted);
                            font-size: 0.875rem;
                            margin-bottom: 1rem;
                        "
                    >
                        {{ task.description }}
                    </p>

                    <button
                        v-if="authStore.isParticipant"
                        class="btn btn-primary"
                        @click="openReport(task)"
                    >
                        Сдать отчёт
                    </button>
                </div>
            </div>

            <!-- Чат -->
            <div class="card">
                <h2 style="margin-bottom: 1rem">Чат марафона</h2>
                <div
                    style="
                        min-height: 200px;
                        background: var(--bg);
                        border-radius: var(--radius);
                        padding: 1rem;
                    "
                >
                    <p class="text-center" style="color: var(--text-muted)">
                        Сообщений пока нет
                    </p>
                </div>
            </div>
        </div>
    </div>
    <!-- Модалка редактирования марафона -->
    <CreateEditMarathonModal
        v-show="showEditModal"
        :marathon="marathonsStore.currentMarathon"
        @close="closeEditModal"
        @saved="onMarathonSaved"
    />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useMarathonsStore } from "@/stores/marathons";
import type { DailyTask, Marathon, MarathonStatus } from "@/types";
import CreateEditMarathonModal from "@/components/CreateEditMarathonModal.vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const marathonsStore = useMarathonsStore();

const showAddTask = ref(false);
const showEditModal = ref(false);

const isMentorOfMarathon = computed(() => {
    return (
        authStore.isMentor &&
        marathonsStore.currentMarathon?.mentorId === authStore.user?.id
    );
});

const isParticipant = computed(() => {
    const userId = authStore.user?.id;
    return marathonsStore.currentMarathon?.participants.includes(userId || "");
});

const isJoining = ref(false);

// Можно присоединиться только к public/active марафону
const canJoinMarathon = computed(() => {
    const marathon = marathonsStore.currentMarathon;
    if (!marathon) return false;
    return marathon.status === "public" || marathon.status === "active";
});

const canViewMarathon = computed(() => {
    const marathon = marathonsStore.currentMarathon;
    if (!marathon) return true;

    const userId = authStore.user?.id;
    const isOwner = marathon.mentorId === userId;

    // Draft — только создатель
    if (marathon.status === "draft") return isOwner;

    // Public — все авторизованные
    if (marathon.status === "public") return true;

    // Active/Completed — только участники и ментор
    if (marathon.status === "active" || marathon.status === "completed") {
        return isOwner || isParticipant.value;
    }

    return true;
});

const taskTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
        meal: "🍽️ Питание",
        exercise: "🏃 Тренировка",
        both: "🍽️🏃 Питание + Тренировка",
    };
    return labels[type] || type;
};

const getStatusInfo = (status: MarathonStatus) => {
    const statusMap: Record<MarathonStatus, { label: string; color: string }> = {
        draft: { label: "Черновик", color: "var(--text-muted)" },
        public: { label: "Опубликован", color: "var(--primary)" },
        active: { label: "Активен", color: "var(--primary)" },
        completed: { label: "Завершён", color: "var(--text-muted)" },
    };
    return statusMap[status];
};

const openReport = (task: DailyTask) => {
    console.log("Отчёт по заданию:", task.id);
};

const openEditModal = () => {
    showEditModal.value = true;
};

const closeEditModal = () => {
    showEditModal.value = false;
};

const onMarathonSaved = () => {
    showEditModal.value = false;
};

const handlePublish = async () => {
    if (!marathonsStore.currentMarathon) return;
    const confirmed = confirm("Опубликовать марафон? Все пользователи смогут его увидеть.");
    if (!confirmed) return;
    await marathonsStore.publishMarathon(marathonsStore.currentMarathon.id);
};

const handleJoin = async () => {
    if (!marathonsStore.currentMarathon) return;
    isJoining.value = true;
    const success = await marathonsStore.joinMarathon(marathonsStore.currentMarathon.id);
    isJoining.value = false;
    if (success) {
        await marathonsStore.fetchMarathonById(marathonsStore.currentMarathon.id);
    }
};

onMounted(() => {
    const id = route.params.id as string;
    marathonsStore.fetchMarathonById(id);
});

// Редирект если нет доступа после загрузки
watch(canViewMarathon, (can) => {
    if (!can && marathonsStore.currentMarathon) {
        router.push("/all-marathons");
    }
});
</script>

<style scoped>
.mentor-mode {
    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
    border: 2px solid #2196f3;
    position: relative;
}

.mentor-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: #2196f3;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
}
</style>
