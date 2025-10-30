// preload.js - 安全预加载脚本

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // 渲染进程 -> 主进程 (发送数据)
    startDownload: (data) => ipcRenderer.send('start-download', data),
    showAbout: () => ipcRenderer.send('show-about'),
    openFilePath: (filePath) => ipcRenderer.send('open-file-path', filePath),
    runSilentInstall: (filePath) => ipcRenderer.send('run-silent-install', filePath),
    
    // 💥 新增：用于打开外部链接
    openExternalLink: (url) => ipcRenderer.send('open-external-link', url), // <--- 关键新增行
    
    // 主进程 -> 渲染进程 (接收数据/监听事件)
    onLogMessage: (callback) => ipcRenderer.on('log-message', (event, message) => callback(message)),
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, data) => callback(data)),
    onDownloadComplete: (callback) => ipcRenderer.on('download-complete', (event, data) => callback(data)),
});