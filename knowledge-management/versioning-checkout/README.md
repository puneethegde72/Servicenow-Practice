# Missing Knowledge Checkout action

An inconsistent `latest` flag across an article's versions can affect Checkout and versioning behaviour. Inspect the complete version family before changing records.

Check article number, version, `latest`, `workflow_state`, `active`, validity dates and record identifiers in your own instance. Confirm the intended current published version and whether an older non-current version is still marked latest.

If that pattern is confirmed, reproduce it in non-production and prepare a targeted correction to the stale flag on the affected version only. Capture the original value for backout. Avoid a bulk update across all Knowledge articles.

After the correction, confirm that the expected version is current and test Checkout with an appropriate user. Validate versioning configuration, approvals and article eligibility separately if symptoms remain.

This guide contains no live article numbers, instance IDs or ready-to-run data repair script. Use your organisation's normal change process for a production correction.
