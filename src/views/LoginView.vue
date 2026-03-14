<template>
  <div class="page-center">
    <div class="card" style="width: 100%; max-width: 400px;">
      <h1 class="text-center mb-1">Вход в марафон</h1>

      <form @submit.prevent="handleSubmit">
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
            placeholder="••••••••"
          />
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
          {{ authStore.isLoading ? 'Вход...' : 'Войти' }}
        </button>
      </form>

      <p class="text-center mt-2" style="color: var(--text-muted);">
        Нет аккаунта?
        <router-link to="/register" style="color: var(--primary);">Зарегистрироваться</router-link>
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

const email = ref('')
const password = ref('')

const handleSubmit = async () => {
  const success = await authStore.login(email.value, password.value)
  if (success) {
    router.push('/dashboard')
  }
}
</script>

<style scoped>
.page-center {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
</style>
