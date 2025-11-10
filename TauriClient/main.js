// 导入Tauri API
import { invoke } from '@tauri-apps/api/tauri';

// 检查是否在Tauri环境中
const isTauri = typeof window.__TAURI__ !== 'undefined';

// API地址配置
const API_ENDPOINTS = [
    'http://vip.itvip.com.cn:8000/api/v1/applications/',
    'http://d.itvip.com.cn:8000/api/v1/applications/',
    'http://dsm:8000/api/v1/applications/'
];

// 网站导航API地址配置
const NAV_API_ENDPOINTS = [
    'http://vip.itvip.com.cn:8000/api/v1/navigation/',
    'http://d.itvip.com.cn:8000/api/v1/navigation/',
    'http://dsm:8000/api/v1/navigation/'
];

// 当前使用的API地址
let currentApiEndpoint = 'http://vip.itvip.com.cn:8000/api/v1/applications/';
let currentNavApiEndpoint = 'http://vip.itvip.com.cn:8000/api/v1/navigation/';

// 导入Tauri API（如果在Tauri环境中）
let invokeFunction;

if (isTauri) {
    invokeFunction = invoke;
    console.log("Running in Tauri environment");
} else {
    // 浏览器环境的模拟函数
    invokeFunction = async (command, args) => {
        console.log("Running in browser environment, simulating command:", command);
        if (command === 'get_applications') {
            try {
                // 浏览器环境下由于CORS限制，使用模拟数据
                if (!isTauri) {
                    console.log("浏览器环境：使用模拟应用数据以避免CORS问题");
                    addLog("浏览器环境：使用模拟应用数据", 'info');
                    
                    // 返回模拟的应用数据
                    return {
                        results: [
                            {
                                id: 1,
                                name: "微信",
                                description: "社交通讯应用",
                                category: "social",
                                icon_url: "https://example.com/wechat.png",
                                download_url: "https://example.com/download/wechat",
                                version: "3.9.0",
                                size: "100MB",
                                publisher: "腾讯",
                                is_installed: false
                            },
                            {
                                id: 2,
                                name: "QQ",
                                description: "社交通讯应用",
                                category: "social",
                                icon_url: "https://example.com/qq.png",
                                download_url: "https://example.com/download/qq",
                                version: "9.7.0",
                                size: "80MB",
                                publisher: "腾讯",
                                is_installed: false
                            },
                            {
                                id: 3,
                                name: "Chrome浏览器",
                                description: "网页浏览器",
                                category: "browser",
                                icon_url: "https://example.com/chrome.png",
                                download_url: "https://example.com/download/chrome",
                                version: "118.0",
                                size: "120MB",
                                publisher: "Google",
                                is_installed: false
                            }
                        ],
                        count: 3,
                        next: null,
                        previous: null
                    };
                }
                
                // Tauri环境下尝试调用API
                const endpoints = [...API_ENDPOINTS];
                
                for (const endpoint of endpoints) {
                    try {
                        console.log(`尝试应用API端点: ${endpoint}`);
                        const response = await fetch(endpoint, {
                            method: 'GET',
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        if (!response.ok) {
                            console.warn(`API端点 ${endpoint} 返回错误状态: ${response.status}`);
                            continue; // 尝试下一个端点
                        }
                        
                        const data = await response.json();
                        console.log(`成功从 ${endpoint} 获取应用数据`, data);
                        return data;
                    } catch (endpointError) {
                        console.warn(`API端点 ${endpoint} 失败:`, endpointError.message);
                        continue; // 尝试下一个端点
                    }
                }
                
                // 所有端点都失败，抛出错误
                throw new Error('所有应用API端点都无法访问');
            } catch (error) {
                console.error('获取应用数据失败:', error);
                addLog(`获取应用数据失败: ${error.message}`, 'error');
                // 返回空数据而不是抛出错误
                return { results: [], count: 0, next: null, previous: null };
            }
        } else if (command === 'get_website_navigation') {
            try {
                // 浏览器环境下由于CORS限制，直接使用默认导航数据
                if (!isTauri) {
                    console.log("浏览器环境：使用默认导航数据以避免CORS问题");
                    addLog("浏览器环境：使用默认网站导航数据", 'info');
                    return [
                        { name: "GitHub", url: "https://github.com" },
                        { name: "Stack Overflow", url: "https://stackoverflow.com" },
                        { name: "MDN Web Docs", url: "https://developer.mozilla.org" },
                        { name: "淘宝", url: "https://www.taobao.com" },
                        { name: "京东", url: "https://www.jd.com" },
                        { name: "知乎", url: "https://www.zhihu.com" }
                    ];
                }
                
                // Tauri环境下尝试调用API
                const endpoints = [...NAV_API_ENDPOINTS];
                
                for (const endpoint of endpoints) {
                    try {
                        console.log(`尝试导航API端点: ${endpoint}`);
                        const response = await fetch(endpoint, {
                            method: 'GET',
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        if (!response.ok) {
                            console.warn(`API端点 ${endpoint} 返回错误状态: ${response.status}`);
                            continue; // 尝试下一个端点
                        }
                        
                        const data = await response.json();
                        console.log(`成功从 ${endpoint} 获取导航数据`, data);
                        return data;
                    } catch (endpointError) {
                        console.warn(`API端点 ${endpoint} 失败:`, endpointError.message);
                        continue; // 尝试下一个端点
                    }
                }
                
                // 所有端点都失败，抛出错误
                throw new Error('所有导航API端点都无法访问');
            } catch (error) {
                console.error('获取网站导航数据失败:', error);
                addLog(`获取网站导航数据失败: ${error.message}`, 'error');
                // 返回默认导航数据而不是抛出错误
                return [
                    { name: "GitHub", url: "https://github.com" },
                    { name: "Stack Overflow", url: "https://stackoverflow.com" },
                    { name: "MDN Web Docs", url: "https://developer.mozilla.org" }
                ];
            }
        }
        return Promise.reject(new Error(`未知命令: ${command}`));
    };
}

// DOM元素
const appCardsContainer = document.getElementById('app-cards-container');
const categoryList = document.getElementById('category-list');
const refreshButton = document.getElementById('refresh-button');
const searchInput = document.getElementById('search-input');
const clearSearchButton = document.getElementById('clear-search-button');
const logContent = document.getElementById('log-content');
const navList = document.getElementById('nav-list');
const settingsModal = document.getElementById('settings-modal');
const settingsApiButton = document.getElementById('settings-api-button');
const aboutButton = document.getElementById('about-button');
const closeSettingsModal = document.getElementById('close-settings-modal');
const openDownloadsButton = document.getElementById('open-downloads-button');

// 应用数据
let applications = [];
let categories = [];
let currentFilter = 'all'; // 当前筛选的分类
let searchQuery = ''; // 当前搜索查询

// 网站导航数据
let websiteNavs = [];

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // 加载数据和设置事件监听器
    loadApplications();
    loadWebsiteNavigation();
    setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
    refreshButton.addEventListener('click', loadApplications);
    searchInput.addEventListener('input', handleSearch);
    clearSearchButton.addEventListener('click', clearSearch);
    settingsApiButton.addEventListener('click', () => {
        settingsModal.style.display = 'block';
        renderApiSettings();
        // 添加API设置相关的事件监听器
        setupApiSettingsListeners();
    });
    aboutButton.addEventListener('click', showAboutDialog);
    closeSettingsModal.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });
    openDownloadsButton.addEventListener('click', openDownloadsDirectory);
    
    // 点击模态框外部关闭
    window.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });
}

