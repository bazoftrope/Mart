<template>
    <div
        class="modal-overlay"
        @click.self="emit('close')"
        @keydown.esc="emit('close')"
    >
        <div class="card modal-content">
            <div class="modal-header">
                <h2>
                    {{
                        isEditMode ? "Редактировать марафон" : "Создать марафон"
                    }}
                </h2>
                <button
                    class="btn btn-secondary btn-close"
                    @click="emit('close')"
                >
                    ×
                </button>
            </div>

            <form @submit.prevent="handleSubmit">
                <div class="form-group">
                    <label>Название</label>
                    <input
                        v-model="form.title"
                        type="text"
                        required
                        placeholder="Например: Похудение к лету"
                    />
                </div>

                <div class="form-group">
                    <label>Описание</label>
                    <textarea
                        v-model="form.description"
                        required
                        rows="3"
                        placeholder="Опишите цели и правила марафона"
                    ></textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Длительность (дней)</label>
                        <input
                            v-model.number="form.durationDays"
                            type="number"
                            min="1"
                            max="90"
                            required
                        />
                    </div>

                    <div class="form-group">
                        <label>Дата старта</label>
                        <input v-model="form.startDate" type="date" required />
                    </div>
                </div>

                <div class="form-group" v-if="isEditMode">
                    <label>Статус</label>
                    <div class="status-selector">
                        <button
                            type="button"
                            class="status-badge"
                            :class="{ active: form.status === 'draft' }"
                            @click="form.status = 'draft'"
                        >
                            Черновик
                        </button>
                        <button
                            type="button"
                            class="status-badge"
                            :class="{ active: form.status === 'public' }"
                            @click="form.status = 'public'"
                        >
                            Опубликован
                        </button>
                    </div>
                </div>

                <div v-if="error" class="error">{{ error }}</div>

                <div class="modal-actions">
                    <button
                        type="button"
                        class="btn btn-secondary"
                        @click="emit('close')"
                    >
                        Отмена
                    </button>
                    <button
                        type="submit"
                        class="btn btn-primary"
                        :disabled="isLoading"
                    >
                        {{
                            isLoading
                                ? isEditMode
                                    ? "Сохранение..."
                                    : "Создание..."
                                : isEditMode
                                  ? "Сохранить"
                                  : "Создать"
                        }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch, computed } from "vue";
import { useMarathonsStore } from "@/stores/marathons";
import { useAuthStore } from "@/stores/auth";
import type { Marathon, MarathonStatus } from "@/types";

const props = defineProps<{
    marathon?: Marathon | null;
}>();

const emit = defineEmits<{
    close: [];
    saved: [marathonId: string];
}>();

const marathonsStore = useMarathonsStore();
const authStore = useAuthStore();

const isLoading = ref(false);
const error = ref("");

const isEditMode = computed(() => !!props.marathon);

const form = reactive({
    title: "",
    description: "",
    durationDays: 21,
    startDate: new Date().toISOString().substring(0, 10) as string,
    status: "draft" as MarathonStatus,
});

// Инициализация формы при редактировании
const initForm = () => {
    if (props.marathon) {
        form.title = props.marathon.title;
        form.description = props.marathon.description;
        form.durationDays = props.marathon.durationDays;
        form.startDate = props.marathon.startDate.substring(0, 10);
        form.status = props.marathon.status;
    } else {
        form.title = "";
        form.description = "";
        form.durationDays = 21;
        form.startDate = new Date().toISOString().substring(0, 10);
        form.status = "draft";
    }
};

watch(() => props.marathon, initForm, { immediate: true });

const handleSubmit = async () => {
    if (!authStore.user) return;

    isLoading.value = true;
    error.value = "";

    const start = new Date(form.startDate as string);
    const end = new Date(start);
    end.setDate(end.getDate() + form.durationDays);

    let success = false;
    let marathonId = "";

    if (isEditMode.value && props.marathon) {
        // Режим редактирования
        success = await marathonsStore.updateMarathon(props.marathon.id, {
            title: form.title,
            description: form.description,
            durationDays: form.durationDays,
            startDate: form.startDate as string,
            endDate: end.toISOString().split("T")[0] as string,
            status: form.status,
        });
        marathonId = props.marathon.id;
    } else {
        // Режим создания
        const result = await marathonsStore.createMarathon({
            title: form.title,
            description: form.description,
            durationDays: form.durationDays,
            startDate: form.startDate as string,
            endDate: end.toISOString().split("T")[0] as string,
            mentorId: authStore.user.id,
            participants: [],
            status: "draft",
        });
        success = !!result;
        if (result) marathonId = result;
    }

    isLoading.value = false;

    if (success) {
        emit("saved", marathonId);
    } else {
        error.value = marathonsStore.error || "Ошибка сохранения";
    }
};
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.btn-close {
    padding: 0.25rem 0.5rem;
    font-size: 1.25rem;
    line-height: 1;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
    width: auto;
    cursor: pointer;
}

.status-selector {
    display: flex;
    gap: 0.5rem;
}

.status-badge {
    padding: 0.5rem 1rem;
    border: 2px solid var(--color-border);
    border-radius: 8px;
    background: transparent;
    color: var(--color-text);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.status-badge:hover {
    border-color: var(--color-primary);
}

.status-badge.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
}

.modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
}

@media (max-width: 480px) {
    .form-row {
        grid-template-columns: 1fr;
    }
}
</style>
