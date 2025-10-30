// 文件: core/static/admin/js/paste_upload.js (Base64 传输修复版)

(function($) {
    $(document).ready(function() {
        
        console.log("Logo Paste functionality loaded. Ready to monitor.");

        const logoInput = $('#id_logo'); // 原始文件上传字段
        const pasteArea = $('#id_paste_area'); // 粘贴文本区域
        const base64Input = $('#id_logo_base64_data'); // 【核心新增】隐藏的 Base64 字段
        const pasteAreaRow = pasteArea.closest('.form-row'); 

        // 检查元素是否存在
        if (logoInput.length === 0 || pasteArea.length === 0 || base64Input.length === 0) {
            console.error("Paste Upload INIT ERROR: HTML elements not found. Aborting.");
            return;
        }

        // ----------------------------------------------------------------------
        // 【布局修改】创建新的父容器，并应用 Flex 样式
        // ----------------------------------------------------------------------
        
        const originalLabel = pasteAreaRow.find('label').first().clone(true);
        const originalHelp = pasteAreaRow.find('p.help').first().clone(true);
        
        const newFieldBox = $(`
            <div class="form-row field-paste_area" id="paste-row-flex-container" style="display: flex; align-items: flex-start;">
                <div style="flex-grow: 1;"></div> 
            </div>
        `);

        const finalPreviewContainer = $(`
            <div id="paste_preview_container_final" style="width: 60px; height: 60px; border: 1px solid #ccc; background-color: #f9f9f9; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-left: 10px; margin-top: 10px; box-sizing: border-box; flex-shrink: 0; border-radius: 4px;">
                <span style="color: #777; font-size: 10px;">LOGO</span>
            </div>
        `);
        
        const contentFlexContainer = $(`
            <div style="
                display: flex; 
                align-items: center; 
                gap: 10px;           
                margin-top: 5px;     
            ">
            </div>
        `);
        
        contentFlexContainer.append(pasteArea.css('height', '60px')); 
        contentFlexContainer.append(finalPreviewContainer);
        
        newFieldBox.html(''); 
        newFieldBox.append(originalLabel);
        newFieldBox.append(contentFlexContainer);
        newFieldBox.append(originalHelp);

        pasteAreaRow.replaceWith(newFieldBox); 
        
        // ----------------------------------------------------------------------
        // 【核心粘贴逻辑】Base64 传输
        // ----------------------------------------------------------------------
        pasteArea.on('paste', function(event) {
            
            console.log("PASTE EVENT CAPTURED (Base64 Mode).");
            event.preventDefault(); 

            const clipboardData = event.clipboardData || event.originalEvent.clipboardData;
            const items = clipboardData ? clipboardData.items : [];
            let imageFile = null;

            // 1. 遍历粘贴内容，寻找图片
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    imageFile = items[i].getAsFile();
                    break;
                }
            }

            // 2. 处理图片粘贴
            if (imageFile) { 
                
                const reader = new FileReader();

                try {
                    reader.onload = function(e) {
                        const base64String = e.target.result;
                        
                        // 1. 【核心】将 Base64 字符串写入隐藏字段
                        base64Input.val(base64String); 

                        // 2. 清空实际的 Logo 文件输入框，防止干扰
                        logoInput.val(''); 
                        
                        // 3. 显示预览
                        finalPreviewContainer.empty(); 
                        const img = $('<img>', {
                            src: base64String, // 使用 Base64 字符串进行预览
                            alt: 'Pasted Image',
                            style: 'width: 100%; height: 100%; object-fit: contain; display: block;'
                        });
                        finalPreviewContainer.append(img);
                        
                        // 4. 更新文件名提示
                        const logoRow = logoInput.closest('.form-row');
                        let fileText = logoRow.find('.file-upload-clearable-text');
                        if (fileText.length) {
                            fileText.html(`Current file: <span style="color: green;">粘贴图片 (将在保存时上传)</span>`);
                        }
                        
                        // 清空粘贴区域
                        pasteArea.val('');
                        console.log('SUCCESS: Image Base64 set to hidden field.');
                    };
                    
                    reader.readAsDataURL(imageFile);
                } catch(e) {
                    finalPreviewContainer.html(`<span style="color: red; font-size: 8px;">FAIL</span>`);
                    console.error("Error reading image file from clipboard:", e);
                    return;
                }

            } else {
                // 3. 处理文本粘贴（如果没有图片）
                const text = clipboardData ? clipboardData.getData('text/plain') : '';
                if (text) {
                    const currentVal = pasteArea.val();
                    pasteArea.val(currentVal + text); 
                    finalPreviewContainer.html('<span style="color: blue; font-size: 10px;">Text</span>');
                    console.log('INFO: Text data pasted.');
                } else {
                     finalPreviewContainer.html('<span style="color: red; font-size: 10px;">No Data</span>');
                     console.log('FAILURE: No recognizable data in clipboard.');
                }
            }
        });
    });
})(django.jQuery);