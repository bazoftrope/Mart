<template>
  <div class="card">
    <h2 style="margin-bottom: 1rem;">Статистика</h2>

    <div v-if="!marathons" style="color: var(--text-muted);">
      Нет данных
    </div>

    <div v-else class="stats-grid">
      <div class="stat-item">
        <span class="stat-value">{{ totalMarathons }}</span>
        <span class="stat-label">Марафонов</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ totalReports }}</span>
        <span class="stat-label">Отчётов</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ completionRate }}%</span>
        <span class="stat-label">Выполнение</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Marathon } from '@/types'

const props = defineProps<{
  marathons: Marathon[]  // 👈 Принимаем сырые данные
}>()

// 👇 Вся логика расчётов — ВНУТРИ компонента
const totalMarathons = computed(() => props.marathons.length)

const totalReports = computed(() => {
  // Заглушка: когда появится логика отчётов — поменяете здесь
  return 0
  // Пример: props.marathons.reduce((sum, m) => sum + m.reports?.length || 0, 0)
})

const completionRate = computed(() => {
  // Заглушка: когда появится логика — поменяете здесь
  return 0
  // Пример: Math.round((totalReports.value / (totalMarathons.value * 10)) * 100) || 0
})
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
.stat-item {
  padding: 1rem;
  background: var(--bg, #f5f5f5);
  border-radius: var(--radius, 8px);
  text-align: center;
}
.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: 600;
  color: var(--primary, #42b983);
  margin-bottom: 0.25rem;
}
.stat-label {
  color: var(--text-muted, #666);
  font-size: 0.875rem;
}
@media (max-width: 768px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .stats-grid { grid-template-columns: 1fr; }
}
</style>
