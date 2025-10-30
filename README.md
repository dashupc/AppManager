# 🚀 应用管理客户端 (App Manager Client & Django Backend)

本项目是一个跨平台的应用管理系统，由 **Django REST Framework** 提供 API 后端服务，并使用 **Electron (或 PWA)** 作为客户端前端，旨在提供一个简洁、集中的应用导航和管理界面。

---

## ✨ 项目特性

* **技术栈分离：** 采用前后端分离架构，便于扩展和维护。
* **跨平台客户端：** Electron 客户端支持 Windows 7/10 免安装运行（单文件便携版）。
* **集中化管理：** 通过 Django Admin 统一管理应用及其分类数据。
* **Docker 部署：** 后端服务提供完整的 Docker 部署方案，快速启动。

---

## 🛠️ 技术栈

| 模块 | 技术 | 版本/描述 |
| :--- | :--- | :--- |
| **后端** | Python | 3.11+ |
| **后端** | Django | 3.2.x LTS 版本 |
| **API** | Django REST Framework | 用于构建 RESTful API |
| **容器化** | Docker | 容器化部署方案 |
| **客户端** | Electron | ~22.0.0 (兼容 Windows 7) |
| **客户端** | JavaScript/HTML/CSS | 客户端核心逻辑与界面 |
| **打包** | electron-builder | 用于生成 Win7/Win10 便携版 EXE |

---

## 📦 环境搭建与部署

本项目推荐使用 **Docker** 进行后端服务部署。

### 1. 后端服务部署 (Docker)

确保您的系统已安装 Docker。

#### A. 构建镜像

在包含 `Dockerfile` 的项目根目录下执行：

```bash
docker build -t app-manager-backend:latest .










B. 数据卷准备与迁移
我们需要一个持久化的数据目录（例如 ~/appmanager-data）来存放 db.sqlite3 和 media 文件。

Bash

# 1. 创建数据目录
mkdir -p ~/appmanager-data

# 2. 运行迁移命令以创建 db.sqlite3 文件和 media 文件夹
# 注意：此步骤会创建所需的 db.sqlite3 文件
docker run --rm \
    -v ~/appmanager-data:/app \
    app-manager-backend:latest \
    python manage.py migrate
C. 启动服务
使用精确的文件挂载方式启动服务，以保留容器内代码，同时实现数据持久化。

Bash

docker run -d \
    -p 8000:8000 \
    --name app-manager-container \
    -v ~/appmanager-data/db.sqlite3:/app/db.sqlite3 \
    -v ~/appmanager-data/media:/app/media \
    app-manager-backend:latest \
    python manage.py runserver 0.0.0.0:8000
服务将在 http://localhost:8000 启动。

2. 客户端打包 (生成 EXE)
客户端打包依赖于 Node.js 和 npm。

A. 安装依赖
切换到客户端项目目录 (AppClient/)，并安装依赖：

Bash

cd AppClient
npm install
B. 生成便携版 EXE
运行打包命令，生成兼容 Win7/Win10 的单文件便携版 EXE。生成的文件位于 AppClient/dist/ 目录下。

Bash

npm run build
🔑 后台管理
创建超级用户:

Bash

docker exec -it app-manager-container python manage.py createsuperuser
访问后台: 访问 http://localhost:8000/admin/，使用创建的超级用户登录即可管理数据。

🤝 贡献与许可
本项目采用 ISC 许可证。欢迎任何形式的贡献、反馈和建议！