// 设置API设置相关的事件监听器
function setupApiSettingsListeners() {
    // 添加API地址的事件监听器
    const addApiBtn = document.getElementById('add-api-btn');
    if (addApiBtn) {
        addApiBtn.removeEventListener('click', addNewApiEndpoint);
        addApiBtn.addEventListener('click', addNewApiEndpoint);
    }
    
    // 测试API速度按钮
    const testSpeedBtn = document.getElementById('test-speed-btn');
    if (testSpeedBtn) {
        testSpeedBtn.removeEventListener('click', testApiSpeed);
        testSpeedBtn.addEventListener('click', testApiSpeed);
    }
    
    // 刷新应用数据按钮
    const refreshApisBtn = document.getElementById('refresh-apis-btn');
    if (refreshApisBtn) {
        refreshApisBtn.removeEventListener('click', () => {
            settingsModal.style.display = 'none';
            loadApplications();
        });
        refreshApisBtn.addEventListener('click', () => {
            settingsModal.style.display = 'none';
            loadApplications();
        });
    }
}

// 日志功能
function addLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = `[${timestamp}] ${message}`;
    logContent.appendChild(logEntry);
    logContent.scrollTop = logContent.scrollHeight;
}

// 测试API速度
async function testApiSpeed() {
    addLog("开始测试API速度...");
    
    try {
        // 使用当前API地址测试速度
        const testUrl = currentApiEndpoint.replace(/\/api\/v1\/applications\/$/, '/test-speed/');
        
        const response = await fetch(testUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            const fastestApi = result.fastest_api;
            addLog(`最快的API地址: ${fastestApi.url} (响应时间: ${fastestApi.response_time}ms)`, 'success');
            
            // 如果最快的API不是当前使用的，询问是否切换
            if (fastestApi.url !== currentApiEndpoint) {
                if (confirm(`检测到更快的API地址: ${fastestApi.url}\n响应时间: ${fastestApi.response_time}ms\n是否切换到此API地址？`)) {
                    currentApiEndpoint = fastestApi.url;
                    addLog(`已切换到API地址: ${currentApiEndpoint}`, 'success');
                    // 重新加载应用数据
                    loadApplications();
                }
            } else {
                addLog("当前使用的API地址已是最快的", 'success');
            }
            
            // 显示所有API测试结果
            addLog("所有API测试结果:");
            result.all_results.forEach(api => {
                if (api.status === 'success') {
                    addLog(`  ${api.url}: ${api.response_time}ms`);
                } else {
                    addLog(`  ${api.url}: 失败 - ${api.error}`, 'error');
                }
            });
            
            return result;
        } else {
            addLog(`API速度测试失败: ${result.error}`, 'error');
            return null;
        }
    } catch (error) {
        addLog(`API速度测试出错: ${error.message}`, 'error');
        return null;
    }
}

