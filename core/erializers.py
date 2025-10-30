# 文件: core/serializers.py

from rest_framework import serializers
from .models import Category, Application, WebsiteNavigation
from django.conf import settings

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class ApplicationSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    
    # 确保 logo 和上传文件返回完整的 URL
    logo = serializers.SerializerMethodField()
    uploaded_file = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = ['id', 'name', 'version', 'category', 'short_description', 
                  'install_method', 'download_type', 'external_link', 
                  'uploaded_file', 'server_file_path', 'logo']
        
    def get_logo(self, obj):
        # 使用 request context 构建完整的绝对 URL
        request = self.context.get('request')
        if obj.logo and request:
            return request.build_absolute_uri(obj.logo.url)
        return None

    def get_uploaded_file(self, obj):
        request = self.context.get('request')
        if obj.uploaded_file and request:
            return request.build_absolute_uri(obj.uploaded_file.url)
        return None

class WebsiteNavigationSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebsiteNavigation
        fields = ['id', 'name', 'url', 'order']