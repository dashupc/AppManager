# 文件路径: core/views.py (完整代码)

from django.shortcuts import render
from rest_framework import viewsets
from .models import Application, Category, WebsiteNavigation # 确保导入了所有模型
from .serializers import ApplicationSerializer, WebsiteNavigationSerializer 
# from .files import download_server_file # 如果您需要在这里直接调用，但通常在 urls.py 中引入即可


# =========================================================
# 网页视图 (现在使用 Server-Side Rendering / SSR)
# =========================================================
def index_view(request):
    """
    渲染应用列表的主页，并进行服务器端渲染。
    数据获取、分组和排序都在这里完成。
    """
    # 1. 获取所有应用，并预取其分类 (避免 N+1 查询)
    # 按照分类的 order 和应用的 order 进行排序
    applications = Application.objects.all().select_related('category').order_by('category__order', 'order')

    # 2. Python 逻辑：按分类名称分组
    grouped_apps = {}
    
    # 遍历所有应用进行分组
    for app in applications:
        # 🌟 关键：安全地获取分类名称，处理 category 为 None 的情况
        category_name = app.category.name if app.category else '未分类'
        
        if category_name not in grouped_apps:
            grouped_apps[category_name] = []
            
        grouped_apps[category_name].append(app)
    
    # 3. 将字典转换为有序的列表 [(category_name, app_list)]，
    # 确保分类的显示顺序是正确的。
    final_data_list = []
    
    # A. 先按数据库中的 Category order 排序 (只处理有定义的分类)
    for category in Category.objects.all().order_by('order'):
        if category.name in grouped_apps:
            # 将该分类添加到最终列表，并从 grouped_apps 中移除
            final_data_list.append((category.name, grouped_apps.pop(category.name)))
            
    # B. 最后添加剩余的 "未分类" 组（如果存在）
    if '未分类' in grouped_apps:
        final_data_list.append(('未分类', grouped_apps['未分类']))

    context = {
        # 'grouped_apps' 是模板中要使用的变量
        'grouped_apps': final_data_list, 
    }

    return render(request, 'core/index.html', context)


# =========================================================
# API 视图 (Django REST Framework, 保持不变)
# =========================================================

class ApplicationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    提供 Application 模型的只读 API 接口。
    """
    queryset = Application.objects.all().order_by('category', 'order')
    serializer_class = ApplicationSerializer


# 网站导航 API 接口
class WebsiteNavigationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    提供 WebsiteNavigation 模型的只读 API 接口。
    """
    # 确保缩进正确，解决了上次的 IndentationError
    queryset = WebsiteNavigation.objects.all().order_by('order')
    serializer_class = WebsiteNavigationSerializer