// 渲染API设置
function renderApiSettings() {
    const currentApiInput = document.getElementById('current-api-input');
    const apiList = document.getElementById('api-list');
    
    // 更新当前API地址显示
    if (currentApiInput) {
        currentApiInput.value = currentApiEndpoint;
    }
    
    // 清空并重新生成API列表
    if (apiList) {
        apiList.innerHTML = '';
        
        // 添加所有API地址到列表
        API_ENDPOINTS.forEach(url => {
            const apiItem = document.createElement('div');
            apiItem.className = `api-item ${url === currentApiEndpoint ? 'active' : ''}`;
            apiItem.dataset.url = url;
            
            const urlSpan = document.createElement('span');
            urlSpan.className = 'api-url';
            urlSpan.textContent = url;
            
            const selectBtn = document.createElement('button');
            selectBtn.className = 'select-api-btn';
            selectBtn.textContent = '选择';
            selectBtn.disabled = url === currentApiEndpoint;
            
            apiItem.appendChild(urlSpan);
            apiItem.appendChild(selectBtn);
            
            // 为非默认API添加删除按钮
            if (!['http://vip.itvip.com.cn:8000/api/v1/applications/', 
                  'http://d.itvip.com.cn:8000/api/v1/applications/', 
                  'http://dsm:8000/api/v1/applications/'].includes(url)) {
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-api-btn';
                removeBtn.textContent = '删除';
                apiItem.appendChild(removeBtn);
            }
            
            apiList.appendChild(apiItem);
        });
        
        // 为选择按钮添加事件监听器
        document.querySelectorAll('.select-api-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const apiItem = e.target.closest('.api-item');
                const newApiUrl = apiItem.dataset.url;
                
                if (newApiUrl !== currentApiEndpoint) {
                    currentApiEndpoint = newApiUrl;
                    // 同步更新导航API地址
                    currentNavApiEndpoint = newApiUrl.replace('/applications/', '/navigation/');
                    
                    addLog(`已切换到API地址: ${currentApiEndpoint}`, 'success');
                    
                    // 更新UI
                    document.querySelectorAll('.api-item').forEach(item => {
                        item.classList.remove('active');
                        item.querySelector('.select-api-btn').disabled = false;
                    });
                    apiItem.classList.add('active');
                    apiItem.querySelector('.select-api-btn').disabled = true;
                    document.getElementById('current-api-input').value = currentApiEndpoint;
                    
                    // 重新加载应用数据和导航数据
                    loadApplications();
                    loadWebsiteNavigation();
                }
            });
        });
        
        // 为删除按钮添加事件监听器
        document.querySelectorAll('.remove-api-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const apiItem = e.target.closest('.api-item');
                const apiUrl = apiItem.dataset.url;
                
                if (confirm(`确定要删除API地址 ${apiUrl} 吗？`)) {
                    // 从API_ENDPOINTS数组中移除
                    const index = API_ENDPOINTS.indexOf(apiUrl);
                    if (index > -1) {
                        API_ENDPOINTS.splice(index, 1);
                    }
                    
                    // 如果删除的是当前使用的API，切换到默认API
                    if (apiUrl === currentApiEndpoint) {
                        currentApiEndpoint = API_ENDPOINTS[0];
                        addLog(`已切换到默认API地址: ${currentApiEndpoint}`, 'info');
                    }
                    
                    addLog(`已删除API地址: ${apiUrl}`, 'info');
                    
                    // 重新渲染API设置
                    renderApiSettings();
                }
            });
        });
    }
}

