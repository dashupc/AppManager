// 文件: core/static/admin/js/paste_upload.js (紧凑 50x50 预览版)

(function($) {
    $(document).ready(function() {
        
        console.log("Logo Paste functionality loaded. Ready to monitor.");

        const logoInput = $('#id_logo'); 
        const pasteArea = $('#id_paste_area'); 
        const pasteAreaRow = pasteArea.closest('.form-row'); // 粘贴区的外层 form-row

        // 检查元素是否存在
        if (logoInput.length === 0 || pasteArea.length === 0) {
            console.error("Paste Upload INIT ERROR: HTML elements not found. Aborting.");
            return;
        }

        // ----------------------------------------------------------------------
        // 【布局修复点 1】创建新的父容器，并应用 Flex 样式
        // ----------------------------------------------------------------------
        
        // 1. 提取标签和帮助文本
        const originalLabel = pasteAreaRow.find('label').first().clone(true);
        const originalHelp = pasteAreaRow.find('p.help').first().clone(true);
        
        // 2. 创建一个新的容器来包裹 <textarea> 和预览区，并应用 Admin 的 field-box 样式
        const newFieldBox = $(`
            <div class="form-row field-paste_area" id="paste-row-flex-container">
                <div style="flex-grow: 1;"></div> 
            </div>
        `);

        // 3. 创建核心内容 Flex 容器：包含 textarea 和 预览框
        const contentFlexContainer = $(`
            <div style="
                display: flex; 
                align-items: center; /* 垂直居中对齐 */
                gap: 10px;           /* 元素间距 */
                margin-top: 5px;     /* 与 label 间隔 */
            ">
            </div>
        `);
        
        // 4. 创建右侧的预览容器 (固定小尺寸 60x60)
        const previewContainer = $(`
            <div id="paste_preview_container" style="
                width: 60px;           
                height: 60px;          
                border: 1px solid #ccc; /* 使用更柔和的边框 */
                text-align: center; 
                overflow: hidden;      
                display: flex;         
                flex-direction: column; /* 垂直堆叠内容 */
                justify-content: center;
                align-items: center;
                box-sizing: border-box;
                flex-shrink: 0;         /* 不允许收缩 */
                border-radius: 4px;     /* 轻微圆角 */
            ">
                <span style="color: #777; font-size: 10px;">Preview</span>
            </div>
        `);

        // 5. 组装新结构
        contentFlexContainer.append(pasteArea.css('height', '60px')); // 限制 textarea 高度
        contentFlexContainer.append(previewContainer);
        
        // 6. 将 Label 和 Help Text 重新插回到 newFieldBox
        newFieldBox.html(''); // 清空占位的 div
        newFieldBox.append(originalLabel);
        newFieldBox.append(contentFlexContainer);
        newFieldBox.append(originalHelp);

        // 7. 将新结构替换旧的 form-row
        pasteAreaRow.replaceWith(newFieldBox); 
        
        // 重新获取 previewContainer 的 jQuery 对象，以便后续操作
        const finalPreviewContainer = $('#paste_preview_container');
        
        console.log('Paste area rearranged to compact flex layout.');

        // ----------------------------------------------------------------------
        // 【核心粘贴逻辑】
        // ----------------------------------------------------------------------
        pasteArea.on('paste', function(event) {
            
            console.log("PASTE EVENT CAPTURED. Proceeding to process data.");
            event.preventDefault(); // 阻止默认的文本粘贴行为

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
                const filename = `pasted_image_${new Date().getTime()}.png`;

                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(new File([imageFile], filename, { type: imageFile.type || 'image/png' })); 
                logoInput[0].files = dataTransfer.files;

                // 显示预览
                finalPreviewContainer.empty();
                reader.onload = function(e) {
                    // ----------------------------------------------------------------------
                    // 【样式修复点 2】修改图片本身的样式：限制最大宽高为 50px
                    // ----------------------------------------------------------------------
                    const img = $('<img>', {
                        src: e.target.result,
                        alt: 'Pasted Image Preview',
                        style: `
                            max-width: 50px; 
                            max-height: 50px; 
                            width: auto; 
                            height: auto;
                            display: block; 
                            border-radius: 2px;
                        `
                    });
                    finalPreviewContainer.append(img);
                    // 移除 SUCCESS 文本，保持简洁，或使用图标/边框变化提示
                    // finalPreviewContainer.css('border-color', 'green'); // 可选的成功视觉提示
                };
                
                try {
                    reader.readAsDataURL(imageFile);
                } catch(e) {
                    finalPreviewContainer.html(`<span style="color: red; font-size: 8px;">FAIL</span>`);
                    console.error("Error reading image file from clipboard:", e);
                    return;
                }

                // 3. 更新文件名提示 (此处不变)
                const logoRow = logoInput.closest('.form-row');
                let fileText = logoRow.find('.file-upload-clearable-text');
                if (fileText.length) {
                    fileText.text(`Current file: ${filename} (Set)`);
                }
                
                pasteArea.val(''); // 清空粘贴区
                console.log('SUCCESS: Image set to Logo field.');

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