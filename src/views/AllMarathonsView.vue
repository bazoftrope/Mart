<template>
  <div class="container page-container">
    <h1 class="page-title">Список всех марафонов</h1>

    <!-- Состояние загрузки -->
    <div v-if="marathonsStore.isLoading" class="loading-state">
      Загрузка марафонов...
    </div>

    <!-- Состояние ошибки -->
    <div v-else-if="marathonsStore.error" class="error-state">
      {{ marathonsStore.error }}
      <button @click="marathonsStore.fetchMarathons()" class="retry-btn">
        Попробовать снова
      </button>
    </div>

    <!-- Список марафонов -->
    <div v-else-if="marathonsStore.marathons.length === 0" class="empty-state">
      Марафоны пока не найдены.
    </div>

    <div v-else class="marathons-grid">
      <div
        v-for="marathon in marathonsStore.marathons"
        :key="marathon.id"
        class="marathon-card"
        @click="goToMarathon(marathon.id)"
      >
        <h3 class="card-title">{{ marathon.title }}</h3>
        <p class="card-description">
          {{ marathon.description }}
        </p>
        <div class="card-footer">
          <span class="meta-item">📅 {{ marathon.durationDays }} дней</span>
          <span class="meta-item">👥 {{ marathon.participants.length }} участников</span>
          <span
            class="status-badge"
            :class="{ 'status-active': marathon.isActive, 'status-finished': !marathon.isActive }"
          >
            {{ marathon.isActive ? 'Активен' : 'Завершён' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMarathonsStore } from '@/stores/marathons'

const router = useRouter()
const marathonsStore = useMarathonsStore()

const goToMarathon = (id: string): void => {
  router.push(`/marathon/${id}`)
}

onMounted(() => {
  // Исправлено: вызываем существующий метод fetchMarathons
  marathonsStore.fetchMarathons()
})
</script>

<style scoped>
/* Контейнер и отступы */
.page-container {
  padding-top: 2rem;
  padding-bottom: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  font-weight: 600;
}

/* Сетка */
.marathons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

/* Карточка */
.marathon-card {
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 8px;
  padding: 1.25rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  background-color: #fff;
  display: flex;
  flex-direction: column;
}

.marathon-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-color: var(--primary, #3b82f6);
}

.card-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.card-description {
  color: var(--text-muted, #6b7280);
  font-size: 0.875rem;
  line-height: 1.4;
  margin: 0 0 1rem 0;
  flex-grow: 1; /* Чтобы футер всегда был внизу при разной длине описания */
  display: -webkit-box;
  -webkit-line-clamp: 3; /* Ограничение описания 3 строками */
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Футер карточки */
.card-footer {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--text-muted, #6b7280);
  flex-wrap: wrap;
  align-items: center;
  margin-top: auto;
}

.meta-item {
  white-space: nowrap;
}

.status-badge {
  margin-left: auto;
  font-weight: 500;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background-color: #f3f4f6;
}

.status-active {
  color: var(--primary, #3b82f6);
  background-color: rgba(59, 130, 246, 0.1);
}

.status-finished {
  color: var(--text-muted, #6b7280);
}

/* Состояния страницы */
.loading-state, .empty-state {
  text-align: center;
  padding: 3rem 0;
  color: var(--text-muted, #6b7280);
  font-size: 1.125rem;
}

.error-state {
  text-align: center;
  padding: 2rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #b91c1c;
}

.retry-btn {
  display: block;
  margin: 1rem auto 0;
  padding: 0.5rem 1rem;
  background-color: #b91c1c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.retry-btn:hover {
  background-color: #991b1b;
}
</style>
