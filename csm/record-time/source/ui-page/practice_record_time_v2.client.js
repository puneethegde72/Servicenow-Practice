var practiceEntries = [];
var practiceEditingIndex = -1;
var practiceSubmitting = false;
var practicePreviewing = false;
var practiceContextValid = false;
var PRACTICE_AJAX_NAME = 'x_your_scope.PracticeTimeEntryAjaxV2';

addLoadEvent(function() {
    practiceSetToday();
    practiceWireEvents();
    practiceSetChoiceValue('practice_category_wrap', 'task_work');
    practiceRenderEntries();
    practiceResolveContext();
});

function practiceResolveContext() {
    var taskSysId = practiceSafeValue('practice_task_sys_id_pref');

    if (!taskSysId) {
        try {
            var dialog = GlideDialogWindow.get();
            if (dialog && dialog.getPreference) {
                taskSysId = dialog.getPreference('sysparm_task_sys_id') || '';
            }
        } catch (exception) {
            taskSysId = '';
        }
    }

    if (!taskSysId) {
        taskSysId = practiceGetUrlParameter('sysparm_task_sys_id');
    }

    if (!taskSysId) {
        practiceDisableForm('Unable to determine the current record.');
        return;
    }

    gel('practice_task_sys_id').value = taskSysId;

    var ga = new GlideAjax(PRACTICE_AJAX_NAME);
    ga.addParam('sysparm_name', 'validateContext');
    ga.addParam('sysparm_task_sys_id', taskSysId);

    ga.getXMLAnswer(function(answer) {
        try {
            var response = JSON.parse(answer || '{}');

            if (!response.success) {
                practiceDisableForm(
                    response.message ||
                    'Record Time could not be initialised.'
                );
                return;
            }

            practiceContextValid = true;
            gel('practice_add').disabled = false;
        } catch (exception) {
            practiceDisableForm('Record Time could not be initialised.');
        }
    });
}

function practiceWireEvents() {
    gel('practice_add').onclick = practiceAddEntry;
    gel('practice_submit').onclick = practiceSubmitAll;
    gel('practice_clear').onclick = practiceClearAll;
    gel('practice_close').onclick = practiceClose;
    gel('practice_hours').onchange = practiceNormaliseDuration;
    gel('practice_minutes').onchange = practiceNormaliseDuration;
}

function practiceSetToday() {
    var today = new Date();
    gel('practice_work_date').value =
        today.getFullYear() +
        '-' +
        practicePad(today.getMonth() + 1) +
        '-' +
        practicePad(today.getDate());
}

function practicePad(value) {
    return value < 10 ? '0' + value : String(value);
}

function practiceGetChoiceElement(wrapperId) {
    var wrapper = gel(wrapperId);
    if (!wrapper) {
        return null;
    }
    return wrapper.querySelector('select');
}

function practiceGetChoiceValue(wrapperId) {
    var field = practiceGetChoiceElement(wrapperId);
    return field ? String(field.value || '') : '';
}

function practiceGetChoiceDisplay(wrapperId) {
    var field = practiceGetChoiceElement(wrapperId);
    if (!field || field.selectedIndex < 0) {
        return '';
    }
    return String(field.options[field.selectedIndex].text || '');
}

function practiceSetChoiceValue(wrapperId, value) {
    var field = practiceGetChoiceElement(wrapperId);
    if (!field) {
        return;
    }

    for (var i = 0; i < field.options.length; i++) {
        if (String(field.options[i].value) === String(value)) {
            field.value = value;
            return;
        }
    }
}

function practiceGetDurationSeconds() {
    var hours = parseInt(gel('practice_hours').value, 10) || 0;
    var minutes = parseInt(gel('practice_minutes').value, 10) || 0;
    return (hours * 3600) + (minutes * 60);
}

function practiceSetDurationSeconds(totalSeconds) {
    totalSeconds = parseInt(totalSeconds, 10) || 0;
    gel('practice_hours').value = Math.floor(totalSeconds / 3600);
    gel('practice_minutes').value = Math.floor((totalSeconds % 3600) / 60);
}

function practiceNormaliseDuration() {
    var hours = parseInt(gel('practice_hours').value, 10) || 0;
    var minutes = parseInt(gel('practice_minutes').value, 10) || 0;

    hours = Math.max(0, Math.min(12, hours));
    minutes = Math.max(0, Math.min(59, minutes));

    gel('practice_hours').value = hours;
    gel('practice_minutes').value = minutes;
}

