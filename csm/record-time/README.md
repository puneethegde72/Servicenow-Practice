# Record time practice component

Stage several time entries against a Task and submit them to `task_time_worked`. The server resolves the Task, uses the signed-in user and recalculates allocation before inserting records.

## Components

- `source/script-includes/PracticeTimeEntryAjaxV2.js`
- `source/ui-page/practice_record_time_v2.html`
- `source/ui-page/practice_record_time_v2.client.js`
- Four example UI Action scripts for Cases and Customer Projects in Classic UI and Workspace.

All custom scoped names use `x_your_scope`. Replace that placeholder consistently with your own application scope. Keep the custom Script Include class name and the UI Page name consistent across the source and ServiceNow records.

## Allocation behaviour

Each `user + work_date + u_time_slot` has a configured capacity of 3,600 seconds. Existing database usage and staged entries consume that capacity. Remaining duration rolls forward through consecutive slots.

For example, if `09_10` already contains 30 minutes, a new three-hour entry starting there allocates 30 minutes to `09_10`, 60 to `10_11`, 60 to `11_12` and 30 to `12_13`.

Submit All recalculates on the server and validates entries before insertion. A failed insertion triggers best-effort cleanup of rows created by that request. This is not an atomic transaction: cleanup can fail and downstream side effects may already have occurred. Concurrent submissions can also exceed slot capacity without a separate locking or schema constraint.

The example does not populate `u_work_type`; add your own approved classification logic if needed. Optional `u_reporting_project` enrichment resolves a Customer Project directly or through a Case's `project` reference.

See [configuration](docs/configuration.md) before installing the component. Local allocation tests exercise the server's allocation logic with mocks; they do not verify ServiceNow access controls, inserts or UI rendering.
