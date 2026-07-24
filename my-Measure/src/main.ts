// import { createApp } from 'vue'
// import './style.css'
// import App from './App.vue'

// createApp(App).mount('#app')
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

// 引入 eruda 调试工具（仅在开发环境或 VITE_SHOW_ERUDA 为 true 时启用）
if (import.meta.env.VITE_SHOW_ERUDA === 'true') {
  import('eruda').then(({ default: eruda }) => {
    eruda.init()
  })
}

// 1. 引入 Vant 基础样式
import 'vant/lib/index.css'

// 2. 按需引入你需要的组件
import { Form, Field, Button, List, Cell, Search, SwipeCell, Popup, Icon, Dialog, Empty, Tag, NavBar, CellGroup } from 'vant'

const app = createApp(App)
app.use(router)
app.use(Form)
app.use(Field)
app.use(Button)
app.use(List)
app.use(Cell)
app.use(Search)
app.use(SwipeCell)
app.use(Popup)
app.use(Icon)
app.use(Dialog)
app.use(Empty)
app.use(Tag)
app.use(NavBar)
app.use(CellGroup)
app.mount('#app')