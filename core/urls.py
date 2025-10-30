# 文件路径: core/urls.py (更新)

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views 
from . import files 

# 创建一个路由器来自动处理 ViewSet 的 URL
router = DefaultRouter()
router.register(r'applications', views.ApplicationViewSet, basename='application') 
# 【新增】注册 WebsiteNavigation 视图集
router.register(r'navigation', views.WebsiteNavigationViewSet, basename='navigation') 

urlpatterns = [
    # 首页路由
    path('', views.index_view, name='index'), 
    
    # Admin 文件选择器 API
    path('admin/uploaded-files/', files.get_uploaded_files, name='uploaded_files_api'),
    
    # API V1 路由
    path('api/v1/', include(router.urls)),
    
    # 【新增】服务器文件下载路由
    path('download/server-file/', files.download_server_file, name='download_server_file'),
]