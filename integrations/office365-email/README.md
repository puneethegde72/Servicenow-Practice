# ServiceNow Email Integration — Microsoft 365

## Purpose

Implementation checklist for configuring an existing organisational support mailbox with ServiceNow for inbound and outbound email.

Use separate mailbox/configuration details for non-production and production where the environment strategy requires it.

## Information required from Microsoft 365 / messaging team

### Mailboxes

- Non-production support mailbox address
- Production support mailbox address
- Display name / sender identity
- Whether the mailbox is shared or user-backed
- Whether ServiceNow is permitted to send as or send on behalf of the address

### Authentication

Confirm the authentication method approved by the Microsoft 365 tenant and supported by the ServiceNow release in use. Where OAuth is required, obtain the application/tenant configuration through the organisation's normal identity-management process rather than storing passwords in development documentation.

Required identity information may include:

- Microsoft Entra tenant ID
- application/client ID
- approved authentication flow
- redirect/callback details where applicable
- required API/mail permissions and admin consent status
- certificate/secret ownership and rotation process, if used

Do not commit credentials or secrets to this repository.

### Inbound mail

Confirm the approved inbound-mail protocol/service and connection details. If IMAP is used, obtain:

- IMAP host
- port
- TLS/SSL requirement
- authentication method
- mailbox/folder requirements
- firewall/network restrictions

### Outbound mail

Confirm the approved outbound-mail method. If SMTP is used, obtain:

- SMTP host
- port
- STARTTLS/TLS requirement
- authentication method
- relay restrictions
- accepted From addresses
- send-as permissions
- throttling/message limits relevant to ServiceNow

## ServiceNow validation

For each environment:

1. Configure the Email Account using the tenant-approved authentication method.
2. Test inbound connectivity.
3. Test outbound connectivity.
4. Confirm the expected From/Reply-To address.
5. Validate inbound actions against representative support emails.
6. Confirm production and non-production cannot accidentally consume each other's mailbox traffic.
7. Verify notification links point to the correct ServiceNow environment.
8. Validate monitoring/error handling for failed authentication and failed sends.

## Security

Never store mailbox passwords, OAuth client secrets, private keys or access tokens in source control. Keep only configuration requirements, non-secret identifiers and operational runbooks here.