// 添加新的API端点
function addNewApiEndpoint() {
    const newApiInput = document.getElementById('new-api-input');
    const newApiUrl = newApiInput.value.trim();
    
    if (!newApiUrl) {
        alert('请输入API地址');
        return;
    }
    
    // 验证API地址格式
    if (!newApiUrl.startsWith('http://') && !newApiUrl.startsWith('https://')) {
        alert('API地址必须以http://或https://开头');
        return;
    }
    
    // 检查是否已存在
    if (API_ENDPOINTS.includes(newApiUrl)) {
        alert('该API地址已存在');
        return;
    }
    
    // 添加到API_ENDPOINTS数组
    API_ENDPOINTS.push(newApiUrl);
    
    // 同时添加导航API地址
    const navApiUrl = newApiUrl.replace('/applications/', '/navigation/');
    NAV_API_ENDPOINTS.push(navApiUrl);
    
    // 清空输入框
    newApiInput.value = '';
    
    // 重新渲染API设置
    renderApiSettings();
    
    addLog(`已添加新的API地址: ${newApiUrl}`, 'success');
}

// 加载应用数据
async function loadApplications() {
    addLog("开始加载应用数据...");
    try {
        showLoading();
        // 调用后端获取应用数据
        addLog("正在调用后端API获取应用数据...");
        applications = await invokeFunction('get_applications');
        addLog(`成功获取 ${applications.length} 个应用数据`, 'success');
        
        // 添加调试日志，检查前几个应用的图标数据
        if (applications.length > 0) {
            // 使用Tauri的invoke函数将日志输出到后端控制台
            invokeFunction('log_message', { message: `应用数据示例: ${JSON.stringify(applications[0])}` });
            for (let i = 0; i < Math.min(3, applications.length); i++) {
                const app = applications[i];
                invokeFunction('log_message', { message: `应用 ${app.name} 的图标数据: ${app.icon || '无图标'}` });
                addLog(`应用 ${app.name} 的图标数据: ${app.icon || '无图标'}`, 'info');
            }
        }
        
        categories = extractCategories(applications);
        
        renderCategories();
        renderApplications(applications);
    } catch (error) {
        addLog(`加载应用数据失败: ${error.message}`, 'error');
        showError('加载应用数据失败，请检查网络连接或联系管理员。');
    }
}

// 加载网站导航数据
async function loadWebsiteNavigation() {
    try {
        console.log('开始加载网站导航数据...');
        const navigationData = await invokeFunction('get_website_navigation');
        console.log('导航数据原始响应:', navigationData);
        
        // 处理不同的数据格式
        if (Array.isArray(navigationData)) {
            websiteNavs = navigationData;
            console.log('直接使用数组格式的导航数据');
        } else if (navigationData && navigationData.results) {
            websiteNavs = navigationData.results;
            console.log('使用分页格式的导航数据');
        } else if (navigationData && Array.isArray(navigationData.data)) {
            console.log('检测到data属性数组格式导航数据');
            websiteNavs = navigationData.data;
        } else {
            console.warn('未知的导航数据格式:', navigationData);
            websiteNavs = [];
        }
        
        // 确保websiteNavs是数组
        if (!Array.isArray(websiteNavs)) {
            console.warn('导航数据不是数组格式，转换为空数组');
            websiteNavs = [];
        }
        
        console.log('处理后的导航数据:', websiteNavs);
        renderWebsiteNavs();
        
        if (websiteNavs.length === 0) {
            addLog('未获取到网站导航数据', 'warning');
        } else {
            addLog(`成功加载 ${websiteNavs.length} 个网站导航`, 'success');
        }
    } catch (error) {
        console.error('加载网站导航数据失败:', error);
        addLog(`加载网站导航数据失败: ${error.message}`, 'error');
        
        // 使用默认导航数据
        const defaultNavs = [
            { name: 'GitHub', url: 'https://github.com' },
            { name: 'Stack Overflow', url: 'https://stackoverflow.com' },
            { name: 'MDN Web Docs', url: 'https://developer.mozilla.org' }
        ];
        
        websiteNavs = defaultNavs;
        renderWebsiteNavs();
        addLog('使用默认网站导航数据', 'info');
    }
}

