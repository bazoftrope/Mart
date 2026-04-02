<template>
  <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">
    <div
      v-for="marathon in marathons"
      :key="marathon.id"
      class="card"
      style="cursor: pointer; border: 1px solid var(--border);"
      @click="$emit('marathon-click', marathon.id)"
    >
      <h3 style="margin-bottom: 0.5rem;">{{ marathon.title }}</h3>
      <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1rem; line-height: 1.4;">
        {{ marathon.description }}
      </p>
      <div style="display: flex; gap: 1rem; font-size: 0.875rem; color: var(--text-muted); flex-wrap: wrap;">
        <span>📅 {{ marathon.durationDays }} дней</span>
        <span>👥 {{ marathon.participants.length }} участников</span>
        <span :style="{ color: marathon.isActive ? 'var(--primary)' : 'var(--text-muted)', marginLeft: 'auto', fontWeight: 500 }">
          {{ marathon.isActive ? 'Активен' : 'Завершён' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Marathon } from '@/types'; // Убедитесь, что путь правильный

// Определение пропсов
defineProps<{
  marathons: Marathon[];
}>();

// Определение событий
defineEmits<{
  'marathon-click': [id: string];
}>();
</script>
