# @zixcel/provider-apple

Local administrator operations composed with Crowsi's one-use HTTP control.

Initial runtime profile: App Store Connect; Calendar/Contacts/iCloud are separate unimplemented runtime profiles.
This is the Node runtime package, separate from any existing Rust planning API.

## Install

```sh
npm install @zixcel/provider-apple
```

Registry publication is a separate gate; the initial candidate is not declared
published until its official archive and provenance are verified.

## Initial catalog

App Store Connect app metadata and primary-locale changes. No iCloud runtime or Sales/Finance binary report decoder is claimed.

## Trusted owner composition

```js
import { createControl } from '@zixcel/provider-apple'
const control = createControl(account, credentialSource)
const plan = control.prepare(operationId, input)
// Present method, URL, exact body, effect and permissions to the administrator.
const grant = control.approve(plan, Date.now() + 30_000)
const receipt = await control.execute(grant.id, plan)
```

The account identifies provider, subject and account scope. The trusted owner
supplies credentials; callers never receive the bearer token. Only expose an
execute port to generated code, and run it in a separately restricted workload.
Local approval does not grant remote provider permissions. Required permissions
are operation metadata, not proof of effective access or complete IAM inventory.

Read and write use the same prepare/approve/execute protocol. There is no login,
network request, keyring lookup, cloud mutation or billing action on import.
Unknown operations and extra input fields are rejected. Pagination is not
followed automatically; review a separate request for every additional page.

The optional fourth argument is a trusted-owner extension catalog. Extensions
must declare their method, exact resource mapping, input validation, effect and
permission requirements. The same account/destination/body/grant boundary applies.
Never let an LLM supply that catalog or acquire a new grant without owner review.

## Test isolation

```sh
npm ci --ignore-scripts
npm test
```

Tests inject fake credentials and fake HTTP state. They verify read and write,
changed resource rejection and permission denial without reading the host's
credential stores or contacting provider accounts. These tests do not establish
actual-account acceptance. Production connection is a later, separate operation.

The first catalog is intentionally bounded. Binary finance reports, complete
provider IAM introspection, continuous polling and destructive operations are
not implemented by this release. Do not substitute planning for observed rights,
or estimates for final provider invoices.

Apache-2.0. See LICENSE and NOTICE. Source: zixcel/zixcel-apple.

## Administrator discovery (new source catalog)

`serviceProfile` describes the actual account scope, credential source, bounded operation list, and limits of permission/billing coverage. It contains no credentials, performs no login/request and reports `not-observed`; required permissions remain declarations. Discovery is a separate one-use reviewed read, not automatic account selection or authorization. Each cursor/page requires its own plan and grant. Source additions are not contained in the previously published package version until a new release is accepted.

`apps.page-read` uses an explicit cursor (`null` for the initial page). App listing does not establish finance or key-role access.

## Finance reports (new source behavior)

`billing.finance-report` accepts `vendorNumber`, `regionCode` and explicit fiscal `reportDate` (`YYYY-MM`). The request fixes `reportType=FINANCIAL`; fiscal months are not converted into invented calendar invoice periods. A reviewed one-use grant retrieves at most 1 MiB of HTTP bytes, gunzip is capped at 8 MiB, and normalized output is capped at 1 MiB, 10000 rows and 64 columns. Header names must be unique and row widths consistent. Unsupported encoding/layout, truncation, oversized data and denied access fail rather than returning partial totals.

The receipt retains original source digest, requested fiscal/vendor/region scope, header and raw text rows. Decimal amounts remain text for shared exact arithmetic. A TSV report is not automatically an invoice, a payment authority or a tax/FX rule; normalization must explicitly select the correct vendor fields. Token/key roles and availability still need account-specific acceptance.

Primary reference: [Apple financeReports](https://developer.apple.com/documentation/appstoreconnectapi/get-v1-financereports). Tests use synthetic gzip/TSV and injected fake credentials only.