// 提取分类
function extractCategories(apps) {
    const categorySet = new Set();
    apps.forEach(app => {
        if (app.category_name) {
            categorySet.add(app.category_name);
        }
    });
    return Array.from(categorySet);
}

// 渲染分类列表
function renderCategories() {
    // 计算每个分类的应用数量
    const categoryCounts = {};
    categories.forEach(category => {
        categoryCounts[category] = applications.filter(app => app.category_name === category).length;
    });
    
    categoryList.innerHTML = '<div class="category-item active" data-category="all">全部应用 (' + applications.length + ')</div>';
    
    categories.forEach(category => {
        const div = document.createElement('div');
        div.className = 'category-item';
        div.textContent = category + ' (' + categoryCounts[category] + ')';
        div.dataset.category = category;
        div.addEventListener('click', () => filterByCategory(category));
        categoryList.appendChild(div);
    });
    
    // 为"全部应用"添加点击事件
    document.querySelector('[data-category="all"]').addEventListener('click', () => {
        document.querySelectorAll('#category-list .category-item').forEach(item => item.classList.remove('active'));
        document.querySelector('[data-category="all"]').classList.add('active');
        currentFilter = 'all';
        applyFilters();
    });
}

// 按分类筛选应用
function filterByCategory(category) {
    document.querySelectorAll('#category-list .category-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    currentFilter = category;
    applyFilters();
}

// 搜索处理
function handleSearch() {
    searchQuery = searchInput.value.toLowerCase().trim();
    // 根据搜索框内容显示或隐藏清除按钮
    if (searchQuery) {
        clearSearchButton.style.display = 'flex';
    } else {
        clearSearchButton.style.display = 'none';
    }
    applyFilters();
}

// 清除搜索
function clearSearch() {
    searchInput.value = '';
    searchQuery = '';
    clearSearchButton.style.display = 'none';
    applyFilters();
}

// 应用筛选（分类和搜索）
function applyFilters() {
    let filteredApps = applications;
    
    // 应用分类筛选
    if (currentFilter !== 'all') {
        filteredApps = filteredApps.filter(app => app.category_name === currentFilter);
    }
    
    // 应用搜索筛选
    if (searchQuery) {
        filteredApps = filteredApps.filter(app => 
            app.name.toLowerCase().includes(searchQuery) || 
            (app.description && app.description.toLowerCase().includes(searchQuery))
        );
    }
    
    renderApplications(filteredApps);
    addLog(`筛选结果: ${filteredApps.length} 个应用`);
}

// 渲染应用列表
function renderApplications(apps) {
    if (apps.length === 0) {
        appCardsContainer.innerHTML = '<div class="error">没有找到应用</div>';
        return;
    }
    
    appCardsContainer.innerHTML = '';
    apps.forEach(app => {
        const appCard = createAppCard(app);
        appCardsContainer.appendChild(appCard);
    });
}

// 创建应用卡片
function createAppCard(app) {
    const card = document.createElement('div');
    card.className = 'app-card';
    
    // 创建应用图标
    const iconDiv = document.createElement('div');
    iconDiv.className = 'app-icon';
    
    // 使用icon字段 - 简化版本
    if (app.icon) {
        const img = document.createElement('img');
        img.src = app.icon;
        img.alt = app.name;
        img.className = 'app-icon-img';
        
        img.onload = function() {
            const successMsg = `图标加载成功: ${app.name}`;
            addLog(successMsg, 'success');
            // 同时将日志发送到后端控制台
            if (isTauri && typeof invokeFunction === 'function') {
                invokeFunction('log_message', { message: successMsg });
            }
            // 清除重试计数
            delete this.dataset.retryCount;
        };
        
        img.onerror = function() {
            const errorMsg = `图标加载失败: ${app.name} - ${app.icon}`;
            addLog(errorMsg, 'error');
            // 同时将日志发送到后端控制台
            if (isTauri && typeof invokeFunction === 'function') {
                invokeFunction('log_message', { message: errorMsg });
            }
            
            // 添加重试机制 - 延迟1秒后重试一次
            if (!this.dataset.retryCount) {
                this.dataset.retryCount = '1';
                setTimeout(() => {
                    addLog(`重试加载图标: ${app.name}`, 'info');
                    this.src = app.icon;
                }, 1000);
            } else {
                // 如果重试后仍然失败，使用默认图标
                addLog(`图标加载失败，使用默认图标: ${app.name}`, 'warning');
                // 使用一个更合适的默认应用图标（盒子/应用图标）
                this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTIiIGZpbGw9IiM2MzY2RjEiLz4KPHBhdGggZD0iTTE2IDIwSDQ4VjQ0SDE2VjIwWk0yMCAyNFY0MEg0NFYyNEgyMFoiIGZpbGw9IndoaXRlIi8+CjxjaXJjbGUgY3g9IjMyIiBjeT0iMzIiIHI9IjgiIGZpbGw9IiNGRkY5QzQiLz4KPC9zdmc+';
            }
        };
        
        iconDiv.appendChild(img);
    } else {
        // 使用更合适的默认应用图标
        iconDiv.innerHTML = `
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="64" height="64" rx="12" fill="#6366F1"/>
                <path d="M16 20H48V44H16V20ZM20 24V40H44V24H20Z" fill="white"/>
                <circle cx="32" cy="32" r="8" fill="#FFF9C4"/>
            </svg>
        `;
    }
    
    // 创建应用信息
    const infoDiv = document.createElement('div');
    infoDiv.className = 'app-info';
    
    const nameDiv = document.createElement('h3');
    nameDiv.textContent = app.name;
    nameDiv.title = app.name;
    
    const descDiv = document.createElement('p');
    descDiv.textContent = app.description || '暂无描述';
    
    // 创建操作按钮
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'app-actions';

    // 根据安装方式添加按钮
    if (app.install_method === 'manual' || app.install_method === '手动安装') {
        // 手动安装 - 显示下载按钮
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'action-button download-button';
        downloadBtn.textContent = '下载';
        downloadBtn.addEventListener('click', () => {
            // 获取下载信息
            const { downloadUrl, filename } = getAppDownloadInfo(app);
            
            if (isTauri) {
                // 显示进度条
                showProgress(downloadBtn);
                
                if (app.download_type === '本机上传') {
                    invokeFunction('download_file', { url: downloadUrl, filename: filename })
                        .then(() => {
                            hideProgress(downloadBtn);
                            addLog(`${app.name} 下载完成`, 'success');
                        })
                        .catch(error => {
                            hideProgress(downloadBtn);
                            addLog(`${app.name} 下载失败: ${error}`, 'error');
                        });
                } else {
                    invokeFunction('open_external_link', { url: downloadUrl });
                    hideProgress(downloadBtn);
                }
            } else {
                if (app.download_type === '本机上传') {
                    // 浏览器环境下的下载
                    const a = document.createElement('a');
                    a.href = downloadUrl;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                } else {
                    window.open(downloadUrl, '_blank');
                }
                addLog(`开始下载: ${app.name} (${filename})`);
            }
        });
        actionsDiv.appendChild(downloadBtn);
    } else if (app.install_method === 'silent' || app.install_method === '静默安装') {
        // 静默安装 - 显示安装按钮
        const installBtn = document.createElement('button');
        installBtn.className = 'action-button install-button';
        installBtn.textContent = '安装';
        installBtn.addEventListener('click', async () => {
            // 获取下载信息
            const { downloadUrl, filename } = getAppDownloadInfo(app);
            
            if (isTauri) {
                try {
                    // 显示进度条
                    showProgress(installBtn);
                    addLog(`开始安装: ${app.name}`);
                    
                    const result = await invokeFunction('silent_install', { 
                        appName: app.name,
                        downloadUrl: downloadUrl,
                        filename: filename,
                        installParams: app.install_params || '/S'
                    });
                    
                    hideProgress(installBtn);
                    addLog(`${app.name} 安装完成`, 'success');
                } catch (error) {
                    hideProgress(installBtn);
                    addLog(`${app.name} 安装失败: ${error}`, 'error');
                }
            } else {
                alert(`浏览器环境不支持自动安装 ${app.name}\n请下载后手动安装`);
            }
        });
        actionsDiv.appendChild(installBtn);
    } else {
        // 其他情况 - 根据下载类型添加下载按钮
        if ((app.download_type === 'external_link' || app.download_type === '本机上传') && app.external_link) {
            // 获取下载信息
            const { downloadUrl, filename } = getAppDownloadInfo(app);
            
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'action-button download-button';
            downloadBtn.textContent = '下载';
            downloadBtn.addEventListener('click', () => {
                if (isTauri) {
                    if (app.download_type === '本机上传') {
                        invokeFunction('download_file', { url: downloadUrl, filename: filename });
                    } else {
                        invokeFunction('open_external_link', { url: downloadUrl });
                    }
                } else {
                    if (app.download_type === '本机上传') {
                        // 浏览器环境下的下载
                        const a = document.createElement('a');
                        a.href = downloadUrl;
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    } else {
                        window.open(downloadUrl, '_blank');
                    }
                }
                addLog(`开始下载: ${app.name} (${filename})`);
            });
            actionsDiv.appendChild(downloadBtn);
        }
    }

    if (app.website_link) {
        const websiteBtn = document.createElement('button');
        websiteBtn.className = 'action-button website-button';
        websiteBtn.textContent = '官网';
        websiteBtn.addEventListener('click', () => {
            if (isTauri) {
                invokeFunction('open_external_link', { url: app.website_link }); 
            } else {
                window.open(app.website_link, '_blank');
            }
            addLog(`打开官网链接: ${app.website_link}`);
        });
        actionsDiv.appendChild(websiteBtn);
    }
    
    // 组装卡片
    infoDiv.appendChild(nameDiv);
    infoDiv.appendChild(descDiv);
    
    card.appendChild(iconDiv);
    card.appendChild(infoDiv);
    card.appendChild(actionsDiv);
    
    return card;
}

// 显示进度条
function showProgress(button) {
    button.disabled = true;
    button.innerHTML = '<span class="progress-spinner"></span> 处理中...';
    button.classList.add('progress');
}

// 隐藏进度条
function hideProgress(button) {
    button.disabled = false;
    // 恢复原始按钮文本
    if (button.classList.contains('download-button')) {
        button.textContent = '下载';
    } else if (button.classList.contains('install-button')) {
        button.textContent = '安装';
    }
    button.classList.remove('progress');
}

// 渲染网站导航
function renderWebsiteNavs() {
    navList.innerHTML = '';
    
    // 确保websiteNavs是数组并且有数据
    if (!Array.isArray(websiteNavs) || websiteNavs.length === 0) {
        navList.innerHTML = '<div class="no-navs">暂无网站导航数据</div>';
        return;
    }
    
    websiteNavs.forEach(nav => {
        // 验证导航项数据格式
        if (!nav || !nav.name || !nav.url) {
            console.warn('无效的导航项:', nav);
            return;
        }
        
        const navLink = document.createElement('a');
        navLink.className = 'nav-link';
        navLink.href = '#';
        navLink.textContent = nav.name;
        navLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (isTauri) {
                invokeFunction('open_external_link', { url: nav.url });
            } else {
                window.open(nav.url, '_blank');
            }
            addLog(`打开网站导航: ${nav.name} (${nav.url})`);
        });
        navList.appendChild(navLink);
    });
}

