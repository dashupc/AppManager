from django.db import models
import requests
import os
from bs4 import BeautifulSoup
from django.core.files.base import ContentFile
from urllib.parse import urlparse, urljoin # 确保导入了 urljoin 和 urlparse


class AppChoices(models.TextChoices):
    # 下载类型 (Download Type)
    EXTERNAL_LINK = 'EXTERNAL_LINK', '外部链接'
    UPLOADED_FILE = 'UPLOADED_FILE', '本机上传'
    SERVER_PATH = 'SERVER_PATH', '手动选择服务器文件'
    
    # 安装方式 (Installation Method)
    SILENT = 'SILENT', '静默安装'
    MANUAL = 'MANUAL', '手动安装'


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name='分类名称')
    slug = models.SlugField(max_length=100, unique=True, verbose_name='Slug')
    order = models.IntegerField(default=0, verbose_name='排序')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '应用分类'
        verbose_name_plural = '应用分类'
        ordering = ['order', 'created_at']

    def __str__(self):
        return self.name


class Application(models.Model):
    name = models.CharField(max_length=200, verbose_name='应用名称')
    version = models.CharField(max_length=50, blank=True, null=True, verbose_name='版本号')
    category = models.ForeignKey(
        Category, 
        on_delete=models.CASCADE, 
        related_name='applications', 
        verbose_name='所属分类'
    )
    short_description = models.TextField(blank=True, null=True, verbose_name='简短描述')
    logo = models.ImageField(upload_to='logos/', blank=True, null=True, verbose_name='Logo')
    is_recommended = models.BooleanField(default=False, verbose_name='是否推荐')
    order = models.IntegerField(default=0, verbose_name='排序')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    
    # ------------------ 安装方式配置 ------------------
    install_params = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name='安装参数',
        help_text='仅当安装方式为“静默安装”时生效，用于存储安装包的静默参数 (如：/S, /qn /norestart)。'
    )
    install_method = models.CharField(
        max_length=10,
        choices=[
            (AppChoices.SILENT.value, AppChoices.SILENT.label), 
            (AppChoices.MANUAL.value, AppChoices.MANUAL.label)
        ],
        default=AppChoices.MANUAL,
        verbose_name='安装方式'
    )
    
    # ------------------ 下载地址配置 ------------------
    download_type = models.CharField(
        max_length=20,
        choices=[
            (AppChoices.EXTERNAL_LINK.value, AppChoices.EXTERNAL_LINK.label),
            (AppChoices.UPLOADED_FILE.value, AppChoices.UPLOADED_FILE.label),
            (AppChoices.SERVER_PATH.value, AppChoices.SERVER_PATH.label)
        ],
        default=AppChoices.UPLOADED_FILE,
        verbose_name='下载方式'
    )
    external_link = models.URLField(max_length=500, blank=True, null=True, verbose_name='外部链接')
    uploaded_file = models.FileField(upload_to='uploads/', blank=True, null=True, verbose_name='本机上传文件')
    server_file_path = models.CharField(max_length=500, blank=True, null=True, verbose_name='服务器文件路径')
    
    class Meta:
        verbose_name = '应用管理'
        verbose_name_plural = '应用管理'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class WebsiteNavigation(models.Model):
    name = models.CharField(max_length=100, verbose_name='网站名称')
    url = models.URLField(max_length=500, verbose_name='网址')
    favicon = models.ImageField(upload_to='favicons/', blank=True, null=True, verbose_name='图标')
    order = models.IntegerField(default=0, verbose_name='排序')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '网站导航'
        verbose_name_plural = '网站导航'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name
        
    def save(self, *args, **kwargs):
        # 简化 save 逻辑：如果 URL 存在，就尝试抓取。
        # 确保在调用 super().save() 之前运行抓取逻辑
        if self.url:
             self.fetch_favicon()

        super().save(*args, **kwargs)

    def fetch_favicon(self):
        """尝试从 URL 抓取并保存 Favicon"""
        print(f"\n--- Starting Favicon fetch for URL: {self.url} ---")
        if not self.url:
            return

        # 定义 User-Agent 头部，模拟浏览器 (解决 Bilibili/QQ 的 4xx/5xx 错误)
        HEADERS = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

        try:
            # 1. 尝试获取网站根目录或 HTML 中的 Favicon 链接
            r = requests.get(self.url, timeout=10, allow_redirects=True, headers=HEADERS) 
            r.raise_for_status() 

            soup = BeautifulSoup(r.content, 'html.parser')
            favicon_link = None
            
            # 尝试通过 <link> 标签获取图标链接
            for rel in ('icon', 'shortcut icon', 'apple-touch-icon'):
                link_tag = soup.find('link', rel=rel)
                if link_tag and link_tag.get('href'):
                    favicon_link = link_tag['href']
                    print(f"Found link tag for favicon: {favicon_link}")
                    break

            # 如果 HTML 中没有找到，则尝试默认路径 /favicon.ico
            if not favicon_link:
                parsed_url = urlparse(self.url)
                base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
                favicon_link = f"{base_url}/favicon.ico"
                print(f"No link tag found, defaulting to: {favicon_link}")
                
            # 确保 favicon_link 是一个绝对 URL
            if not favicon_link.startswith(('http', 'https')):
                favicon_link = urljoin(self.url, favicon_link)
                print(f"Absolute favicon URL: {favicon_link}")

            # 2. 下载 Favicon 文件
            icon_response = requests.get(favicon_link, timeout=10, stream=True, headers=HEADERS)
            icon_response.raise_for_status()
            print(f"Favicon file downloaded. Status: {icon_response.status_code}")
            
            # 3. 保存文件到 Django 模型
            content_type = icon_response.headers.get('content-type', '').lower()
            if 'image' in content_type or 'icon' in content_type:
                filename = os.path.basename(favicon_link).split('?')[0]
                if not filename or '.' not in filename:
                    # 使用 self.pk 或进程 ID 来确保文件名唯一性
                    filename = f"favicon_{self.pk or os.getpid()}.ico" 

                # 重点：使用 .save() 方法将文件内容写入 media 目录
                self.favicon.save(
                    filename,
                    ContentFile(icon_response.content),
                    save=False # 不在这里保存，留给 save() 方法
                )
                print(f"SUCCESS: Favicon saved to model instance as: {filename}")
                
            else:
                print(f"FAILURE: Downloaded content is not an image (Content-Type: {content_type}).")
                # 清除旧图标
                if self.favicon:
                    self.favicon.delete(save=False)
                self.favicon = None
                
        except requests.exceptions.Timeout:
            print(f"ERROR: Request timed out for {self.url} or favicon URL.")
            self.favicon = None
        except requests.exceptions.RequestException as e:
            print(f"ERROR: HTTP Request failed for {self.url}. Details: {e}")
            self.favicon = None
        except Exception as e:
            print(f"ERROR: An unexpected error occurred during favicon processing. Details: {e}")
            self.favicon = None
            
        print("--- Favicon fetch process finished. ---\n")