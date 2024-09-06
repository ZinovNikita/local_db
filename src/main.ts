import { createApp } from 'vue'
import { createStore } from 'vuex'
import PrimeVue from 'primevue/config';
import MyTheme from './theme.ts';
import App from './App.vue'
import TestStore from './components/test/store.ts'
import './style.css'

const app = createApp(App);
const store = createStore({})
store.registerModule('TestStore', TestStore)
app.use(store)
app.use(PrimeVue, MyTheme);
app.mount('#app')