// 显示加载状态
function showLoading() {
    appCardsContainer.innerHTML = '<p id="loading-message">正在从服务器加载数据...</p>';
}

// 显示错误信息
function showError(message) {
    appCardsContainer.innerHTML = `<div class="error">${message}</div>`;
}

// 显示关于对话框
function showAboutDialog() {
    const aboutContent = `
        <h2>关于应用管理器</h2>
        <p>版本: 1.0.0</p>
        <p>这是一个基于Tauri的桌面应用管理器，用于管理和下载各种应用程序。</p>
        <p>功能特点:</p>
        <ul>
            <li>应用分类浏览</li>
            <li>应用搜索</li>
            <li>一键下载和访问官网</li>
            <li>常用网站导航</li>
            <li>操作日志记录</li>
        </ul>
    `;
    
    // 创建关于对话框
    const aboutModal = document.createElement('div');
    aboutModal.className = 'modal';
    aboutModal.style.display = 'block';
    aboutModal.innerHTML = `
        <div class="modal-content">
            <span class="close-button about-close">&times;</span>
            ${aboutContent}
        </div>
    `;
    
    document.body.appendChild(aboutModal);
    
    // 添加关闭事件
    aboutModal.querySelector('.about-close').addEventListener('click', () => {
        document.body.removeChild(aboutModal);
    });
    
    // 点击模态框外部关闭
    aboutModal.addEventListener('click', (event) => {
        if (event.target === aboutModal) {
            document.body.removeChild(aboutModal);
        }
    });
    
    addLog("显示关于对话框");
}