function practiceBuildPendingUsage(ignoredIndex) {
    var usage = {};

    for (var i = 0; i < practiceEntries.length; i++) {
        if (i === ignoredIndex) {
            continue;
        }

        var entry = practiceEntries[i];
        if (!entry.generated || !entry.generated.length) {
            continue;
        }

        for (var x = 0; x < entry.generated.length; x++) {
            var generated = entry.generated[x];
            var key = entry.workDate + '|' + generated.value;
            usage[key] =
                (usage[key] || 0) +
                (parseInt(generated.seconds, 10) || 0);
        }
    }

    return usage;
}

function practiceAddEntry() {
    if (!practiceContextValid || practicePreviewing || practiceSubmitting) {
        return;
    }

    practiceClearMessages();

    var workDate = practiceSafeValue('practice_work_date');
    var category = practiceGetChoiceValue('practice_category_wrap');
    var timeSlot = practiceGetChoiceValue('practice_time_slot_wrap');
    var areaOfWork = practiceGetChoiceValue('practice_area_of_work_wrap');
    var comments = String(gel('practice_comments').value || '');
    var durationSeconds = practiceGetDurationSeconds();

    if (!workDate) {
        practiceShowError('Work Date is required.');
        return;
    }

    if (!timeSlot) {
        practiceShowError('Time Slot is required.');
        return;
    }

    if (!areaOfWork) {
        practiceShowError('Area of work is required.');
        return;
    }

    if (durationSeconds <= 0) {
        practiceShowError('Time worked must be greater than zero.');
        return;
    }

    var entry = {
        workDate: workDate,
        category: category,
        categoryDisplay: practiceGetChoiceDisplay('practice_category_wrap'),
        startSlot: timeSlot,
        timeSlotDisplay: practiceGetChoiceDisplay('practice_time_slot_wrap'),
        areaOfWork: areaOfWork,
        areaDisplay: practiceGetChoiceDisplay('practice_area_of_work_wrap'),
        comments: comments,
        durationSeconds: durationSeconds,
        generated: []
    };

    practicePreviewing = true;

    var addButton = gel('practice_add');
    addButton.disabled = true;
    addButton.innerHTML = practiceEditingIndex >= 0 ? 'Updating...' : 'Adding...';

    var ga = new GlideAjax(PRACTICE_AJAX_NAME);
    ga.addParam('sysparm_name', 'previewEntry');
    ga.addParam('sysparm_work_date', workDate);
    ga.addParam('sysparm_start_slot', timeSlot);
    ga.addParam('sysparm_duration_seconds', durationSeconds);
    ga.addParam(
        'sysparm_pending_usage',
        JSON.stringify(practiceBuildPendingUsage(practiceEditingIndex))
    );

    ga.getXMLAnswer(function(answer) {
        practicePreviewing = false;
        addButton.disabled = false;

        try {
            var response = JSON.parse(answer || '{}');

            if (!response.success) {
                practiceRestoreAddButton();
                practiceShowError(
                    response.message ||
                    'Unable to calculate Time Worked.'
                );
                return;
            }

            entry.generated = response.records || [];

            if (practiceEditingIndex >= 0) {
                practiceEntries[practiceEditingIndex] = entry;
            } else {
                practiceEntries.push(entry);
            }

            practiceEditingIndex = -1;
            practiceRenderEntries();
            practiceResetEntry();
        } catch (exception) {
            practiceRestoreAddButton();
            practiceShowError('Unable to process the Time Worked response.');
        }
    });
}

function practiceRenderEntries() {
    var container = gel('practice_entries');
    var submitButton = gel('practice_submit');

    if (!practiceEntries.length) {
        container.className = 'practice-empty';
        container.innerHTML = 'No Time Worked entries have been added.';
        gel('practice_total_time').innerHTML = '0m';
        gel('practice_record_count').innerHTML = '0';
        submitButton.disabled = true;
        return;
    }

    container.className = '';
    submitButton.disabled = practiceSubmitting;

    var html = '';
    var totalSeconds = 0;
    var totalRecords = 0;

    for (var i = 0; i < practiceEntries.length; i++) {
        var entry = practiceEntries[i];
        totalSeconds += entry.durationSeconds;
        totalRecords += entry.generated.length;

        var preview = '';
        for (var x = 0; x < entry.generated.length; x++) {
            var generated = entry.generated[x];
            preview +=
                '<div class="practice-preview-row">' +
                    '<span>' + practiceEscape(generated.label) + '</span>' +
                    '<strong>' +
                        practiceEscape(practiceFormatSeconds(generated.seconds)) +
                    '</strong>' +
                '</div>';
        }

        html +=
            '<div class="practice-entry">' +
                '<div class="practice-entry-header">' +
                    '<div class="practice-entry-title">' +
                        practiceEscape(practiceDisplayDate(entry.workDate)) +
                        ' - ' +
                        practiceEscape(practiceFormatSeconds(entry.durationSeconds)) +
                    '</div>' +
                    '<div class="practice-entry-actions">' +
                        '<button type="button" class="btn btn-default btn-sm" ' +
                            'data-practice-edit="' + i + '">Edit</button>' +
                        '<button type="button" class="btn btn-default btn-sm" ' +
                            'data-practice-remove="' + i + '">Remove</button>' +
                    '</div>' +
                '</div>' +
                '<div class="practice-entry-grid">' +
                    practiceEntryField('Category', entry.categoryDisplay) +
                    practiceEntryField('Work Date', practiceDisplayDate(entry.workDate)) +
                    practiceEntryField('Time Slot', entry.timeSlotDisplay) +
                    practiceEntryField('Time Worked', practiceFormatSeconds(entry.durationSeconds)) +
                    practiceEntryField('Area of work', entry.areaDisplay) +
                    practiceEntryField('Comments', entry.comments) +
                '</div>' +
                '<div class="practice-preview">' +
                    '<div class="practice-preview-title">' +
                        'Will create ' + entry.generated.length +
                        ' Time Worked record(s):' +
                    '</div>' +
                    preview +
                '</div>' +
            '</div>';
    }

    container.innerHTML = html;
    gel('practice_total_time').innerHTML = practiceFormatSeconds(totalSeconds);
    gel('practice_record_count').innerHTML = totalRecords;

    practiceBindEntryButtons();
}

