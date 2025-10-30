from django.contrib import admin
from django.urls import path

# 导入配置
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    # ... 其他应用 URL ...
]

# 在开发模式下，提供媒体文件服务 (用户上传的文件)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)