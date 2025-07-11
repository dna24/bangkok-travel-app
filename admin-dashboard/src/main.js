import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'
import router from './router';
import '@fortawesome/fontawesome-free/css/all.css';

loadFonts()

createApp(App)
  .use(vuetify)
  .use(router)
  .mount('#app')
