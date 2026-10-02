# Support management analytics

Configuration reference for a dashboard combining Case activity with project and support effort. Use generic indicator names and create all PA records in your own instance.

## Case indicators

Facts table: `sn_customerservice_case`.

| Indicator | Date/condition |
|---|---|
| Cases Received | `opened_at` in the collection period |
| Cases Resolved | `resolved_at` in the collection period |
| Cases Closed | `closed_at` in the collection period |
| Active Cases | `active=true` at collection time |

Apply the support scope you need, using an assignment group selected in your instance. Do not compare a period count with an active snapshot as if they represented the same measure.

## Project breakdown

- Breakdown source table: `customer_project`; field: `sys_id`.
- Example condition: `active=true^assignment_group=YOUR_GROUP_SYS_ID`.
- Case mapping: `project` reference.
- Time Worked mapping: return the Task itself for `customer_project`, or the Case's project for `sn_customerservice_case`.

Replace `YOUR_GROUP_SYS_ID` outside source control. Validate active/inactive project inclusion against your reporting period so historical work is not accidentally excluded.

## Time indicators

Source table: `task_time_worked`. Use `work_date` as the collection date and sum `time_in_seconds` for duration. Scope the source to the intended Task classes and assignment group using the condition builder, then verify the generated query against list results.

Create a base duration indicator and an hours formula indicator:

```text
Hours = Duration in seconds / 3600
```

Insert the base indicator reference through your instance's formula editor. Do not copy another instance's indicator ID. Configure null handling and precision explicitly.

## Other breakdowns

| Breakdown | Mapping |
|---|---|
| Work Type | Bucket `1` for Customer Project work, `2` for Support Case work |
| Agent | Time Worked `user`; optionally limit source users by group membership |
| Area of Work | Your `u_area_of_work` technical choices or configured PA buckets |

Validate bucket boundaries and the mapping identifier expected by your breakdown source. In PA script contexts that restrict `current` references, use the supported element access pattern for your instance, for example `current.task ? current.task.toString() : ''`, and test it with the collector.

## Collection and dashboard

Configure daily collection and a suitable historical backfill, for example the previous 30 complete days. Use your reporting timezone. Recollect affected periods after changing a breakdown mapping.

Dashboard filters: Project and Reporting Period. Suggested views: received/resolved/active Case cards, total/project/support hours, hours by Work Type, hours by Agent and a daily time trend.

Confirm the combinations supported by your PA implementation. A classic pairwise breakdown matrix does not establish support for a simultaneous Project + Work Type + Agent intersection; use underlying records when the required intersection is unavailable.

For a selected project and period, reconcile:

```text
Total hours = Customer Project hours + Support Case hours
```

Compare against underlying Time Worked records and test report/dashboard access with the intended roles. The time-recording component does not populate `u_work_type`; implement that field's derivation separately if you choose to use it.

See [Area of Work](area-of-work/README.md) and [raw exports](raw-data-exports/README.md) for related configurations.
