import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'
import '@/assets/main.css'
import 'emoji-picker-element';
import { useAuthStore } from '@/api/auth';

// const pinia = createPinia().use(piniaPluginPersistedstate)

// createApp(App)
//   .use(pinia)
//   .use(router)
//   .mount('#app')

const pinia = createPinia().use(piniaPluginPersistedstate);

const app = createApp(App)
app.use(pinia)
app.use(router);

const authStore = useAuthStore();
authStore.init();

app.mount('#app')
