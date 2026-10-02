# Knowledge article visibility

A user may see a Knowledge Base and an article count while failing article eligibility checks. Test Knowledge Base access separately from article access.

1. Impersonate the affected user in a suitable test environment.
2. Check the article's lifecycle, validity dates and version state.
3. Review Knowledge Base and article User Criteria, including exclusions.
4. Validate tables and fields used in advanced criteria against the instance dictionary.
5. Compare one allowed user with one denied user using a known test article.

For example, a criterion that queries a custom project-membership table using a nonexistent `user` field can fail to evaluate the intended relationship. Use the actual member/contact reference field and verify its relationship to the current user.

Correct the criterion and retest; do not replace a failed membership check with broad article access. Use synthetic membership records for practice.
