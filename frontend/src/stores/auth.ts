import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { pb, collections } from "@/api/pocketbase";
import type { User } from "@/types";

export const useAuthStore = defineStore("auth", () => {
  // State
  const user = ref<User | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const isAuthenticated = computed(() => !!user.value);
  const isMentor = computed(() => user.value?.role === "mentor");
  const isParticipant = computed(() => user.value?.role === "participant");

  // Actions
  const init = () => {
    // Восстанавливаем сессию при загрузке
    user.value = pb.authStore.model as User | null;

    // Слушаем изменения
    pb.authStore.onChange(() => {
      user.value = pb.authStore.model as User | null;
    });
  };

  const login = async (email: string, password: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      await collections.users.authWithPassword(email, password);
      user.value = pb.authStore.model as unknown as User;
      return true;
    } catch (err: any) {
      error.value = err.message || "Ошибка входа";
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    role: "participant" | "mentor",
  ) => {
    isLoading.value = true;
    error.value = null;

    try {
      await collections.users.create({
        email,
        password,
        passwordConfirm: password,
        name,
        role,
      });

      // Автоматически логиним после регистрации
      return await login(email, password);
    } catch (err: any) {
      error.value = err.message || "Ошибка регистрации";
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = () => {
    pb.authStore.clear();
    user.value = null;
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    isMentor,
    isParticipant,
    init,
    login,
    register,
    logout,
  };
});
