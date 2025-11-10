import { defineConfig } from 'vite';

export default defineConfig({
  clearScreen: false,
  server: {
    port: 5173, // 改用 Vite 默认端口
    strictPort: false, // 如果端口被占用，自动使用下一个可用端口
    host: '127.0.0.1', // 使用 IPv4 避免权限问题
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
    minify: !proce