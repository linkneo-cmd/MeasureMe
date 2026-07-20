import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// 引入 nodejs 的 path 模块和 url 模块，用于解析绝对路径
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  // 重点：配置别名解析
  resolve: {
    alias: {
      // 将 '@' 映射到项目根目录下的 'src' 文件夹
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // 如果你之前配置了 Capacitor，记得保留原有配置
  server: {
    // 你的其他配置...
  }
})