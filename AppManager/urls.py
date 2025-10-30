# 文件路径: AppManager/urls.py

from django.contrib import admin
from django.urls import path, include 
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Admin 文件选择器 URL (用于 admin.py 中的 Media 配置)
    path('admin/core/', include('core.urls')), 
    
    # 💥 关键：将根 URL (/) 指向 core 应用的 urls，包含 API 和前端页面
    path('', include('core.urls')), 
]

# 在开发模式下，提供媒体文件服务 (如 Logo)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)