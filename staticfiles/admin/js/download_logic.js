// 文件: core/static/admin/js/download_logic.js

(function($) {
    $(document).ready(function() {
        const downloadTypeField = $('#id_download_type');

        // 获取所有下载地址字段及其对应的表单行 (.form-row)
        const linkRow = $('#id_external_link').closest('.form-row');
        const uploadRow = $('#id_uploaded_file').closest('.form-row');
        const pathRow = $('#id_server_file_path').closest('.form-row');

        // 映射 AppChoices 的值到对应的行元素
        const typeMap = {
            'EXTERNAL_LINK': linkRow,
            'UPLOADED_FILE': uploadRow,
            'SERVER_PATH': pathRow
        };

        // 切换函数：根据下拉框的值显示对应的字段行
        function toggleDownloadFields() {
            const currentValue = downloadTypeField.val();

            // 遍历所有可能的行，默认全部隐藏
            $.each(typeMap, function(type, row) {
                row.hide();
            });

            // 根据当前选中的值，显示对应的行
            if (currentValue in typeMap) {
                typeMap[currentValue].show();
            }
        }

        // 1. 绑定事件：当下载方式改变时调用切换函数
        downloadTypeField.on('change', toggleDownloadFields);

        // 2. 页面加载时立即执行一次，以设置初始状态
        toggleDownloadFields();
    });
})(django.jQuery);