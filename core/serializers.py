# 文件路径: core/serializers.py (修复 Logo 和文件的绝对 URL)

from rest_framework import serializers
# 确保导入了正确的模型 (这里假设您有 Application, Category, WebsiteNavigation)
from .models import Application, Category, WebsiteNavigation 


# 1. Category 的序列化器
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['name'] 

# 3. Website Navigation 的序列化器 (假设您在模型中定义了它)
class WebsiteNavigationSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebsiteNavigation
        fields = ['id', 'name', 'url', 'order']


# 2. Application 的序列化器 (核心修复区)
class ApplicationSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True, allow_null=True) 

    # 使用 SerializerMethodField 来手动生成绝对 URL
    logo_url = serializers.SerializerMethodField()
    uploaded_file_url = serializers.SerializerMethodField()
    
    # 确保 install_method 和 download_type 在模型中有定义（或使用 get_FOO_display）
    install_method = serializers.CharField(source='get_install_method_display', read_only=True)
    download_type = serializers.CharField(source='get_download_type_display', read_only=True)


    class Meta:
        model = Application
        fields = [
            'id', 'name', 'version', 'category', 'short_description', 
            # 字段列表应包含所有需要传递给客户端的字段
            'download_type', 'external_link', 'server_file_path', 
            'logo_url', 'uploaded_file_url', 
            'install_method', 
        ]
        
    # 💥 修复点 1: 获取 Logo 的绝对 URL
    def get_logo_url(self, obj):
        request = self.context.get('request')
        if obj.logo and hasattr(obj.logo, 'url') and request:
            # 使用 request.build_absolute_uri 来获取完整的 http://... 链接
            return request.build_absolute_uri(obj.logo.url)
        return None

    # 💥 修复点 2: 获取上传文件的绝对 URL
    def get_uploaded_file_url(self, obj):
        request = self.context.get('request')
        if obj.uploaded_file and hasattr(obj.uploaded_file, 'url') and request:
            # 使用 request.build_absolute_uri 来获取完整的 http://... 链接
            return request.build_absolute_uri(obj.uploaded_file.url)
        return None