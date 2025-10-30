// main.js - Electron 主进程

// 导入 session 和 child_process 模块
const { app, BrowserWindow, ipcMain, dialog, shell, session } = require('electron'); 
const path = require('path');
const log = require('electron-log'); 
const { exec } = require('child_process'); // 关键：导入 child_process 用于静默安装

// 配置日志
log.transports.console.level = 'info';
log.transports.file.level = 'info';
log.transports.file.fileName = 'app_client.log';

let mainWindow;

/** 发送日志到日志文件、控制台和渲染进程 */
function sendLog(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    // 关键修正 1：安全调用 log 函数，避免 log[level] 的潜在错误
    if (log[level] && typeof log[level] === 'function') {
        log[level](message); 
    } else {
        // 如果级别不存在，默认使用 info
        log.info(message);
    }
    
    if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('log-message', logMessage);
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1300, height: 800, minWidth: 900, minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), 
            // 确保在生产环境中 nodeIntegration: false, contextIsolation: true 保持安全
            nodeIntegration: false, 
            contextIsolation: true,
        },
        title: '应用管理桌面客户端',
    });

    mainWindow.loadFile('index.html');
    // mainWindow.webContents.openDevTools(); 
    sendLog('客户端启动成功...');

    mainWindow.on('close', () => {
        // 应用程序关闭时停止所有下载
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});


// =========================================================
// IPC 通信 (主进程 <-> 渲染进程)
// =========================================================

// 1. 处理“开始下载”请求 (使用原生的 session.defaultSession.on('will-download'))
ipcMain.on('start-download', (event, data) => {
    const { url, filename, installMethod } = data; 
    
    // 捕获 IPC sender 对象，用于异步回调通信
    const webContentsSender = event.sender;
    
    sendLog(`主进程接收下载请求: ${filename} (${url})`, 'info');

    const downloadSession = session.defaultSession;
    if (!downloadSession) {
        sendLog('获取 defaultSession 失败，无法启动下载。', 'error');
        webContentsSender.send('download-fail', { filename: filename, error: '无法获取下载会话' });
        return;
    }
    
    // ⚠️ 拦截下载事件，使用 once 确保只为这次 downloadURL 调用设置一次监听器
    downloadSession.once('will-download', (event, item, webContents) => {
        
        // 1. 设置保存路径和文件名
        const savePath = path.join(app.getPath('downloads'), filename);
        item.setSavePath(savePath);
        sendLog(`已设置下载路径: ${savePath}`);

        // 2. 监听下载进度
        item.on('updated', (itemEvent, state) => { // 使用 itemEvent 避免与外部 event 混淆
            if (state === 'progressing') {
                const receivedBytes = item.getReceivedBytes();
                const totalBytes = item.getTotalBytes();
                const percent = totalBytes > 0 ? receivedBytes / totalBytes : 0; 
                
                // 使用捕获的 webContentsSender 发送进度
                webContentsSender.send('download-progress', {
                    filename: filename,
                    progress: percent, 
                });
            }
        });

        // 3. 监听下载完成/失败
        item.on('done', (itemEvent, state) => { // 使用 itemEvent 避免与外部 event 混淆
            if (state === 'completed') {
                const finalFilePath = item.getSavePath();
                sendLog(`下载完成 (${filename}): ${finalFilePath}`, 'success');

                // 使用捕获的 webContentsSender 发送完成通知
                webContentsSender.send('download-complete', {
                    filename: filename,
                    filePath: finalFilePath, 
                    installMethod: installMethod, 
                });
            } else {
                // 下载失败、取消或中断
                sendLog(`下载失败或取消 (${filename}). 状态: ${state}`, 'error');
                webContentsSender.send('download-fail', { filename: filename, error: `下载状态: ${state}` });
            }
        });
    });

    // 4. 触发下载
    mainWindow.webContents.downloadURL(url);
});

// 2. 处理“打开文件路径”请求 (手动安装)
ipcMain.on('open-file-path', (event, filePath) => {
    shell.showItemInFolder(filePath); 
    sendLog(`已打开文件所在目录并选中文件: ${filePath}`);
});

// 3. 处理“静默安装”请求
ipcMain.on('run-silent-install', (event, filePath) => {
    
    sendLog(`尝试触发静默安装程序: ${filePath} (使用 /S 静默参数)`, 'warning');
    
    try {
        // 确保路径包含引号，以处理路径中的空格
        const command = `"${filePath}" /S`; 
        
        // 使用 child_process.exec 执行命令
        exec(command, (error, stdout, stderr) => {
            if (error) {
                // 报告执行错误
                sendLog(`静默安装执行失败: ${error.message}。命令: ${command}`, 'error');
                event.sender.send('install-fail', { filename: path.basename(filePath), error: error.message });
                return;
            }
            // 报告成功执行命令，不代表安装成功，只是命令已启动
            sendLog(`静默安装命令已成功执行: ${command}. stdout: ${stdout.trim()}`, 'success');
        });
        
    } catch (error) {
        // 捕获 child_process 相关的同步错误 (如权限问题)
        sendLog(`无法执行静默安装 (exec 异常): ${error.message}`, 'error');
        event.sender.send('install-fail', { filename: path.basename(filePath), error: `安装程序启动失败: ${error.message}` });
    }
});

// 4. 处理“关于”弹窗请求
ipcMain.on('show-about', () => {
    dialog.showMessageBox(mainWindow, {
        title: '关于应用管理客户端',
        message: 'Electron 桌面客户端',
        detail: '版本: 1.0.0\n负责应用下载和本地安装（静默/手动）。\n数据来源于 Django 后端 API。',
        buttons: ['确定']
    });
});

// =========================================================
// 新增 IPC 通信：打开外部链接
// =========================================================
ipcMain.on('open-external-link', (event, url) => {
    // 确保 URL 是有效的，并使用 shell.openExternal 打开
    if (url && typeof url === 'string') {
        // 使用 shell.openExternal 打开用户的默认浏览器
        shell.openExternal(url)
            .then(() => {
                sendLog(`已在外部浏览器打开链接: ${url}`, 'info');
            })
            .catch(error => {
                sendLog(`打开外部链接失败: ${url}. 错误: ${error.message}`, 'error');
            });
    } else {
        sendLog('尝试打开的外部链接无效或为空。', 'error');
    }
});