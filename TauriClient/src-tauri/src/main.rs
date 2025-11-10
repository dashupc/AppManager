// Prevents additional console window on Windows in release, DO NOT REMOVE!!
// 在开发环境中注释掉这行，以便看到控制台输出
// #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ApiApplication {
    id: i32,
    name: String,
    version: Option<String>,  // 改为可选
    category: Category,
    short_description: Option<String>,  // 改为可选
    download_type: String,
    external_link: Option<String>,
    server_file_path: Option<String>,
    logo_url: Option<String>,
    icon: Option<String>,  // 添加icon字段
    uploaded_file_url: Option<String>,
    install_method: String,
}

// 更宽松的结构，用于处理可能为null的字段
#[derive(Debug, Serialize, Deserialize, Clone)]
struct LooseApiApplication {
    id: i32,
    name: Option<String>,
    version: Option<String>,
    category: Option<Category>,
    short_description: Option<String>,
    download_type: Option<String>,
    external_link: Option<String>,
    server_file_path: Option<String>,
    logo_url: Option<String>,
    icon: Option<String>,  // 添加icon字段
    uploaded_file_url: Option<String>,
    install_method: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Category {
    name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct WebsiteNavigation {
    id: i32,
    name: String,
    url: String,
    order: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Application {
    id: i32,
    name: String,
    description: String,
    icon: Option<String>,
    download_type: String,
    external_link: Option<String>,
    website_link: Option<String>,
    category_name: String,
    install_method: String,
    install_params: Option<String>,
}

// 将API数据转换为前端需要的格式
fn convert_api_to_app(api_app: &ApiApplication) -> Application {
    // 确定下载链接
    let download_link = if api_app.download_type == "本机上传" {
        api_app.uploaded_file_url.clone()
    } else {
        api_app.external_link.clone()
    };
    
    // 优先使用icon字段，如果不存在则使用logo_url
    let icon_url = api_app.icon.clone().or_else(|| api_app.logo_url.clone());
    
    // 添加调试日志
    println!("Converting app: {}, icon: {:?}, logo_url: {:?}, final icon_url: {:?}", 
             api_app.name, api_app.icon, api_app.logo_url, icon_url);
    
    Application {
        id: api_app.id,
        name: api_app.name.clone(),
        description: api_app.short_description.clone().unwrap_or_default(),
        icon: icon_url,
        download_type: api_app.download_type.clone(),
        external_link: download_link.clone(),
        website_link: None, // API中没有website_link字段
        category_name: api_app.category.name.clone(),
        install_method: api_app.install_method.clone(),
        install_params: if api_app.install_method == "静默安装" { Some("/S".to_string()) } else { None },
    }
}

// 将宽松结构转换为前端需要的格式
fn convert_loose_to_app(loose_app: &LooseApiApplication) -> Application {
    // 确定下载链接
    let download_link = match loose_app.download_type.as_ref().map(|s| s.as_str()) {
        Some("本机上传") => loose_app.uploaded_file_url.clone(),
        Some("外部链接") => loose_app.external_link.clone(),
        Some("external_link") => loose_app.external_link.clone(),
        _ => loose_app.external_link.clone().or(loose_app.uploaded_file_url.clone())
    };
    
    // 优先使用icon字段，如果不存在则使用logo_url
    let icon_url = loose_app.icon.clone().or_else(|| loose_app.logo_url.clone());
    
    Application {
        id: loose_app.id,
        name: loose_app.name.clone().unwrap_or_default(),
        description: loose_app.short_description.clone().unwrap_or_default(),
        icon: icon_url,
        download_type: loose_app.download_type.clone().unwrap_or_default(),
        external_link: download_link.clone(),
        website_link: None, // API中没有website_link字段
        category_name: loose_app.category.as_ref().map(|c| c.name.clone()).unwrap_or_default(),
        install_method: loose_app.install_method.clone().unwrap_or_default(),
        install_params: if loose_app.install_method.as_ref().map(|s| s.as_str()) == Some("静默安装") { 
            Some("/S".to_string()) 
        } else { 
            None 
        },
    }
}

#[tauri::command]
async fn log_message(message: String) -> Result<(), String> {
    println!("Frontend Log: {}", message);
    Ok(())
}

#[tauri::command]
async fn get_applications() -> Result<Vec<Application>, String> {
    println!("get_applications called");
    
    // 从API获取数据
    let url = "http://vip.itvip.com.cn:8000/api/v1/applications/";
    
    match reqwest::get(url).await {
        Ok(response) => {
            if !response.status().is_success() {
                return Err(format!("API request failed with status: {}", response.status()));
            }
            
            // 获取响应文本，以便调试
            let response_text = response.text().await.map_err(|e| format!("Failed to get response text: {}", e))?;
            println!("Raw API response: {}", response_text);
            
            // 尝试解析JSON
            match serde_json::from_str::<Vec<ApiApplication>>(&response_text) {
                Ok(api_apps) => {
                    println!("Successfully fetched {} applications from API", api_apps.len());
                    let apps: Vec<Application> = api_apps.iter().map(convert_api_to_app).collect();
                    Ok(apps)
                }
                Err(e) => {
                    println!("Failed to parse API response: {}", e);
                    
                    // 尝试解析为更宽松的结构，查看哪些字段可能为null
                    match serde_json::from_str::<Vec<LooseApiApplication>>(&response_text) {
                        Ok(loose_apps) => {
                            println!("Successfully parsed with loose structure");
                            let apps: Vec<Application> = loose_apps.iter().filter_map(|app| {
                                // 确保所有必需字段都存在
                                if app.name.is_some() && app.category.is_some() && 
                                   app.short_description.is_some() && app.download_type.is_some() &&
                                   app.install_method.is_some() {
                                    Some(convert_loose_to_app(app))
                                } else {
                                    println!("Skipping app with missing required fields: {:?}", app);
                                    None
                                }
                            }).collect();
                            Ok(apps)
                        }
                        Err(e2) => {
                            println!("Failed to parse with loose structure too: {}", e2);
                            Err(format!("Failed to parse API response: {}", e))
                        }
                    }
                }
            }
        }
        Err(e) => {
            println!("Failed to fetch data from API: {}", e);
            
            // 如果API请求失败，返回一些模拟数据作为后备
            println!("Using fallback mock data");
            let apps = vec![
                Application {
                    id: 1,
                    name: "示例应用1".to_string(),
                    description: "这是一个示例应用，用于测试UI".to_string(),
                    icon: None,
                    download_type: "external_link".to_string(),
                    external_link: Some("https://example.com/download1".to_string()),
                    website_link: Some("https://example.com/app1".to_string()),
                    category_name: "工具".to_string(),
                    install_method: "manual".to_string(),
                    install_params: None,
                },
                Application {
                    id: 2,
                    name: "示例应用2".to_string(),
                    description: "这是另一个示例应用".to_string(),
                    icon: None,
                    download_type: "external_link".to_string(),
                    external_link: Some("https://example.com/download2".to_string()),
                    website_link: Some("https://example.com/app2".to_string()),
                    category_name: "游戏".to_string(),
                    install_method: "silent".to_string(),
                    install_params: Some("/S".to_string()),
                },
            ];
            
            Ok(apps)
        }
    }
}

#[tauri::command]
async fn get_website_navigation() -> Result<Vec<WebsiteNavigation>, String> {
    println!("get_website_navigation called");
    
    // 从API获取数据
    let url = "http://vip.itvip.com.cn:8000/api/v1/navigation/";
    
    match reqwest::get(url).await {
        Ok(response) => {
            if !response.status().is_success() {
                return Err(format!("API request failed with status: {}", response.status()));
            }
            
            // 获取响应文本，以便调试
            let response_text = response.text().await.map_err(|e| format!("Failed to get response text: {}", e))?;
            println!("Raw navigation API response: {}", response_text);
            
            // 尝试解析JSON
            match serde_json::from_str::<Vec<WebsiteNavigation>>(&response_text) {
                Ok(nav_items) => {
                    println!("Successfully fetched {} navigation items from API", nav_items.len());
                    Ok(nav_items)
                }
                Err(e) => {
                    println!("Failed to parse navigation API response: {}", e);
                    
                    // 如果API请求失败，返回一些默认导航数据作为后备
                    println!("Using fallback navigation data");
                    let navs = vec![
                        WebsiteNavigation {
                            id: 1,
                            name: "GitHub".to_string(),
                            url: "https://github.com".to_string(),
                            order: 1,
                        },
                        WebsiteNavigation {
                            id: 2,
                            name: "Stack Overflow".to_string(),
                            url: "https://stackoverflow.com".to_string(),
                            order: 2,
                        },
                        WebsiteNavigation {
                            id: 3,
                            name: "MDN Web Docs".to_string(),
                            url: "https://developer.mozilla.org".to_string(),
                            order: 3,
                        },
                    ];
                    
                    Ok(navs)
                }
            }
        }
        Err(e) => {
            println!("Failed to fetch navigation data from API: {}", e);
            
            // 如果API请求失败，返回一些默认导航数据作为后备
            println!("Using fallback navigation data");
            let navs = vec![
                WebsiteNavigation {
                    id: 1,
                    name: "GitHub".to_string(),
                    url: "https://github.com".to_string(),
                    order: 1,
                },
                WebsiteNavigation {
                    id: 2,
                    name: "Stack Overflow".to_string(),
                    url: "https://stackoverflow.com".to_string(),
                    order: 2,
                },
                WebsiteNavigation {
                    id: 3,
                    name: "MDN Web Docs".to_string(),
                    url: "https://developer.mozilla.org".to_string(),
                    order: 3,
                },
            ];
            
            Ok(navs)
        }
    }
}

#[tauri::command]
async fn open_external_link(url: String) -> Result<(), String> {
    println!("open_external_link called with URL: {}", url);

    // 使用Tauri内置的shell插件打开链接
    #[cfg(not(target_os = "macos"))]
    {
        use std::process::Command;

        #[cfg(target_os = "windows")]
        {
            Command::new("cmd")
                .args(&["/C", "start", &url])
                .spawn()
                .map_err(|e| format!("Failed to open URL: {}", e))?;
        }

        #[cfg(target_os = "linux")]
        {
            Command::new("xdg-open")
                .arg(&url)
                .spawn()
                .map_err(|e| format!("Failed to open URL: {}", e))?;
        }
    }

    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| format!("Failed to open URL: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
async fn open_download_directory(filename: Option<String>, state: tauri::State<'_, AppState>) -> Result<String, String> {
    println!("open_download_directory called with filename: {:?}", filename);
    
    // 获取下载目录
    let download_dir = dirs::download_dir()
        .ok_or_else(|| "无法获取下载目录".to_string())?;
    
    let path_str = download_dir.to_string_lossy().to_string();
    
    // 如果提供了文件名，则选中该文件；否则只打开目录
    if let Some(file) = filename {
        if !file.is_empty() {
            let file_path = download_dir.join(&file);
            let file_path_str = file_path.to_string_lossy().to_string();
            
            // 使用内部函数打开目录
            open_download_directory_inner(&file_path_str, &state.inner())
                .map_err(|e| format!("打开下载目录失败: {}", e))?;
            
            println!("已打开下载目录并选中文件: {}", file_path_str);
            return Ok(file_path_str);
        }
    }
    
    // 只打开下载目录
    // 检查是否是同一个目录
    {
        let mut last_dir = state.last_opened_dir.lock().unwrap();
        if let Some(ref last) = *last_dir {
            if last == &path_str {
                println!("下载目录已打开，跳过重复打开: {}", path_str);
                return Ok(path_str);
            }
        }
        // 更新最后打开的目录
        *last_dir = Some(path_str.clone());
    }
    
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        Command::new("explorer")
            .arg(&download_dir)
            .spawn()
            .map_err(|e| format!("无法打开下载目录: {}", e))?;
    }
    
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        Command::new("open")
            .arg(&download_dir)
            .spawn()
            .map_err(|e| format!("无法打开下载目录: {}", e))?;
    }
    
    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        Command::new("xdg-open")
            .arg(&download_dir)
            .spawn()
            .map_err(|e| format!("无法打开下载目录: {}", e))?;
    }
    
    println!("已打开下载目录: {}", path_str);
    Ok(path_str)
}

use std::sync::{Arc, Mutex};

// 全局状态，用于跟踪最近打开的目录
struct AppState {
    last_opened_dir: Arc<Mutex<Option<String>>>,
}

// 内部函数：打开下载目录
fn open_download_directory_inner(file_path: &str, state: &AppState) -> Result<(), Box<dyn std::error::Error>> {
    // 获取文件所在目录
    let dir_path = std::path::Path::new(file_path)
        .parent()
        .ok_or("无法获取文件所在目录")?
        .to_string_lossy()
        .to_string();
    
    // 检查是否是同一个目录
    {
        let mut last_dir = state.last_opened_dir.lock().unwrap();
        if let Some(ref last) = *last_dir {
            if last == &dir_path {
                println!("下载目录已打开，跳过重复打开: {}", dir_path);
                return Ok(());
            }
        }
        // 更新最后打开的目录
        *last_dir = Some(dir_path.clone());
    }
    
    // 打开目录
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .args(["/select,", file_path])
            .spawn()?;
    }
    
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .args(["-R", file_path])
            .spawn()?;
    }
    
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&dir_path)
            .spawn()?;
    }
    
    println!("已打开下载目录: {}", dir_path);
    Ok(())
}

