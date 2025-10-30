# 基础镜像
FROM python:3.11-slim

# 设置环境变量，阻止Python将输出缓冲到管道
ENV PYTHONUNBUFFERED 1
# 设置工作目录
WORKDIR /app

# 将依赖文件复制到容器
COPY requirements.txt /app/

# 安装依赖
RUN pip install --no-cache-dir -r requirements.txt

# 将项目代码复制到容器
COPY . /app/

# 收集静态文件 (如果您的 Django App 需要)
RUN python manage.py collectstatic --noinput

# 暴露 Django 默认端口 8000
EXPOSE 8000

# 启动 Gunicorn 或 Uvicorn (生产环境推荐)
# 假设您使用 Gunicorn
CMD ["gunicorn", "your_project_name.wsgi:application", "--bind", "0.0.0.0:8000"]

# 如果是简单的测试环境，也可以直接使用 runserver:
# CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]