function practiceBindEntryButtons() {
    var container = gel('practice_entries');
    var editButtons = container.querySelectorAll('[data-practice-edit]');

    for (var i = 0; i < editButtons.length; i++) {
        editButtons[i].onclick = function() {
            practiceEditEntry(
                parseInt(this.getAttribute('data-practice-edit'), 10)
            );
        };
    }

    var removeButtons = container.querySelectorAll('[data-practice-remove]');

    for (var x = 0; x < removeButtons.length; x++) {
        removeButtons[x].onclick = function() {
            practiceRemoveEntry(
                parseInt(this.getAttribute('data-practice-remove'), 10)
            );
        };
    }
}

function practiceEditEntry(index) {
    if (index < 0 || index >= practiceEntries.length) {
        return;
    }

    var entry = practiceEntries[index];

    gel('practice_work_date').value = entry.workDate;
    practiceSetChoiceValue('practice_category_wrap', entry.category);
    practiceSetChoiceValue('practice_time_slot_wrap', entry.startSlot);
    practiceSetChoiceValue('practice_area_of_work_wrap', entry.areaOfWork);
    practiceSetDurationSeconds(entry.durationSeconds);
    gel('practice_comments').value = entry.comments || '';

    practiceEditingIndex = index;
    practiceRestoreAddButton();
}

function practiceRemoveEntry(index) {
    if (index < 0 || index >= practiceEntries.length) {
        return;
    }

    practiceEntries.splice(index, 1);
    practiceEditingIndex = -1;
    practiceRenderEntries();
    practiceResetEntry();
}

function practiceResetEntry() {
    practiceSetChoiceValue('practice_time_slot_wrap', '');
    practiceSetChoiceValue('practice_area_of_work_wrap', '');
    gel('practice_hours').value = '0';
    gel('practice_minutes').value = '0';
    gel('practice_comments').value = '';
    practiceEditingIndex = -1;
    practiceRestoreAddButton();
}

function practiceRestoreAddButton() {
    gel('practice_add').innerHTML =
        practiceEditingIndex >= 0 ? 'Update Entry' : '+ Add Entry';
}

function practiceSubmitAll() {
    if (practiceSubmitting) {
        return;
    }

    practiceClearMessages();

    if (!practiceEntries.length) {
        practiceShowError('Please add at least one Time Worked entry.');
        return;
    }

    var taskSysId = practiceSafeValue('practice_task_sys_id');
    if (!taskSysId) {
        practiceShowError('Unable to determine the current record.');
        return;
    }

    var payloadEntries = [];
    for (var i = 0; i < practiceEntries.length; i++) {
        payloadEntries.push({
            workDate: practiceEntries[i].workDate,
            category: practiceEntries[i].category,
            startSlot: practiceEntries[i].startSlot,
            areaOfWork: practiceEntries[i].areaOfWork,
            comments: practiceEntries[i].comments,
            durationSeconds: practiceEntries[i].durationSeconds
        });
    }

    var payload = {
        taskSysId: taskSysId,
        entries: payloadEntries
    };

    practiceSubmitting = true;

    var submitButton = gel('practice_submit');
    submitButton.disabled = true;
    submitButton.innerHTML = 'Submitting...';
    gel('practice_add').disabled = true;
    gel('practice_clear').disabled = true;

    var ga = new GlideAjax(PRACTICE_AJAX_NAME);
    ga.addParam('sysparm_name', 'submitEntries');
    ga.addParam('sysparm_payload', JSON.stringify(payload));

    ga.getXMLAnswer(function(answer) {
        practiceSubmitting = false;
        submitButton.innerHTML = 'Submit All';
        gel('practice_add').disabled = false;
        gel('practice_clear').disabled = false;

        try {
            var response = JSON.parse(answer || '{}');

            if (!response.success) {
                submitButton.disabled = false;
                practiceShowError(practiceServerErrors(response));
                return;
            }

            practiceEntries = [];
            practiceEditingIndex = -1;
            practiceRenderEntries();
            practiceResetEntry();

            practiceShowSuccess(
                'Time recorded successfully. ' +
                response.createdCount +
                ' Time Worked record(s) created. Total recorded: ' +
                practiceFormatSeconds(response.totalSeconds) +
                '.'
            );
        } catch (exception) {
            submitButton.disabled = false;
            practiceShowError('Unable to process the server response.');
        }
    });
}

