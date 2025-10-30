# ----------------------------------------------------------------------
# 阶段 1: 构建阶段 (用于安装依赖)
# 使用最新的官方 Python 瘦身版镜像作为基础，以减小体积
# ----------------------------------------------------------------------
FROM python:3.11-slim as builder

# 设置工作目录
WORKDIR /app

# 设置环境变量
# 阻止 Python 生成 .pyc 文件
ENV PYTHONDONTWRITEBYTECODE 1
# 确保 Python 输出不缓存
ENV PYTHONUNBUFFERED 1

# 复制 requirements.txt 文件并安装依赖
# 这一步单独进行可以利用 Docker 的缓存机制 (如果 requirements.txt 没有变化，则跳过安装)
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt


# ----------------------------------------------------------------------
# 阶段 2: 最终运行阶段 (使用精简镜像运行服务)
# ----------------------------------------------------------------------
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 复制构建阶段安装的依赖到最终镜像
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

# 复制整个项目代码到容器中
# 确保您创建了 .dockerignore 文件，以排除 venv, media 等不必要文件
COPY . /app/

# 设置默认环境变量 (项目名称已确认：AppManager)
ENV DJANGO_SETTINGS_MODULE=AppManager.settings
ENV PORT=8000

# 暴露 Django 默认端口
EXPOSE 8000

# ----------------------------------------------------------------------
# 启动命令 (请根据您的部署需求选择一个)
# ----------------------------------------------------------------------

# 选项 A: 生产环境推荐 (需要先在 requirements.txt 中安装 gunicorn)
# CMD ["gunicorn", "--bind", "0.0.0.0:8000", "AppManager.wsgi:application"]

# 选项 B: 调试/测试环境 (使用 Django 内置的 runserver)
# 注意: runserver 不适合用于生产环境
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# ----------------------------------------------------------------------
# 部署前提醒:
# 在生产环境中运行前，您通常需要执行数据库迁移和静态文件收集命令:
# docker exec [容器名] python manage.py migrate
# docker exec [容器名] python manage.py collectstatic --noinput
# ----------------------------------------------------------------------