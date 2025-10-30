from django.contrib import admin
from django.utils.safestring import mark_safe
from django import forms
# 确保导入了正确的模型
from .models import Category, Application, WebsiteNavigation

# 【新增导入】用于处理 Base64 文件和唯一命名
from django.core.files.base import ContentFile
import base64
import uuid


# =========================================================
# 辅助表单：用于在 Admin 中添加一个临时的“粘贴区域”字段
# =========================================================
class ApplicationAdminForm(forms.ModelForm):
    paste_area = forms.CharField(
        widget=forms.Textarea(attrs={'rows': 3, 'placeholder': '在此处按 Ctrl+V / Cmd+V 粘贴图片截图...'}),
        required=False,
        label="粘贴 Logo 截图",
        help_text="粘贴图片后，它会尝试更新下方的 'Logo' 字段。粘贴成功后，此区域将自动清空。"
    )

    # 【核心修改点 1】新增字段：用于接收 Base64 编码的图片数据 (隐藏字段)
    logo_base64_data = forms.CharField(
        widget=forms.HiddenInput(),
        required=False
    )

    class Meta:
        model = Application
        fields = '__all__'


# ===================
# 2. 应用 Admin 配置 (ApplicationAdmin)
# ===================
@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    form = ApplicationAdminForm 
    
    list_display = (
        'name', 'version', 'category', 'is_recommended', 
        'install_method', 'download_type', 'order', 'created_at' 
    )
    list_filter = ('category', 'is_recommended', 'install_method', 'download_type') 
    search_fields = ('name', 'short_description')
    list_editable = ('order', 'is_recommended')

    # 【核心修改点 2】fieldsets 调整：确保 logo_base64_data 包含在内
    fieldsets = (
        ('基本信息', {
            'fields': ('name', 'version', 'category', 'short_description', 'logo', 'paste_area', 'logo_base64_data') 
        }),
        ('应用安装配置 (安装方式)', { 
            'fields': ('install_method', 'install_params', 'is_recommended', 'order') 
        }),
        ('下载地址配置 (文件来源)', { 
            'description': '请根据选择的下载类型填写对应的地址，其他地址输入框将通过前端JS隐藏。',
            'fields': ('download_type', 'external_link', 'uploaded_file', 'server_file_path')
        }),
    )

    # 【核心修改点 3】覆盖 save_model 来处理 Base64 数据
    def save_model(self, request, obj, form, change):
        logo_base64 = form.cleaned_data.get('logo_base64_data')

        if logo_base64:
            try:
                # 1. 解析 Base64 字符串
                if ';base64,' in logo_base64:
                    format, imgstr = logo_base64.split(';base64,') 
                    ext = format.split('/')[-1] # 提取扩展名，例如 'png' 或 'jpeg'
                else:
                    imgstr = logo_base64
                    ext = 'png' 

                # 2. 解码并创建 ContentFile 对象
                data = ContentFile(base64.b64decode(imgstr))
                
                # 3. 生成唯一文件名
                file_name = f"pasted_logo_{uuid.uuid4()}.{ext}"
                
                # 4. 将文件内容赋值给 logo 字段
                obj.logo.save(file_name, data, save=False)
                
            except Exception as e:
                print(f"ERROR: Failed to process Base64 logo data. Details: {e}")
                pass 

        # 调用父类方法完成模型的保存
        super().save_model(request, obj, form, change)


    class Media:
        js = (
            # 保持您的 jQuery 导入
            'admin/js/vendor/jquery/jquery.js', 
            
            # JS 1: Logo 粘贴预览 (已更新为 Base64 传输)
            'admin/js/paste_upload.js', 
            # JS 2: 下载类型切换逻辑
            'admin/js/download_logic.js', 
            # JS 3: 安装参数切换逻辑
            'admin/js/install_params_logic.js', 
            # JS 4: 文件选择器
            'admin/js/file_picker.js', 
        )


# ===================
# 1. 分类 Admin 配置 (CategoryAdmin)
# ===================
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'order', 'slug', 'application_count', 'created_at')
    list_display_links = ('name',)
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ('order',)

    def application_count(self, obj):
        """计算该分类下的应用数量"""
        return obj.applications.count()
    application_count.short_description = '应用数量'


# ===================
# 3. 网站导航 Admin 配置 (WebsiteNavigationAdmin)
# ===================
@admin.register(WebsiteNavigation)
class WebsiteNavigationAdmin(admin.ModelAdmin):
    list_display = ('name', 'url', 'display_favicon', 'order') # 💥 修正点 1：只列出一次 display_favicon
    search_fields = ('name', 'url')
    list_editable = ('order',)
    fields = ('name', 'url', 'favicon', 'order') # fields 中不需要 display_favicon

    # 💥 修正点 2：添加 display_favicon 方法
    def display_favicon(self, obj):
        if obj.favicon:
            # 返回一个安全的 HTML 字符串
            return mark_safe(
                f'<img src="{obj.favicon.url}" style="width: 20px; height: 20px; object-fit: contain;" />'
            )
        # 如果没有图标，返回一个空的 HTML 字符串，而不是 None 或 False
        return mark_safe('<span style="color:#adb5bd;">无图标</span>')

    # 💥 修正点 3：设置 short_description 和 allow_tags 属性
    display_favicon.short_description = '图标'
    # 告诉 Django Admin 这是一个包含 HTML 的安全字符串
    display_favicon.allow_tags = True