#[tauri::command]
async fn download_file(url: String, filename: String, state: tauri::State<'_, AppState>) -> Result<String, String> {
    println!("download_file called with URL: {}, filename: {}", url, filename);
    
    // 检查URL是否有效
    if url.is_empty() || url == "about:blank" {
        return Err("下载链接无效或为空，请检查应用配置".to_string());
    }
    
    // 检查URL是否是有效的HTTP/HTTPS URL
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Err(format!("无效的下载链接格式: {}", url));
    }
    
    // 解码URL编码的文件名（处理中文乱码问题）
    let decoded_filename = match percent_encoding::percent_decode(filename.as_bytes()).decode_utf8() {
        Ok(decoded) => decoded.to_string(),
        Err(_) => {
            println!("警告: 文件名解码失败，使用原始文件名: {}", filename);
            filename
        }
    };
    
    // 获取下载目录
    let download_dir = dirs::download_dir()
        .ok_or_else(|| "无法获取下载目录".to_string())?;
    
    let file_path = download_dir.join(&decoded_filename);
    
    // 下载文件
    let response = reqwest::get(&url)
        .await
        .map_err(|e| format!("下载请求失败: {}", e))?;
    
    let bytes = response.bytes()
        .await
        .map_err(|e| format!("读取响应内容失败: {}", e))?;
    
    // 保存文件
    tokio::fs::write(&file_path, bytes)
        .await
        .map_err(|e| format!("保存文件失败: {}", e))?;
    
    let path_str = file_path.to_string_lossy().to_string();
    println!("文件已下载到: {}", path_str);
    
    // 下载完成后自动打开下载目录
    if let Err(e) = open_download_directory_inner(&path_str, &state.inner()) {
        eprintln!("打开下载目录失败: {}", e);
    }
    
    Ok(path_str)
}

