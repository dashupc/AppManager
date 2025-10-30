# 文件: core/files.py (更新)

import os
from django.conf import settings
from django.http import JsonResponse, FileResponse, Http404, HttpResponse
from django.views.decorators.http import require_GET
from django.contrib.admin.views.decorators import staff_member_required
import mimetypes # 新增导入

@staff_member_required
@require_GET
def get_uploaded_files(request):
    """
    返回 MEDIA_ROOT/uploads 目录下的文件列表。
    """
    # 构造上传目录的绝对路径，默认您的文件应该放在 media/uploads/ 目录下
    upload_dir = os.path.join(settings.MEDIA_ROOT, 'uploads')
    
    # 确保目录存在
    if not os.path.exists(upload_dir):
        return JsonResponse({'files': []})
    
    try:
        # 遍历目录，只列出文件，排除文件夹和隐藏文件
        file_list = [
            f for f in os.listdir(upload_dir) 
            if os.path.isfile(os.path.join(upload_dir, f)) and not f.startswith('.')
        ]
        
        # 返回 JSON 格式的文件名列表
        return JsonResponse({'files': file_list})
        
    except Exception as e:
        # print(f"Error reading upload directory: {e}") # 移除 print
        return JsonResponse({'files': [], 'error': str(e)}, status=500)

# 【新增】处理服务器路径下载的 API 接口
@require_GET
def download_server_file(request):
    """
    处理 download_type='SERVER_PATH' 的文件下载。
    """
    file_path = request.GET.get('path')
    if not file_path:
        return HttpResponse("参数缺失: 需要 'path' 参数。", status=400)
    
    absolute_path = file_path
    
    # 文件存在性检查
    if not os.path.exists(absolute_path):
         raise Http404(f"文件未找到: {file_path}")

    # 准备 FileResponse
    try:
        mime_type, encoding = mimetypes.guess_type(absolute_path)
        if mime_type is None:
            mime_type = 'application/octet-stream' # 默认二进制流

        response = FileResponse(open(absolute_path, 'rb'), content_type=mime_type)
        
        # 设置文件名和下载头
        filename = os.path.basename(absolute_path)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
    except Exception as e:
        return HttpResponse(f"文件读取失败: {e}", status=500)