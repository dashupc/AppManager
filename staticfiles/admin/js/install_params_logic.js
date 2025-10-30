// 文件: core/static/admin/js/install_params_logic.js
(function($) {
    $(document).ready(function() {
        const installMethodField = $('#id_install_method');
        // 获取 install_params 字段所在的 form-row
        const installParamsRow = $('#id_install_params').closest('.form-row');
        
        const SILENT_VALUE = 'SILENT'; 
        const DEFAULT_PARAMS = '/S'; 
        
        function toggleInstallParams() {
            const currentValue = installMethodField.val();
            
            if (currentValue === SILENT_VALUE) {
                // 显示参数字段
                installParamsRow.show();
                
                // 如果当前参数为空，则设置默认值 /S
                const currentParams = $('#id_install_params').val();
                if (!currentParams) {
                    $('#id_install_params').val(DEFAULT_PARAMS);
                }
            } else {
                // 隐藏参数字段
                installParamsRow.hide();
            }
        }

        installMethodField.on('change', toggleInstallParams);
        toggleInstallParams();
    });
})(django.jQuery);