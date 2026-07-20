// import { createApp } from 'vue'
// import './style.css'
// import App from './App.vue'

// createApp(App).mount('#app')
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// 1. 引入 Vant 基础样式
import 'vant/lib/index.css'

// 2. 按需引入你需要的组件
import { Form, Field, Button, List, Cell } from 'vant'

const app = createApp(App)
app.use(Form)
app.use(Field)
app.use(Button)
app.use(List)
app.use(Cell)
app.mount('#app')