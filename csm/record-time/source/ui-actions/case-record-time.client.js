function openPracticeCaseRecordTime() {
    try {
        var taskSysId = g_form.getUniqueValue();

        if (!taskSysId) {
            g_form.addErrorMessage(
                'Please save the Case before recording time.'
            );
            return false;
        }

        var taskDisplay =
            g_form.getValue('number') ||
            taskSysId;

        var modal = new GlideModal(
            'x_your_scope_practice_record_time_v2',
            false,
            1000
        );

        modal.setTitle(
            'Record Time - ' +
            taskDisplay
        );

        modal.setPreference(
            'sysparm_task_sys_id',
            taskSysId
        );

        modal.render();
        return false;
    } catch (exception) {
        g_form.addErrorMessage(
            'Unable to open Record Time: ' +
            exception.message
        );
        return false;
    }
}