// 从URL或路径中提取文件名
function getFilenameFromUrl(url, fallbackName) {
    if (!url) return fallbackName;
    
    // 从URL中提取文件名部分
    let filename = url.split('/').pop().split('?')[0];
    
    // 解码URL编码的字符（如中文）
    try {
        filename = decodeURIComponent(filename);
    } catch (e) {
        console.warn('文件名解码失败:', filename, e);
        // 如果解码失败，使用原始文件名
    }
    
    // 如果文件名为空或无效，使用fallback
    if (!filename || filename.length < 3) {
        return fallbackName;
    }
    
    return filename;
}

// 获取应用下载信息
function getAppDownloadInfo(app) {
    let downloadUrl = '';
    let filename = '';
    
    const downloadType = app.download_type;
    
    // 根据下载类型确定下载URL和文件名
    if ((downloadType === '外部链接' || downloadType === 'external_link') && app.external_link) {
        downloadUrl = app.external_link;
        filename = getFilenameFromUrl(downloadUrl, `${app.name}.exe`);
    } else if (downloadType === '本机上传' && app.uploaded_file_url) {
        downloadUrl = app.uploaded_file_url;
        filename = getFilenameFromUrl(downloadUrl, `${app.name}.exe`);
    } else if (downloadType === '手动选择服务器文件' && app.server_file_path) {
        // 构造服务器文件下载API URL，确保包含完整的API路径
        // 如果currentApiEndpoint已经是完整的API地址（包含/api/v1/applications/），需要替换为下载接口
        if (currentApiEndpoint.includes('/api/v1/applications/')) {
            downloadUrl = currentApiEndpoint.replace('/api/v1/applications/', '/download/server-file?path=') + encodeURIComponent(app.server_file_path);
        } else {
            downloadUrl = `${currentApiEndpoint}download/server-file?path=${encodeURIComponent(app.server_file_path)}`;
        }
        // 从服务器路径中提取文件名
        filename = app.server_file_path.split(/[\/\\]/).pop();
    } else {
        // 如果没有匹配的下载类型，尝试使用任何可用的链接
        if (app.external_link) {
            downloadUrl = app.external_link;
            filename = getFilenameFromUrl(downloadUrl, `${app.name}.exe`);
        } else if (app.uploaded_file_url) {
            downloadUrl = app.uploaded_file_url;
            filename = getFilenameFromUrl(downloadUrl, `${app.name}.exe`);
        } else if (app.server_file_path) {
            // 最后尝试服务器文件路径
            if (currentApiEndpoint.includes('/api/v1/applications/')) {
                downloadUrl = currentApiEndpoint.replace('/api/v1/applications/', '/download/server-file?path=') + encodeURIComponent(app.server_file_path);
            } else {
                downloadUrl = `${currentApiEndpoint}download/server-file?path=${encodeURIComponent(app.server_file_path)}`;
            }
            filename = app.server_file_path.split(/[\/\\]/).pop();
        }
    }
    
    // 确保文件名有效
    if (!filename || filename.length < 3) {
        filename = `${app.name}.exe`;
    }
    
    // 如果下载URL仍然为空，记录错误并返回一个默认值
    if (!downloadUrl) {
        console.error(`无法获取应用 ${app.name} 的下载链接`, app);
        addLog(`无法获取应用 ${app.name} 的下载链接，请检查应用配置`, 'error');
        // 返回一个默认的URL，避免"relative URL without a base"错误
        downloadUrl = 'about:blank';
    }
    
    return { downloadUrl, filename };
}

// 打开下载目录
function openDownloadsDirectory() {
    if (isTauri) {
        invokeFunction('open_download_directory', { filename: '' })
            .then(() => {
                addLog(`已打开下载目录`, 'success');
            })
            .catch(error => {
                addLog(`打开下载目录失败: ${error}`, 'error');
            });
    } else {
        addLog(`浏览器环境不支持打开下载目录`, 'error');
    }
}