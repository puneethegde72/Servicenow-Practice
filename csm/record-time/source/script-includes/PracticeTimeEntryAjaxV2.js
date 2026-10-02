var PracticeTimeEntryAjaxV2 = Class.create();

PracticeTimeEntryAjaxV2.prototype = Object.extendsObject(
    global.AbstractAjaxProcessor,
    {
        TIME_TABLE: 'task_time_worked',
        TASK_TABLE: 'task',
        MAX_SECONDS_PER_SLOT: 3600,
        MAX_DURATION_SECONDS: 43200,
        MAX_LOGICAL_ENTRIES: 50,
        MAX_CREATED_RECORDS: 100,
        MAX_COMMENT_LENGTH: 4000,

        validateContext: function() {
            try {
                var taskSysId = String(
                    this.getParameter('sysparm_task_sys_id') || ''
                );

                var taskContext = this._resolveTask(taskSysId);

                if (!taskContext.success) {
                    return this._json({
                        success: false,
                        message: taskContext.message
                    });
                }

                var createError = this._getCreateAccessError();

                if (createError) {
                    return this._json({
                        success: false,
                        message: createError
                    });
                }

                return this._json({
                    success: true,
                    taskSysId: taskContext.taskSysId,
                    taskDisplay: taskContext.taskDisplay,
                    taskClass: taskContext.taskClass
                });
            } catch (exception) {
                gs.error(
                    'PracticeTimeEntryAjaxV2.validateContext: ' +
                    exception.message
                );

                return this._json({
                    success: false,
                    message: 'Record Time could not be initialised.'
                });
            }
        },

        previewEntry: function() {
            try {
                var workDate = String(
                    this.getParameter('sysparm_work_date') || ''
                );

                var startSlot = String(
                    this.getParameter('sysparm_start_slot') || ''
                );

                var durationSeconds = parseInt(
                    this.getParameter('sysparm_duration_seconds'),
                    10
                ) || 0;

                if (!this._isValidDate(workDate)) {
                    return this._json({
                        success: false,
                        message: 'A valid Work Date is required.'
                    });
                }

                if (!startSlot) {
                    return this._json({
                        success: false,
                        message: 'Time Slot is required.'
                    });
                }

                if (
                    durationSeconds <= 0 ||
                    durationSeconds > this.MAX_DURATION_SECONDS
                ) {
                    return this._json({
                        success: false,
                        message: 'Time worked is invalid.'
                    });
                }

                var timeSlots = this._getTimeSlotOptions();
                var slotMap = this._choiceMap(timeSlots);

                if (!timeSlots.length) {
                    return this._json({
                        success: false,
                        message: 'No Time Slot choices are configured.'
                    });
                }

                if (!slotMap[startSlot]) {
                    return this._json({
                        success: false,
                        message: 'The selected Time Slot is invalid.'
                    });
                }

                var existingUsage = this._getExistingUsageForDate(
                    gs.getUserID(),
                    workDate
                );

                var pendingUsage = {};
                var pendingText = String(
                    this.getParameter('sysparm_pending_usage') || ''
                );

                if (pendingText) {
                    try {
                        pendingUsage = this._normaliseUsageMap(
                            JSON.parse(pendingText),
                            workDate,
                            slotMap
                        );
                    } catch (pendingException) {
                        return this._json({
                            success: false,
                            message: 'Pending Time Worked data is invalid.'
                        });
                    }
                }

                var combinedUsage = this._mergeUsageMaps(
                    existingUsage,
                    pendingUsage
                );

                return this._json(
                    this._allocateDuration(
                        startSlot,
                        durationSeconds,
                        workDate,
                        timeSlots,
                        combinedUsage
                    )
                );
            } catch (exception) {
                gs.error(
                    'PracticeTimeEntryAjaxV2.previewEntry: ' +
                    exception.message
                );

                return this._json({
                    success: false,
                    message: 'Unable to calculate Time Worked.'
                });
            }
        },

        submitEntries: function() {
            var response = {
                success: false,
                createdCount: 0,
                totalSeconds: 0,
                errors: []
            };

            try {
                var payloadText = String(
                    this.getParameter('sysparm_payload') || ''
                );

                if (!payloadText) {
                    response.errors.push('No Time Worked data was supplied.');
                    return this._json(response);
                }

                var payload;

                try {
                    payload = JSON.parse(payloadText);
                } catch (parseException) {
                    response.errors.push(
                        'The submitted Time Worked data is invalid.'
                    );
                    return this._json(response);
                }

                if (!payload || !payload.taskSysId) {
                    response.errors.push(
                        'Source Task information is missing.'
                    );
                    return this._json(response);
                }

                if (
                    !this._isArray(payload.entries) ||
                    !payload.entries.length
                ) {
                    response.errors.push(
                        'No Time Worked entries were supplied.'
                    );
                    return this._json(response);
                }

                if (
                    payload.entries.length >
                    this.MAX_LOGICAL_ENTRIES
                ) {
                    response.errors.push(
                        'A maximum of ' +
                        this.MAX_LOGICAL_ENTRIES +
                        ' entries can be submitted at once.'
                    );
                    return this._json(response);
                }

                var taskContext = this._resolveTask(
                    String(payload.taskSysId)
                );

                if (!taskContext.success) {
                    response.errors.push(taskContext.message);
                    return this._json(response);
                }

                var createError = this._getCreateAccessError();

                if (createError) {
                    response.errors.push(createError);
                    return this._json(response);
                }

                var userId = gs.getUserID();
                var timeSlots = this._getTimeSlotOptions();
                var slotMap = this._choiceMap(timeSlots);
                var areasOfWork = this._getChoiceOptions('u_area_of_work');
                var areaMap = this._choiceMap(areasOfWork);

                if (!timeSlots.length) {
                    response.errors.push(
                        'No Time Slot choices are configured.'
                    );
                    return this._json(response);
                }

                if (!areasOfWork.length) {
                    response.errors.push(
                        'No Area of work choices are configured.'
                    );
                    return this._json(response);
                }

                var i;

                for (i = 0; i < payload.entries.length; i++) {
                    var logicalValidation = this._validateLogicalEntry(
                        payload.entries[i],
                        slotMap,
                        areaMap
                    );

                    if (!logicalValidation.success) {
                        response.errors.push(
                            'Entry ' +
                            (i + 1) +
                            ': ' +
                            logicalValidation.message
                        );
                    }
                }

                if (response.errors.length) {
                    return this._json(response);
                }

                var plannedRecords = [];
                var workingUsage = {};
                var loadedDates = {};
                var plannedNewUsage = {};
                var totalSeconds = 0;

                for (i = 0; i < payload.entries.length; i++) {
                    var entry = payload.entries[i];
                    var workDate = String(entry.workDate);
                    var durationSeconds = parseInt(
                        entry.durationSeconds,
                        10
                    );

                    if (!loadedDates[workDate]) {
                        var dateUsage = this._getExistingUsageForDate(
                            userId,
                            workDate
                        );

                        workingUsage = this._mergeUsageMaps(
                            workingUsage,
                            dateUsage
                        );

                        loadedDates[workDate] = true;
                    }

                    var allocation = this._allocateDuration(
                        String(entry.startSlot),
                        durationSeconds,
                        workDate,
                        timeSlots,
                        workingUsage
                    );

                    if (!allocation.success) {
                        response.errors.push(
                            'Entry ' +
                            (i + 1) +
                            ': ' +
                            allocation.message
                        );
                        continue;
                    }

                    this._applyRecordsToUsage(
                        workingUsage,
                        workDate,
                        allocation.records
                    );

                    this._applyRecordsToUsage(
                        plannedNewUsage,
                        workDate,
                        allocation.records
                    );

                    for (
                        var x = 0;
                        x < allocation.records.length;
                        x++
                    ) {
                        var generated = allocation.records[x];

                        plannedRecords.push({
                            task: taskContext.taskSysId,
                            user: userId,
                            workDate: workDate,
                            category: String(entry.category || ''),
                            timeSlot: generated.value,
                            seconds: generated.seconds,
                            areaOfWork: String(entry.areaOfWork),
                            comments: String(entry.comments || ''),
                            reportingProject:
                                taskContext.reportingProject
                        });
                    }

                    totalSeconds += durationSeconds;
                }

                if (response.errors.length) {
                    return this._json(response);
                }

                if (!plannedRecords.length) {
                    response.errors.push(
                        'No Time Worked records could be generated.'
                    );
                    return this._json(response);
                }

                if (
                    plannedRecords.length >
                    this.MAX_CREATED_RECORDS
                ) {
                    response.errors.push(
                        'This submission would create ' +
                        plannedRecords.length +
                        ' Time Worked records. The maximum permitted ' +
                        'in one submission is ' +
                        this.MAX_CREATED_RECORDS +
                        '.'
                    );
                    return this._json(response);
                }

                var finalCapacity = this._validateExistingUsage(
                    plannedNewUsage,
                    userId,
                    slotMap
                );

                if (!finalCapacity.success) {
                    response.errors = finalCapacity.errors;
                    return this._json(response);
                }

                var createdSysIds = [];

                try {
                    for (
                        var p = 0;
                        p < plannedRecords.length;
                        p++
                    ) {
                        var planned = plannedRecords[p];
                        var record = new GlideRecordSecure(
                            this.TIME_TABLE
                        );

                        record.initialize();
                        record.setValue('task', planned.task);
                        record.setValue('user', planned.user);
                        record.setValue('work_date', planned.workDate);

                        if (planned.category) {
                            record.setValue(
                                'category',
                                planned.category
                            );
                        }

                        record.setValue(
                            'u_time_slot',
                            planned.timeSlot
                        );

                        record.setValue(
                            'time_in_seconds',
                            planned.seconds
                        );

                        var duration = new GlideDuration(
                            planned.seconds * 1000
                        );

                        record.setValue(
                            'time_worked',
                            duration.getValue()
                        );

                        record.setValue(
                            'u_area_of_work',
                            planned.areaOfWork
                        );

                        if (planned.comments) {
                            record.setValue(
                                'comments',
                                planned.comments
                            );
                        }

                        if (
                            planned.reportingProject &&
                            record.isValidField(
                                'u_reporting_project'
                            )
                        ) {
                            record.setValue(
                                'u_reporting_project',
                                planned.reportingProject
                            );
                        }

                        /*
                         * Deliberately do not set u_work_type.
                         * Existing post-insert processing owns it.
                         */

                        var newSysId = record.insert();

                        if (!newSysId) {
                            throw new Error(
                                'Time Worked record ' +
                                (p + 1) +
                                ' could not be created.'
                            );
                        }

                        createdSysIds.push(String(newSysId));
                    }
                } catch (insertException) {
                    this._rollback(createdSysIds);

                    gs.error(
                        'PracticeTimeEntryAjaxV2 insert failure: ' +
                        insertException.message
                    );

                    response.errors.push(
                        'The Time Worked submission could not be completed. ' +
                        'Cleanup was attempted for records created by this ' +
                        'submission. Check the records before retrying.'
                    );

                    return this._json(response);
                }

                response.success = true;
                response.createdCount = createdSysIds.length;
                response.totalSeconds = totalSeconds;
                return this._json(response);
            } catch (exception) {
                gs.error(
                    'PracticeTimeEntryAjaxV2.submitEntries: ' +
                    exception.message
                );

                response.errors.push(
                    'An unexpected error occurred while recording time.'
                );

                return this._json(response);
            }
        },

        _resolveTask: function(taskSysId) {
            var result = {
                success: false,
                taskSysId: '',
                taskDisplay: '',
                taskClass: '',
                reportingProject: '',
                message: ''
            };

            taskSysId = String(taskSysId || '');

            if (!/^[0-9a-fA-F]{32}$/.test(taskSysId)) {
                result.message = 'The source Task is invalid.';
                return result;
            }

            var task = new GlideRecordSecure(this.TASK_TABLE);

            if (!task.get(taskSysId)) {
                result.message =
                    'The source Task could not be found or is inaccessible.';
                return result;
            }

            if (!task.canRead()) {
                result.message =
                    'You do not have access to the source Task.';
                return result;
            }

            result.taskSysId = String(task.getUniqueValue());
            result.taskDisplay = String(
                task.getDisplayValue() || result.taskSysId
            );
            result.taskClass = String(
                task.getValue('sys_class_name') || this.TASK_TABLE
            );
            result.reportingProject = this._resolveReportingProject(
                result.taskClass,
                result.taskSysId
            );
            result.success = true;

            return result;
        },

        _resolveReportingProject: function(taskClass, taskSysId) {
            if (taskClass === 'customer_project') {
                return taskSysId;
            }

            if (taskClass === 'sn_customerservice_case') {
                try {
                    var caseRecord = new GlideRecordSecure(
                        'sn_customerservice_case'
                    );

                    if (
                        caseRecord.get(taskSysId) &&
                        caseRecord.isValidField('project')
                    ) {
                        return String(
                            caseRecord.getValue('project') || ''
                        );
                    }
                } catch (exception) {
                    gs.warn(
                        'PracticeTimeEntryAjaxV2 reporting project lookup failed: ' +
                        exception.message
                    );
                }
            }

            return '';
        },

        _getCreateAccessError: function() {
            var record = new GlideRecordSecure(this.TIME_TABLE);
            record.initialize();

            if (!record.canCreate()) {
                return 'You do not have permission to create Time Worked records.';
            }

            return '';
        },

        _validateLogicalEntry: function(entry, slotMap, areaMap) {
            if (!entry) {
                return {
                    success: false,
                    message: 'Entry information is missing.'
                };
            }

            var workDate = String(entry.workDate || '');

            if (!this._isValidDate(workDate)) {
                return {
                    success: false,
                    message: 'A valid Work Date is required.'
                };
            }

            var startSlot = String(entry.startSlot || '');

            if (!startSlot || !slotMap[startSlot]) {
                return {
                    success: false,
                    message: 'Time Slot is invalid.'
                };
            }

            var areaOfWork = String(entry.areaOfWork || '');

            if (!areaOfWork) {
                return {
                    success: false,
                    message: 'Area of work is required.'
                };
            }

            if (!areaMap[areaOfWork]) {
                return {
                    success: false,
                    message: 'Area of work is invalid.'
                };
            }

            var durationText = String(
                entry.durationSeconds || ''
            );

            if (!/^\d+$/.test(durationText)) {
                return {
                    success: false,
                    message: 'Time worked is invalid.'
                };
            }

            var durationSeconds = parseInt(durationText, 10);

            if (
                durationSeconds <= 0 ||
                durationSeconds > this.MAX_DURATION_SECONDS
            ) {
                return {
                    success: false,
                    message: 'Time worked is invalid.'
                };
            }

            var category = String(entry.category || '');

            if (category.length > 255) {
                return {
                    success: false,
                    message: 'Category is invalid.'
                };
            }

            var comments = String(entry.comments || '');

            if (comments.length > this.MAX_COMMENT_LENGTH) {
                return {
                    success: false,
                    message: 'Comments exceed the maximum permitted length.'
                };
            }

            return { success: true };
        },

        _allocateDuration: function(
            startSlot,
            totalSeconds,
            workDate,
            slots,
            usedCapacity
        ) {
            var result = {
                success: false,
                records: [],
                message: ''
            };

            totalSeconds = parseInt(totalSeconds, 10) || 0;

            if (totalSeconds <= 0) {
                result.message =
                    'Time worked must be greater than zero.';
                return result;
            }

            usedCapacity = usedCapacity || {};

            var startIndex = -1;

            for (var i = 0; i < slots.length; i++) {
                if (
                    String(slots[i].value) ===
                    String(startSlot)
                ) {
                    startIndex = i;
                    break;
                }
            }

            if (startIndex < 0) {
                result.message =
                    'The selected Time Slot is invalid.';
                return result;
            }

            var remaining = totalSeconds;
            var previous = null;

            for (
                var index = startIndex;
                index < slots.length && remaining > 0;
                index++
            ) {
                var current = slots[index];

                if (
                    previous &&
                    !this._areConsecutive(
                        previous.value,
                        current.value
                    )
                ) {
                    result.message =
                        'The configured Time Slots are not consecutive.';
                    return result;
                }

                var key = workDate + '|' + current.value;
                var usedSeconds = parseInt(
                    usedCapacity[key],
                    10
                ) || 0;

                if (usedSeconds < 0) {
                    usedSeconds = 0;
                }

                var availableSeconds = Math.max(
                    0,
                    this.MAX_SECONDS_PER_SLOT - usedSeconds
                );

                if (availableSeconds > 0) {
                    var secondsForSlot = Math.min(
                        remaining,
                        availableSeconds
                    );

                    result.records.push({
                        value: current.value,
                        label: current.label,
                        seconds: secondsForSlot
                    });

                    remaining -= secondsForSlot;
                }

                previous = current;
            }

            if (remaining > 0) {
                result.records = [];
                result.message =
                    'There is not enough available time from the selected ' +
                    'Time Slot through the remaining configured Time Slots.';
                return result;
            }

            result.success = true;
            return result;
        },

        _applyRecordsToUsage: function(usage, workDate, records) {
            if (!usage || !records) {
                return;
            }

            for (var i = 0; i < records.length; i++) {
                var row = records[i];
                var key = workDate + '|' + row.value;

                usage[key] =
                    (parseInt(usage[key], 10) || 0) +
                    (parseInt(row.seconds, 10) || 0);
            }
        },

        _getExistingUsageForDate: function(userId, workDate) {
            var usage = {};
            var aggregate = new GlideAggregate(this.TIME_TABLE);

            aggregate.addQuery('user', userId);
            aggregate.addQuery('work_date', workDate);
            aggregate.addAggregate('SUM', 'time_in_seconds');
            aggregate.groupBy('u_time_slot');
            aggregate.query();

            while (aggregate.next()) {
                var slot = String(
                    aggregate.getValue('u_time_slot') || ''
                );

                if (!slot) {
                    continue;
                }

                usage[workDate + '|' + slot] = parseInt(
                    aggregate.getAggregate(
                        'SUM',
                        'time_in_seconds'
                    ),
                    10
                ) || 0;
            }

            return usage;
        },

        _validateExistingUsage: function(
            requestedUsage,
            userId,
            slotMap
        ) {
            var result = {
                success: true,
                errors: []
            };

            for (var key in requestedUsage) {
                if (!requestedUsage.hasOwnProperty(key)) {
                    continue;
                }

                var parts = key.split('|');

                if (parts.length !== 2) {
                    result.errors.push(
                        'Unable to validate a Time Slot.'
                    );
                    continue;
                }

                var workDate = parts[0];
                var timeSlot = parts[1];
                var requestedSeconds = parseInt(
                    requestedUsage[key],
                    10
                ) || 0;

                var aggregate = new GlideAggregate(
                    this.TIME_TABLE
                );

                aggregate.addQuery('user', userId);
                aggregate.addQuery('work_date', workDate);
                aggregate.addQuery('u_time_slot', timeSlot);
                aggregate.addAggregate('SUM', 'time_in_seconds');
                aggregate.query();

                var existingSeconds = 0;

                if (aggregate.next()) {
                    existingSeconds = parseInt(
                        aggregate.getAggregate(
                            'SUM',
                            'time_in_seconds'
                        ),
                        10
                    ) || 0;
                }

                if (
                    existingSeconds + requestedSeconds >
                    this.MAX_SECONDS_PER_SLOT
                ) {
                    var available = Math.max(
                        0,
                        this.MAX_SECONDS_PER_SLOT -
                        existingSeconds
                    );

                    var label = slotMap[timeSlot]
                        ? slotMap[timeSlot].label
                        : timeSlot;

                    result.errors.push(
                        label +
                        ' now has ' +
                        this._formatDuration(existingSeconds) +
                        ' recorded. Available time is ' +
                        this._formatDuration(available) +
                        '. Please review the entry and submit again.'
                    );
                }
            }

            result.success = result.errors.length === 0;
            return result;
        },

        _normaliseUsageMap: function(
            rawUsage,
            workDate,
            slotMap
        ) {
            var clean = {};

            if (!rawUsage) {
                return clean;
            }

            for (var key in rawUsage) {
                if (!rawUsage.hasOwnProperty(key)) {
                    continue;
                }

                var parts = String(key).split('|');

                if (parts.length !== 2) {
                    continue;
                }

                if (parts[0] !== workDate) {
                    continue;
                }

                var slot = parts[1];

                if (!slotMap[slot]) {
                    continue;
                }

                var seconds = parseInt(rawUsage[key], 10) || 0;

                if (seconds <= 0) {
                    continue;
                }

                clean[workDate + '|' + slot] = Math.min(
                    seconds,
                    this.MAX_SECONDS_PER_SLOT
                );
            }

            return clean;
        },

        _mergeUsageMaps: function(first, second) {
            var result = {};
            var key;

            if (first) {
                for (key in first) {
                    if (first.hasOwnProperty(key)) {
                        result[key] = parseInt(first[key], 10) || 0;
                    }
                }
            }

            if (second) {
                for (key in second) {
                    if (second.hasOwnProperty(key)) {
                        result[key] =
                            (result[key] || 0) +
                            (parseInt(second[key], 10) || 0);
                    }
                }
            }

            return result;
        },

        _getChoiceOptions: function(fieldName) {
            var language = 'en';

            try {
                language = String(
                    gs.getSession().getLanguage() || 'en'
                );
            } catch (exception) {
                language = 'en';
            }

            var result = this._queryChoiceOptions(
                fieldName,
                language
            );

            if (!result.length && language !== 'en') {
                result = this._queryChoiceOptions(
                    fieldName,
                    'en'
                );
            }

            if (!result.length) {
                result = this._queryChoiceOptions(
                    fieldName,
                    ''
                );
            }

            var clean = [];
            var seen = {};

            for (var i = 0; i < result.length; i++) {
                var value = String(result[i].value || '');

                if (!value || seen[value]) {
                    continue;
                }

                seen[value] = true;
                clean.push(result[i]);
            }

            return clean;
        },

        _queryChoiceOptions: function(fieldName, language) {
            var result = [];
            var choice = new GlideRecord('sys_choice');

            choice.addQuery('name', this.TIME_TABLE);
            choice.addQuery('element', fieldName);
            choice.addQuery('inactive', false);

            if (language) {
                choice.addQuery('language', language);
            }

            choice.orderBy('sequence');
            choice.orderBy('label');
            choice.query();

            while (choice.next()) {
                var value = String(
                    choice.getValue('value') || ''
                );

                if (!value) {
                    continue;
                }

                result.push({
                    value: value,
                    label: String(
                        choice.getValue('label') || value
                    ),
                    sequence: parseInt(
                        choice.getValue('sequence'),
                        10
                    ) || 0
                });
            }

            return result;
        },

        _getTimeSlotOptions: function() {
            var slots = this._getChoiceOptions('u_time_slot');
            var self = this;

            slots.sort(function(first, second) {
                var firstSlot = self._parseSlot(first.value);
                var secondSlot = self._parseSlot(second.value);

                if (firstSlot && secondSlot) {
                    return firstSlot.start - secondSlot.start;
                }

                return (
                    (parseInt(first.sequence, 10) || 0) -
                    (parseInt(second.sequence, 10) || 0)
                );
            });

            return slots;
        },

        _choiceMap: function(choices) {
            var map = {};

            for (var i = 0; i < choices.length; i++) {
                map[String(choices[i].value)] = choices[i];
            }

            return map;
        },

        _areConsecutive: function(previousValue, currentValue) {
            var previous = this._parseSlot(previousValue);
            var current = this._parseSlot(currentValue);

            if (!previous || !current) {
                return false;
            }

            return previous.end === current.start;
        },

        _parseSlot: function(value) {
            var match = String(value || '').match(
                /^(\d{2})_(\d{2})$/
            );

            if (!match) {
                return null;
            }

            var start = parseInt(match[1], 10);
            var end = parseInt(match[2], 10);

            if (isNaN(start) || isNaN(end)) {
                return null;
            }

            return {
                start: start,
                end: end
            };
        },

        _isValidDate: function(value) {
            value = String(value || '');

            if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                return false;
            }

            try {
                var date = new GlideDate();
                date.setValue(value);
                return String(date.getValue()) === value;
            } catch (exception) {
                return false;
            }
        },

        _rollback: function(sysIds) {
            if (!sysIds || !sysIds.length) {
                return;
            }

            for (var i = 0; i < sysIds.length; i++) {
                try {
                    var record = new GlideRecord(this.TIME_TABLE);

                    if (record.get(sysIds[i])) {
                        record.deleteRecord();
                    }
                } catch (exception) {
                    gs.error(
                        'PracticeTimeEntryAjaxV2 rollback failure for ' +
                        sysIds[i] +
                        ': ' +
                        exception.message
                    );
                }
            }
        },

        _formatDuration: function(seconds) {
            seconds = parseInt(seconds, 10) || 0;

            var hours = Math.floor(seconds / 3600);
            var minutes = Math.floor((seconds % 3600) / 60);

            if (hours && minutes) {
                return hours + 'h ' + minutes + 'm';
            }

            if (hours) {
                return hours + 'h';
            }

            return minutes + 'm';
        },

        _isArray: function(value) {
            return (
                Object.prototype.toString.call(value) ===
                '[object Array]'
            );
        },

        _json: function(value) {
            return JSON.stringify(value);
        },

        type: 'PracticeTimeEntryAjaxV2'
    }
);
