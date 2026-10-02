function onClick(g_form) {
    try {
        var taskSysId = '';

        if (g_form.getUniqueValue) {
            taskSysId = g_form.getUniqueValue();
        }

        if (!taskSysId && g_form.getSysId) {
            taskSysId = g_form.getSysId();
        }

        if (!taskSysId) {
            g_form.addErrorMessage(
                'Unable to determine the current Customer Project.'
            );
            return;
        }

        var taskDisplay =
            g_form.getValue('number') ||
            taskSysId;

        var url =
            '/x_your_scope_practice_record_time_v2.do' +
            '?sysparm_task_sys_id=' +
            encodeURIComponent(taskSysId) +
            '&sysparm_stack=no';

        g_modal.showFrame({
            title: 'Record Time - ' + taskDisplay,
            url: url,
            size: 'lg',
            height: 760
        });
    } catch (exception) {
        g_form.addErrorMessage(
            'Unable to open Record Time: ' +
            exception.message
        );
    }
}
