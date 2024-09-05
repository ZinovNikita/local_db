import { createApp } from 'vue'
import PrimeVue from 'primevue/config';
import MyTheme from './theme.ts';
import App from './App.vue'
import './style.css'

const app = createApp(App);
app.use(PrimeVue, MyTheme);
app.mount('#app')