function practiceClearAll() {
    if (practiceSubmitting) {
        return;
    }

    if (
        practiceEntries.length &&
        !confirm('Clear all pending Time Worked entries?')
    ) {
        return;
    }

    practiceEntries = [];
    practiceEditingIndex = -1;
    practiceRenderEntries();
    practiceResetEntry();
    practiceClearMessages();
}

function practiceSafeValue(id) {
    var element = gel(id);
    if (!element) {
        return '';
    }

    var value = element.value;
    if (
        value === null ||
        value === undefined ||
        value === '' ||
        value === 'null' ||
        value === 'undefined'
    ) {
        return '';
    }

    return String(value);
}

function practiceGetUrlParameter(name) {
    var query = window.location.search || '';

    if (query.charAt(0) === '?') {
        query = query.substring(1);
    }

    if (!query) {
        return '';
    }

    var parameters = query.split('&');

    for (var i = 0; i < parameters.length; i++) {
        var pair = parameters[i].split('=');

        if (decodeURIComponent(pair[0] || '') === name) {
            return decodeURIComponent(
                (pair[1] || '').replace(/\+/g, ' ')
            );
        }
    }

    return '';
}

function practiceDisplayDate(value) {
    var parts = String(value || '').split('-');
    if (parts.length !== 3) {
        return value || '';
    }
    return parts[2] + '-' + parts[1] + '-' + parts[0];
}

function practiceFormatSeconds(seconds) {
    seconds = parseInt(seconds, 10) || 0;

    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var result = '';

    if (hours) {
        result += hours + 'h';
    }

    if (minutes) {
        if (result) {
            result += ' ';
        }
        result += minutes + 'm';
    }

    return result || '0m';
}

function practiceEntryField(label, value) {
    return (
        '<div>' +
            '<div class="practice-entry-label">' +
                practiceEscape(label) +
            '</div>' +
            '<div class="practice-entry-value">' +
                practiceEscape(value || '') +
            '</div>' +
        '</div>'
    );
}

function practiceEscape(value) {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function practiceDisableForm(message) {
    practiceContextValid = false;
    practiceShowError(message);
    gel('practice_add').disabled = true;
    gel('practice_submit').disabled = true;
}

function practiceShowError(message) {
    practiceHideSuccess();
    var box = gel('practice_error');
    box.innerHTML = practiceEscape(message).replace(/\n/g, '<br/>');
    box.style.display = 'block';
}

function practiceShowSuccess(message) {
    practiceHideError();
    var box = gel('practice_success');
    box.innerHTML = practiceEscape(message);
    box.style.display = 'block';
}

function practiceHideError() {
    var box = gel('practice_error');
    if (box) {
        box.style.display = 'none';
    }
}

function practiceHideSuccess() {
    var box = gel('practice_success');
    if (box) {
        box.style.display = 'none';
    }
}

function practiceClearMessages() {
    practiceHideError();
    practiceHideSuccess();
}

function practiceServerErrors(response) {
    if (response.errors && response.errors.length) {
        return response.errors.join('\n');
    }

    return response.message || 'Unable to record Time Worked.';
}

function practiceClose() {
    if (
        practiceEntries.length &&
        !confirm(
            'You have pending Time Worked entries. Close without saving them?'
        )
    ) {
        return;
    }

    try {
        var dialog = GlideDialogWindow.get();
        if (dialog) {
            dialog.destroy();
            return;
        }
    } catch (exception) {
        // Continue to Workspace fallback.
    }

    try {
        if (window.parent && window.parent.g_modal) {
            if (typeof window.parent.g_modal.destroy === 'function') {
                window.parent.g_modal.destroy();
                return;
            }

            if (typeof window.parent.g_modal.hide === 'function') {
                window.parent.g_modal.hide();
            }
        }
    } catch (exception2) {
        // Workspace header X remains available.
    }
}
