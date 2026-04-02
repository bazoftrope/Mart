import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "./stores/auth";
import "./assets/styles.css";

const app = createApp(App);

app.use(createPinia());

const authStore = useAuthStore();
authStore.init();

app.use(router);

app.mount("#app");
