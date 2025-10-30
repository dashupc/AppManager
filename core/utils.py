import requests
from bs4 import BeautifulSoup
from django.core.files.base import ContentFile
from urllib.parse import urljoin, urlparse
import os
import io
from django.conf import settings 
from django.conf.urls.static import static

def fetch_favicon(url):
    """
    访问给定 URL，尝试查找并下载 Favicon。
    返回一个 ContentFile 对象或 None。
    """
    # 确保 URL 有 Scheme
    if not urlparse(url).scheme:
        url = "http://" + url
        
    try:
        # 1. 尝试获取网站 HTML
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        # 允许重定向
        response = requests.get(url, headers=headers, timeout=10, allow_redirects=True)
        response.raise_for_status()  # 检查 HTTP 错误
        
        soup = BeautifulSoup(response.text, 'html.parser')
        icon_url = None

        # 2. 查找 HTML 中的 favicon 链接
        # 查找 rel 包含 'icon' 或 'shortcut icon' 的 link 标签
        link_tags = soup.find_all('link', rel=lambda rel: rel and any(keyword in rel.lower() for keyword in ['icon', 'shortcut icon']))

        if link_tags:
            # 找到第一个有效的链接
            icon_url = link_tags[0].get('href')

        # 3. 如果未找到链接，尝试默认路径
        if not icon_url:
            icon_url = '/favicon.ico'

        # 4. 确保 icon_url 是绝对 URL，并下载图标文件
        icon_url = urljoin(url, icon_url)
        
        icon_response = requests.get(icon_url, timeout=10)
        icon_response.raise_for_status()

        # 5. 验证内容类型
        content_type = icon_response.headers.get('Content-Type', '').lower()
        if 'image' not in content_type and 'octet-stream' not in content_type:
            # 如果内容类型不对，则下载失败
            print(f"Favicon content type check failed for {icon_url}: {content_type}")
            return None

        # 6. 返回 Django ContentFile
        # 确定文件名，使用域名部分来确保唯一性
        domain = urlparse(url).netloc.replace('.', '_')
        filename = f"{domain}.ico"
        
        # 使用 ContentFile 将二进制内容包装起来
        return ContentFile(icon_response.content, name=filename)

    except requests.exceptions.RequestException as e:
        print(f"Error fetching favicon for {url}: {e}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred during favicon processing: {e}")
        return None