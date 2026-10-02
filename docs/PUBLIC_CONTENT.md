# Public content guidance

This repository contains generic code and examples. Configuration names, custom classes and DOM identifiers use practice-oriented names; scoped APIs use the explicit placeholder `x_your_scope`.

Do not add employer or customer names, programme names, internal domains, mailbox addresses, employee names, live record numbers, instance-specific identifiers, credentials or operational data.

Keep exported update-set inventories, raw XML, HAR files, logs, screenshots and extracted record metadata outside this repository. The developer tools can produce those files locally, and their output may contain sensitive information. Their output is not automatically anonymised.

When publishing an adapted example, create a clean copy of the selected source files. Do not transfer private Git history, private issues or private pull-request discussions into the public repository. Replacing a file on the latest branch does not remove its earlier versions from Git history.

Use descriptive placeholders such as `YOUR_GROUP_SYS_ID` in documentation instead of real identifiers. Set real instance values in your development instance, outside source control.

Run `python3 tools/check_public_content.py`, inspect new and renamed paths, and review the complete diff before committing. The check covers common identifier, contact and credential patterns; it cannot establish ownership or detect every sensitive business detail.