#[tauri::command]
async fn show_install_guide(app_name: String, install_method: String, _install_params: Option<String>) -> Result<String, String> {
    println!("show_install_guide called for app: {}, method: {}", app_name, install_method);
    
    let guide = match install_method.as_str() {
        "manual" | "手动安装" => {
            format!(
                "手动安装指南:\n\n1. 下载 {} 安装程序\n2. 双击运行安装程序\n3. 按照安装向导完成安装\n4. 安装完成后可以从开始菜单启动应用",
                app_name
            )
        },
        _ => format!("未知的安装方式: {}", install_method)
    };
    
    Ok(guide)
}

#[tauri::command]
async fn silent_install(app_name: String, download_url: String, filename: String, install_params: String, state: tauri::State<'_, AppState>) -> Result<String, String> {
    println!("silent_install called for app: {}, url: {}, filename: {}, params: {}", app_name, download_url, filename, install_params);
    
    // 检查下载URL是否有效
    if download_url.is_empty() || download_url == "about:blank" {
        return Err("下载链接无效或为空，无法进行静默安装".to_string());
    }
    
    // 检查URL是否是有效的HTTP/HTTPS URL
    if !download_url.starts_with("http://") && !download_url.starts_with("https://") {
        return Err(format!("无效的下载链接格式: {}", download_url));
    }
    
    // 1. 下载文件
    let file_path = download_file(download_url, filename, state).await?;
    let file_path_str = file_path.clone();
    
    // 2. 静默安装
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        
        let output = Command::new("cmd")
            .args(&["/C", &file_path_str, &install_params])
            .output()
            .map_err(|e| format!("执行安装命令失败: {}", e))?;
        
        if output.status.success() {
            Ok(format!("{} 已成功静默安装", app_name))
        } else {
            let error_msg = String::from_utf8_lossy(&output.stderr);
            Err(format!("安装失败: {}", error_msg))
        }
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        Err("静默安装目前仅支持Windows系统".to_string())
    }
}

fn main() {
    println!("Starting Tauri application...");
    
    // 初始化应用状态
    let app_state = AppState {
        last_opened_dir: Arc::new(Mutex::new(None)),
    };
    
    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            log_message,
            get_applications, 
            get_website_navigation,
            open_external_link,
            download_file,
            open_download_directory,
            show_install_guide,
            silent_install
        ])
        .setup(|_app| {
            println!("Tauri app setup completed");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}