<template>
  <div class="page-center">
    <div class="card" style="width: 100%; max-width: 400px;">
      <h1 class="text-center mb-1">Регистрация</h1>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Имя</label>
          <input
            v-model="name"
            type="text"
            required
            placeholder="Иван Иванов"
          />
        </div>

        <div class="form-group">
          <label>Email</label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="your@email.com"
          />
        </div>

        <div class="form-group">
          <label>Пароль</label>
          <input
            v-model="password"
            type="password"
            required
            minlength="8"
            placeholder="••••••••"
          />
        </div>

        <div class="form-group">
          <label>Роль</label>
          <select v-model="role" required>
            <option value="participant">Участник</option>
            <option value="mentor">Ментор</option>
          </select>
        </div>

        <div v-if="authStore.error" class="error mb-1">
          {{ authStore.error }}
        </div>

        <button
          type="submit"
          class="btn btn-primary"
          style="width: 100%;"
          :disabled="authStore.isLoading"
        >
          {{ authStore.isLoading ? 'Регистрация...' : 'Зарегистрироваться' }}
        </button>
      </form>

      <p class="text-center mt-2" style="color: var(--text-muted);">
        Уже есть аккаунт?
        <router-link to="/login" style="color: var(--primary);">Войти</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const role = ref<'participant' | 'mentor'>('participant')

const handleSubmit = async () => {
  const success = await authStore.register(
    email.value,
    password.value,
    name.value,
    role.value
  )
  if (success) {
    router.push('/dashboard')
  }
}
</script>

<style scoped>
/* Нет стилей — всё в глобальном styles.css */
</style>
