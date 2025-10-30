// renderer.js - Electron 渲染进程逻辑

// 确保这里的 URL 与您的 Django 服务器地址一致
const DJANGO_BASE_URL = 'http://dsm:8000'; 
const APP_API_URL = `${DJANGO_BASE_URL}/api/v1/applications/`;
const NAV_API_URL = `${DJANGO_BASE_URL}/api/v1/navigation/`; 
// 服务器路径下载的 API 路由
const DOWNLOAD_SERVER_URL = `${DJANGO_BASE_URL}/download/server-file/?path=`; 

const $appCardsContainer = document.getElementById('app-cards-container');
const $categoryList = document.getElementById('category-list');
const $searchInput = document.getElementById('search-input');
const $aboutButton = document.getElementById('about-button');
const $logContent = document.getElementById('log-panel');
const $navList = document.getElementById('nav-list');
const $loadingMessage = document.getElementById('loading-message');
const $refreshButton = document.getElementById('refresh-button'); 


let allApplications = [];
let groupedApplications = {};
let currentCategory = 'all';

// ======================= 1. LOGIC & DATA FETCHING =======================

/**
 * 在底部日志面板显示信息。
 */
function displayLog(message, level = 'info') {
    const logContent = document.getElementById('log-content');
    if (!logContent) return;
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${level}`;
    logEntry.textContent = message;
    logContent.prepend(logEntry); 
    
    // 限制日志条目数量
    if (logContent.children.length > 50) logContent.removeChild(logContent.lastChild);
}

/**
 * 从 Django API 获取应用和导航数据。
 */
async function fetchData() {
    displayLog('info', '正在连接 Django API...');
    
    // 显示加载信息
    if ($loadingMessage) $loadingMessage.style.display = 'block';

    try {
        // 1. 获取应用数据
        const appResponse = await fetch(APP_API_URL);
        if (!appResponse.ok) throw new Error(`应用API错误: ${appResponse.status} ${appResponse.statusText}`);
        allApplications = await appResponse.json();
        
        groupApps(allApplications);
        renderCategories();
        filterAndRenderCards();
        displayLog(`success`, `成功加载 ${allApplications.length} 个应用数据。`);

        // 2. 获取网站导航数据
        const navResponse = await fetch(NAV_API_URL);
        if (navResponse.ok) {
            const navData = await navResponse.json();
            renderNavigation(navData);
        } else {
             displayLog(`warning`, `导航 API 加载失败 (${navResponse.status})，跳过导航渲染。`);
        }

    } catch (error) {
        if ($loadingMessage) {
            $loadingMessage.textContent = `数据加载失败。请检查 Django 服务器是否在 ${DJANGO_BASE_URL} 运行。`;
        }
        displayLog(`error`, `致命错误: ${error.message}`);
    } finally {
        if ($loadingMessage) $loadingMessage.style.display = 'none';
    }
}

/**
 * 根据应用分类对应用进行分组。
 */
function groupApps(apps) {
    groupedApplications = { 'all': apps };
    apps.forEach(app => {
        // 关键：从 category 对象中获取 name 字段
        const categoryName = app.category && app.category.name ? app.category.name : '未分类';
        if (!groupedApplications[categoryName]) groupedApplications[categoryName] = [];
        groupedApplications[categoryName].push(app);
    });
}

/**
 * 筛选并渲染应用卡片。
 */
function filterAndRenderCards() {
    const searchTerm = $searchInput.value.toLowerCase();
    let filteredApps = groupedApplications[currentCategory] || [];
    
    if (searchTerm) {
        filteredApps = filteredApps.filter(app => 
            app.name.toLowerCase().includes(searchTerm) || 
            (app.short_description && app.short_description.toLowerCase().includes(searchTerm))
        );
    }
    
    $appCardsContainer.innerHTML = '';
    if (filteredApps.length === 0) {
        $appCardsContainer.innerHTML = `<p style="text-align: center; color: #6c757d;">当前分类或搜索条件下没有找到应用。</p>`;
        return;
    }

    filteredApps.forEach(app => {
        $appCardsContainer.appendChild(createAppCard(app));
    });
}

/**
 * 💥 核心修复函数：根据下载类型确定下载链接和文件名。
 * 使用后端返回的中文 display 值进行判断。
 */
function getAppDownloadInfo(app) {
    let downloadUrl = '';
    let filename = '';
    
    const downloadType = app.download_type;

    // 1. 外部链接
    if (downloadType === '外部链接' && app.external_link) { 
        downloadUrl = app.external_link;
        filename = app.external_link.split('/').pop().split('?')[0]; 
        
    // 2. 本机上传 (使用 serializers.py 中返回的绝对 URL)
    } else if (downloadType === '本机上传' && app.uploaded_file_url) { 
        downloadUrl = app.uploaded_file_url; 
        filename = downloadUrl.split('/').pop().split('?')[0];
        
    // 3. 服务器路径 (使用 Django 自定义的 download_server_file 路由)
    } else if (downloadType === '手动选择服务器文件' && app.server_file_path) { 
        // 构造服务器文件下载 API URL，必须编码路径参数
        downloadUrl = DOWNLOAD_SERVER_URL + encodeURIComponent(app.server_file_path);
        // 文件名从服务器路径中提取
        filename = app.server_file_path.split(/[\/\\]/).pop(); 
    }

    // 默认或后备文件名清理
    if (!filename || filename.length < 5 || filename.endsWith('.')) {
        const baseFilename = app.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
        filename = `${baseFilename}-${app.version || 'latest'}.exe`; 
    }
    
    // 确保文件名中不包含 URL 参数
    filename = filename.split('?')[0]; 
    
    return { downloadUrl, filename };
}

// ======================= 2. RENDERING =======================

function renderCategories() {
    $categoryList.innerHTML = ''; 
    const totalCount = allApplications.length;
    
    const allLink = createCategoryLink('全部应用', 'all', totalCount);
    $categoryList.appendChild(allLink);

    Object.keys(groupedApplications)
        .filter(key => key !== 'all')
        .sort()
        .forEach(categoryName => {
            const count = groupedApplications[categoryName].length;
            $categoryList.appendChild(createCategoryLink(categoryName, categoryName, count));
        });
}

function createCategoryLink(name, id, count) {
    const link = document.createElement('a');
    link.href = '#';
    link.className = `category-item ${id === currentCategory ? 'active' : ''}`;
    link.textContent = `${name} (${count})`;
    link.dataset.categoryId = id;
    link.addEventListener('click', (e) => {
        e.preventDefault();
        currentCategory = id;
        renderCategories(); 
        filterAndRenderCards();
    });
    return link;
}

/**
 * 💥 核心修复函数：创建单个应用卡片。
 * 使用 logo_url 作为图片源。
 */
function createAppCard(app) {
    const { downloadUrl, filename } = getAppDownloadInfo(app);
    
    // 根据 install_method 字段判断是 '安装' (静默安装) 还是 '下载' (手动安装)
    const isSilent = app.install_method === '静默安装'; 
    const buttonText = isSilent ? '安装' : '下载';
    const buttonClass = isSilent ? 'install-button' : 'download-button';
    
    // 💥 关键修复点：使用 logo_url 字段，如果缺失则使用占位符
    const logoUrl = app.logo_url || './static/placeholder.svg'; 

    const card = document.createElement('div');
    card.className = 'app-card';
    card.dataset.appName = app.name;
    
    // 1. Logo
    card.innerHTML += `<div class="app-logo"><img src="${logoUrl}" alt="${app.name} Logo"></div>`;

    // 2. Info
    card.innerHTML += `
        <div class="app-info">
            <h3 title="${app.name}">${app.name}</h3>
            <p style="color: #007bff;">版本: ${app.version || 'N/A'}</p>
            <p title="${app.short_description || '暂无描述。'}">${app.short_description || '暂无描述。'}</p>
        </div>
    `;

    // 3. Action Button
    const buttonDiv = document.createElement('div');
    buttonDiv.className = 'app-action';
    const button = document.createElement('button');
    button.className = `action-button ${buttonClass}`;
    button.textContent = downloadUrl ? buttonText : '链接缺失';
    button.disabled = !downloadUrl;

    if (downloadUrl) {
        button.dataset.downloadUrl = downloadUrl;
        button.dataset.installMethod = app.install_method;
        button.dataset.filename = filename; 
        
        button.addEventListener('click', () => handleAppAction(app, button));
    }
    buttonDiv.appendChild(button);
    card.appendChild(buttonDiv);

    return card;
}

function renderNavigation(navs) {
    $navList.innerHTML = '';
    navs.forEach(nav => {
        const link = document.createElement('a');
        link.className = 'nav-link';
        link.href = nav.url;
        link.textContent = nav.name;
        link.target = '_blank'; // 在外部浏览器中打开
        $navList.appendChild(link);
    });
}

// ======================= 3. HANDLERS =======================

function handleAppAction(app, button) {
    const { downloadUrl, filename } = getAppDownloadInfo(app);
    
    button.disabled = true;
    button.textContent = '开始下载...';
    
    // 发送下载请求到主进程
    window.electronAPI.startDownload({
        url: downloadUrl,
        filename: filename,
        installMethod: app.install_method
    });
    
    displayLog(`info`, `触发下载: ${app.name}`);
}

// ------------------- IPC LISTENERS (下载和安装反馈) -------------------

// 监听主进程发来的日志消息
window.electronAPI.onLogMessage((message) => {
    // 尝试解析日志级别
    let level = 'info';
    if (message.includes('[ERROR]')) level = 'error';
    else if (message.includes('[SUCCESS]') || message.includes('完成')) level = 'success';
    else if (message.includes('[WARNING]')) level = 'warning';
    
    displayLog(message, level);
});

// 监听下载进度
window.electronAPI.onDownloadProgress((data) => {
    document.querySelectorAll(`button[data-filename="${data.filename}"]`).forEach(button => {
        const percent = Math.round(data.progress * 100);
        button.textContent = `下载中... ${percent}%`;
    });
});

// 监听下载完成
window.electronAPI.onDownloadComplete((data) => {
    document.querySelectorAll(`button[data-filename="${data.filename}"]`).forEach(button => {
        
        button.disabled = false; 
        
        if (data.installMethod === '静默安装') {
            // 静默安装：下载完成，自动触发运行
            button.textContent = '安装中...';
            window.electronAPI.runSilentInstall(data.filePath); 
            
            // 最终状态
            button.textContent = '已安装/运行';
            button.style.backgroundColor = '#6c757d'; 
            button.disabled = true; 
            
// ...
        } else { // '手动安装'
            
            // 💥 关键新增行：自动调用 openFilePath 打开目录
            window.electronAPI.openFilePath(data.filePath);
            displayLog(`[手动安装] 文件已下载完成，自动打开目录: ${data.filePath}`, 'success');

            // 按钮状态更新：下载完成，按钮变为“已打开目录”
            button.textContent = '已打开目录'; 
            button.style.backgroundColor = '#6c757d'; // 灰色
            button.disabled = true; 
            
            // 可选：如果您希望按钮仍然可点击，用于重新打开目录，可以保留 onclick
            /*
            button.disabled = false;
            button.textContent = '重新打开目录';
            button.onclick = () => {
                window.electronAPI.openFilePath(data.filePath);
            };
            */
        }
    });
});
function renderNavigation(navigationList) {
    const $navList = document.getElementById('nav-list');
    if (!$navList) return;

    $navList.innerHTML = ''; // 清空现有内容

    // 假设 navigationList 是一个包含 {name, url} 对象的数组
    navigationList.forEach(nav => {
        // 确保 nav 对象有 name 和 url 属性
        if (!nav.name || !nav.url) return; 

        const link = document.createElement('a');
        link.href = '#'; // 使用 # 阻止 a 标签的默认导航行为
        link.className = 'nav-link';
        link.textContent = nav.name; 

        // 💥 关键修正：点击时调用 openExternalLink API
        link.onclick = (e) => {
            e.preventDefault(); // 阻止 a 标签默认行为
            // 使用 IPC 调用主进程的 shell.openExternal
            window.electronAPI.openExternalLink(nav.url); 
            displayLog(`正在请求在系统浏览器中打开链接: ${nav.url}`, 'info');
        };

        $navList.appendChild(link);
    });
    
    // 如果没有导航链接，隐藏整个导航栏（可选）
    const $websiteNavigation = document.getElementById('website-navigation');
    if ($websiteNavigation) {
         $websiteNavigation.style.display = navigationList.length > 0 ? 'block' : 'none';
    }
}

// ======================= 4. 初始化 =======================
document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    $searchInput.addEventListener('input', filterAndRenderCards);
    
    if ($aboutButton) {
        $aboutButton.addEventListener('click', () => {
            window.electronAPI.showAbout();
        });
    }
});



if ($refreshButton) {
    $refreshButton.addEventListener('click', () => {
        displayLog('手动刷新数据...');
        // 调用 fetchData 函数重新加载数据
        fetchData(); 
    });
}