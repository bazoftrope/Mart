import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { pb, collections } from "@/api/pocketbase";
import type { Marathon, DailyTask } from "@/types";

export const useMarathonsStore = defineStore("marathons", () => {
  // State
  const marathons = ref<Marathon[]>([]);
  const currentMarathon = ref<Marathon | null>(null);
  const tasks = ref<DailyTask[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const myMarathons = computed(() => {
    const userId = pb.authStore.model?.id;
    if (!userId) return [];
    return marathons.value.filter(
      (m) => m.mentorId === userId || m.participants.includes(userId),
    );
  });

  const activeMarathons = computed(() =>
    marathons.value.filter((m) => m.isActive),
  );

  // Actions
  const fetchMarathons = async (): Promise<boolean> => {
    isLoading.value = true;
    error.value = null;

    try {
      const result = await collections.marathons.getFullList({
        sort: "-created",
      });
      marathons.value = result as unknown as Marathon[];
      return true;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch marathons";
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchMarathonById = async (id: string): Promise<boolean> => {
    isLoading.value = true;
    error.value = null;

    try {
      const result = await collections.marathons.getOne(id);
      currentMarathon.value = result as unknown as Marathon;

      // Параллельно или последовательно загружаем задачи
      await fetchTasks(id);
      return true;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch marathon details";
      currentMarathon.value = null;
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchTasks = async (marathonId: string): Promise<boolean> => {
    try {
      const result = await collections.tasks.getFullList({
        filter: `marathonId = "${marathonId}"`,
        sort: "dayNumber",
      });
      tasks.value = result as unknown as DailyTask[];
      return true;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch tasks";
      tasks.value = [];
      return false;
    }
  };

  const createMarathon = async (
    data: Omit<Marathon, "id" | "created" | "updated">,
  ): Promise<string | null> => {
    isLoading.value = true;
    error.value = null;

    try {
      const result = await collections.marathons.create(data);
      const newMarathon = result as unknown as Marathon;

      // Добавляем в начало списка без полного перезапроса
      marathons.value.unshift(newMarathon);

      return newMarathon.id;
    } catch (err: any) {
      error.value = err.message || "Failed to create marathon";
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const updateMarathon = async (
    id: string,
    data: Partial<Omit<Marathon, "id" | "created" | "updated">>,
  ): Promise<boolean> => {
    isLoading.value = true;
    error.value = null;

    try {
      const result = await collections.marathons.update(id, data);
      const updatedMarathon = result as unknown as Marathon;

      // Обновляем в списке
      const index = marathons.value.findIndex((m) => m.id === id);
      if (index !== -1) {
        marathons.value[index] = updatedMarathon;
      }

      // ОБНОВЛЯЕМ currentMarathon если это тот же марафон
      if (currentMarathon.value?.id === id) {
        currentMarathon.value = updatedMarathon;
      }

      return true;
    } catch (err: any) {
      error.value = err.message || "Failed to update marathon";
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const joinMarathon = async (marathonId: string): Promise<boolean> => {
    const userId = pb.authStore.model?.id;
    if (!userId) {
      error.value = "User not authenticated";
      return false;
    }

    const marathonIndex = marathons.value.findIndex((m) => m.id === marathonId);
    if (marathonIndex === -1) {
      error.value = "Marathon not found";
      return false;
    }

    const marathon = marathons.value[marathonIndex];
    if (marathon?.participants.includes(userId)) {
      return true; // Уже участвует
    }

    try {
      const updatedParticipants = [...marathon!.participants, userId];

      // Обновляем на сервере
      const result = await collections.marathons.update(marathonId, {
        participants: updatedParticipants,
      });

      // Сразу обновляем локальный стейт (оптимистичное обновление)
      marathons.value[marathonIndex] = result as unknown as Marathon;

      // Если этот марафон сейчас открыт, обновим и его тоже
      if (currentMarathon.value?.id === marathonId) {
        currentMarathon.value = result as unknown as Marathon;
      }

      return true;
    } catch (err: any) {
      error.value = err.message || "Failed to join marathon";
      return false;
    }
  };

  // Метод для сброса текущего выбранного марафона (полезно при навигации)
  const resetCurrentMarathon = () => {
    currentMarathon.value = null;
    tasks.value = [];
    error.value = null;
  };

  return {
    marathons,
    currentMarathon,
    tasks,
    isLoading,
    error,
    myMarathons,
    activeMarathons,
    fetchMarathons,
    fetchMarathonById,
    fetchTasks,
    createMarathon,
    updateMarathon,
    joinMarathon,
    resetCurrentMarathon,
  };
});
