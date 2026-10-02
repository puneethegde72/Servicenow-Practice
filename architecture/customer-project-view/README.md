# Customer Project view architecture

A custom view can simplify navigation and data entry over `customer_project` and related Cases. Field or related-list visibility does not establish that workflow, access controls or reporting logic exists behind it.

Keep custom UI focused on the experience. Put authorisation, validation and automation in supported platform components, and assess existing CSM/project capabilities before adding bespoke code. Available features depend on the installed plugins and licensing.

For effort reporting, `task_time_worked.task` can reference a Customer Project directly or a support Case. Correlate Case work to the project's existing reference rather than maintaining a second manually entered identifier.

Define the period, assignment scope and duration units consistently across reports. Configure auditing for fields that need traceability and verify who can read and update them.

Use reusable flows/subflows where configuration meets the requirement. Where scripts are needed, document their inputs, outputs, access checks and side effects. Validate UI, workflow and report access independently with the intended roles.
