# Area of Work breakdown

Use a custom choice field such as `task_time_worked.u_area_of_work`. Define your own technical values, for example `research`, `development`, `support` and `reporting`.

Create a PA breakdown source and mapping that agree on their identifier contract. If the source is based on `sys_choice`, resolve the actual choice record. If it uses PA buckets, return the numeric value expected by the configured bucket mapping. Labels are for presentation; technical values are stable mapping keys.

When every score shows an unspecified area:

1. Check that the underlying choice values are populated and valid.
2. Verify the source records and bucket group or choice conditions.
3. Test the mapping with representative populated and empty records.
4. Confirm indicator-breakdown associations and collection settings.
5. Recollect the affected periods and refresh the visualisation.

Reconcile hours by area to the same Time Worked population used by the total-hours indicator. Keep an explicit unspecified bucket for empty values.
