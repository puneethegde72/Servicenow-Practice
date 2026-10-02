# Raw support and project exports

Use list/report views over existing records when a full dimensional intersection is needed. Set the reporting period explicitly, for example a two-week interval, and use consistent timezone and end-date semantics.

| Export | Table and scope | Useful columns |
|---|---|---|
| Project Time | `task_time_worked`, Task class `customer_project` | Work Date, User, Task, duration, Area of Work, Time Slot |
| Case Time | `task_time_worked`, Task class `sn_customerservice_case` | Work Date, User, Case, linked Project, duration, Area of Work |
| Case activity | `sn_customerservice_case`, selected support group | Number, Project, Priority, State, Assigned To, Opened/Resolved/Closed At |

For Case Time, correlate Time Worked `task` to the Case and then its `project` reference. Test any dot-walked fields in your instance.

Choose whether a Case export represents received, resolved or closed activity, or a current snapshot. These populations use different date filters.

Restrict report and export access to the intended users. Generated exports can contain personal and operational data; keep them outside this public repository.
