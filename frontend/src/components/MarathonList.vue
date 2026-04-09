<template>
  <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">
    <div
      v-for="marathon in marathons"
      :key="marathon.id"
      class="card"
      style="cursor: pointer; border: 1px solid var(--border);"
      @click.stop="$emit('marathon-click', marathon.id)"
    >
      <h3 style="margin-bottom: 0.5rem;">{{ marathon.title }}</h3>
      <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1rem; line-height: 1.4;">
        {{ marathon.description }}
      </p>
      <div style="display: flex; gap: 1rem; font-size: 0.875rem; color: var(--text-muted); flex-wrap: wrap;">
        <span>📅 {{ marathon.durationDays }} дней</span>
        <span>👥 {{ marathon.participants.length }} участников</span>
        <span :style="{ color: statusInfo[marathon.status || 'draft'].color, marginLeft: 'auto', fontWeight: 500 }">
          {{ statusInfo[marathon.status || 'draft'].label }}
        </span>
      </div>
      <button
        v-if="canJoin(marathon) && !isJoined(marathon) && !isOwner(marathon)"
        class="btn btn-join"
        style="margin-top: 1rem; width: 100%;"
        @click.stop="$emit('join-click', marathon.id)"
      >
        🙋 Присоединиться
      </button>
      <div v-else-if="isJoined(marathon)" style="margin-top: 1rem; text-align: center; color: #388e3c; font-size: 0.875rem; font-weight: 500;">
        ✅ Вы участник
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Marathon, MarathonStatus } from '@/types';

const statusInfo: Record<MarathonStatus, { label: string; color: string }> = {
  draft: { label: 'Черновик', color: 'var(--text-muted)' },
  public: { label: 'Опубликован', color: 'var(--primary)' },
  active: { label: 'Активен', color: 'var(--primary)' },
  completed: { label: 'Завершён', color: 'var(--text-muted)' },
};

const props = defineProps<{
  marathons: Marathon[];
  currentUser?: string | null;
}>();

defineEmits<{
  'marathon-click': [id: string];
  'join-click': [id: string];
}>();

const canJoin = (m: Marathon) => m.status === 'public' || m.status === 'active';
const isJoined = (m: Marathon) => props.currentUser && m.participants.includes(props.currentUser);
const isOwner = (m: Marathon) => props.currentUser && m.mentorId === props.currentUser;
</script>

<style scoped>
.btn-join {
  padding: 0.5rem 1rem;
  background: #388e3c;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-join:hover {
  background: #2e7d32;
}
</style>
