import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'
import '@/assets/main.css'
import 'emoji-picker-element';
import naive from 'naive-ui'
import { useAuthStore } from '@/stores/authStore';

const pinia = createPinia().use(piniaPluginPersistedstate);

const app = createApp(App)
app.use(pinia)
app.use(router);
app.use(naive)

const authStore = useAuthStore();
authStore.init();

app.mount('#app')
