// 文件: core/static/admin/js/file_picker.js (新版: 使用原生CSS/HTML模态框)

(function($) {
    $(document).ready(function() {
        const filePathInput = $('#id_server_file_path');
        // 使用 reverse 函数获取正确的 URL
        const url = '/admin/core/uploaded-files/'; 
        
        // CSS for the simple modal
        const modalCss = `
            /* Overlay */
            #file-picker-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                background: rgba(0,0,0,0.5); z-index: 1000; display: none;
            }
            /* Modal Box */
            #file-picker-modal {
                background: #fff; width: 500px; max-width: 90%; 
                margin: 50px auto; padding: 20px; border-radius: 5px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.2);
            }
            /* File List */
            #file-list-ul {
                max-height: 400px; overflow-y: scroll; list-style: none; 
                padding: 0; border: 1px solid #ccc; margin-top: 10px;
                background-color: #fff;
            }
            #file-list-ul li {
                padding: 8px 10px; border-bottom: 1px solid #eee; cursor: pointer;
                transition: background-color 0.2s;
                word-break: break-all;
            }
            #file-list-ul li:hover {
                background-color: #f6f6f6;
            }
            .modal-title {
                font-size: 1.2em; font-weight: bold; margin-bottom: 15px;
                border-bottom: 1px solid #eee; padding-bottom: 10px;
            }
        `;
        
        // 确保 CSS 只添加一次
        if ($('#file-picker-style').length === 0) {
            $('head').append(`<style id="file-picker-style">${modalCss}</style>`);
        }

        if (filePathInput.length) {
            // 1. 创建选择按钮
            const pickerButton = $('<button type="button" class="button" style="margin-left: 10px;">选择服务器文件</button>');
            filePathInput.after(pickerButton);

            // 2. 创建模态框容器 (使用原生HTML/CSS)
            const modalHtml = `
                <div id="file-picker-overlay">
                    <div id="file-picker-modal">
                        <div class="modal-title">选择服务器文件</div>
                        <p id="loading-message">正在加载文件列表...</p>
                        <ul id="file-list-ul"></ul>
                        <button type="button" class="button default" id="modal-close-button" style="margin-top: 20px;">关闭</button>
                    </div>
                </div>
            `;
            $('body').append(modalHtml);
            
            const overlay = $('#file-picker-overlay');
            const fileListElement = $('#file-list-ul');
            const loadingMessage = $('#loading-message');

            function openModal() {
                overlay.fadeIn(200);
                fileListElement.empty();
                loadingMessage.show().text('正在加载文件列表...');

                // 异步请求文件列表
                $.ajax({
                    url: url,
                    dataType: 'json',
                    success: function(data) {
                        loadingMessage.hide();
                        if (data.files && data.files.length > 0) {
                            $.each(data.files, function(index, fileName) {
                                const listItem = $(`<li>${fileName}</li>`);
                                
                                // 点击文件名时，将其值填入输入框
                                listItem.on('click', function() {
                                    // 自动在文件名前加上 uploads/ 前缀
                                    filePathInput.val(`uploads/${fileName}`); 
                                    overlay.fadeOut(200);
                                });
                                fileListElement.append(listItem);
                            });
                        } else {
                            fileListElement.html('<li style="padding: 10px;">未找到任何文件。请确认文件已上传至 media/uploads 目录。</li>');
                        }
                    },
                    error: function(xhr, status, error) {
                        loadingMessage.text('加载文件列表失败，请检查服务器日志。').css('color', 'red');
                        console.error('Error fetching file list:', error);
                    }
                });
            }

            // 3. 绑定点击事件
            pickerButton.on('click', openModal);
            
            // 绑定关闭事件
            $('#modal-close-button').on('click', function() {
                overlay.fadeOut(200);
            });
            
            // 绑定点击 overlay 区域关闭
            overlay.on('click', function(e) {
                if (e.target.id === 'file-picker-overlay') {
                    overlay.fadeOut(200);
                }
            });
            
            // 绑定ESC键关闭
            $(document).on('keydown', function(e) {
                if (e.key === 'Escape' && overlay.is(':visible')) {
                    overlay.fadeOut(200);
                }
            });
        }
    });
})(django.jQuery);