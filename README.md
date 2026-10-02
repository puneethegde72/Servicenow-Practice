# ServiceNow Practice

Reusable ServiceNow examples, widget source and configuration guides for learning and personal development instances.

## Examples

| Component | Contents | Readiness |
|---|---|---|
| [Guided intake widget](guided-intake-widget/README.md) | Theme-aware catalog wrapper, page progress and review navigation | Widget source; validate against your catalog item |
| [Training catalogue](service-portal/training-catalogue/README.md) | Category tree, search, filters, pagination and course modal | Five copy-ready widget fields; custom tables required |
| [Record time](csm/record-time/README.md) | Script Include, UI Page and Classic/Workspace UI Actions | Source package; configure scope, fields and access |
| [Training suggestions](csm/training-suggestions/README.md) | Client-side project/contact training selection | Client reference; HTML and server implementation required |
| [Support analytics](performance-analytics/support-management/README.md) | Case/time indicators, project and work-type breakdowns | Configuration guide; PA entitlement required |
| [Knowledge versioning](knowledge-management/versioning-checkout/README.md) | Diagnose an inconsistent latest-version flag | Troubleshooting guide |
| [Knowledge visibility](knowledge-management/article-visibility/README.md) | Validate article eligibility and membership criteria | Troubleshooting guide |
| [Email integration](integrations/office365-email/README.md) | Microsoft 365 mailbox configuration checklist | Integration reference |
| [Customer project view](architecture/customer-project-view/README.md) | UI, effort reporting and project correlation design | Architecture reference |
| [Enterprise AI knowledge](architecture/enterprise-ai-knowledge/README.md) | Source access, grounding, governance and audit design | Architecture reference |
| [Update-set tools](tools/update-sets/README.md) | Parse metadata or extract source from an XML export | Local developer utilities |

## Start here

1. Use a personal development or other non-production instance.
2. Choose a component and read its configuration guide.
3. Replace `x_your_scope` with your own custom application scope wherever it appears. Confirm the generated API names and UI Page endpoints in your instance.
4. Create the documented custom tables, fields and choices. Configure ACLs and cross-scope access for the intended users.
5. Test with both an allowed user and a denied user before adapting the example further.

These are examples, not an importable update set or a supported ServiceNow product. CSM, Performance Analytics and other installed capabilities may require separate plugins or entitlements. Runtime testing inside a ServiceNow instance is required.

## Local checks

```bash
python3 tools/check_public_content.py
node --test guided-intake-widget/navigation.test.js csm/record-time/allocation.test.js
```

The content check detects common accidental disclosures; review changes manually as well. See [public-content guidance](docs/PUBLIC_CONTENT.md) and [validation notes](docs/VALIDATION.md).
