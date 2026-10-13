import { financeOperations, financeResponseAdapter } from './finance.mjs'
import { discoveryOperations } from './discovery.mjs'
import { createLocalProviderControl, parameters, segment, text } from '@crowsi/provider-http-transport/local-control'
import type { CredentialSource, LocalAccount, LocalOperation } from '@crowsi/provider-http-transport/local-control'
const origin = 'https://api.appstoreconnect.apple.com'
export const operations: readonly LocalOperation[] = Object.freeze([
  ...discoveryOperations,
  ...financeOperations,
  { id: 'account.read', effect: 'read', requiredPermissions: ['App Store Connect API key with app access'],
    build(input) { parameters(input, []); return { method: 'GET', url: `${origin}/v1/apps?limit=20` } } },
  { id: 'app.read', effect: 'read', requiredPermissions: ['App Store Connect API key with app access'],
    build(input) { const p = parameters(input, ['app']); return { method: 'GET', url: `${origin}/v1/apps/${segment(p.app)}` } } },
  { id: 'app.set-locale', effect: 'write', requiredPermissions: ['App Store Connect role allowing app metadata changes'],
    build(input) { const p = parameters(input, ['app', 'locale']); const locale = text(p.locale, 16)
      if (!/^[a-z]{2,3}(-[A-Za-z]{2,4}){0,2}$/.test(locale)) throw new Error('provider/input/locale')
      return { method: 'PATCH', url: `${origin}/v1/apps/${segment(p.app)}`, body: JSON.stringify({
        data: { type: 'apps', id: segment(p.app), attributes: { primaryLocale: locale } } }) } } },
])
export function createControl(account: LocalAccount, credentials: CredentialSource, fetchImplementation?: typeof fetch, extensions: readonly LocalOperation[] = []) {
  if (account.provider !== 'apple-appstoreconnect') throw new Error('provider/account/mismatch')
  segment(account.account)
  return createLocalProviderControl({ account, credentials, operations: [...operations, ...extensions], allowedOrigins: [origin], fetchImplementation: financeResponseAdapter(fetchImplementation) })
}

export const serviceProfile = Object.freeze({
  provider: "apple-appstoreconnect",
  accountScope: "App Store Connect issuer/account context; app discovery shows only accessible apps.",
  credentialSource: "Owner-owned App Store Connect JWT source; private signing keys remain outside generated code.",
  permissionCoverage: "Visible apps do not establish all key roles or finance report access.",
  billingCoverage: "Bounded finance TSV reports retain source digest, columns and exact decimal text; they are not normalized invoices or tax/FX decisions.",
  permissionState: 'not-observed' as const,
  operations: Object.freeze(operations.map(({ id, effect, requiredPermissions }) =>
    Object.freeze({ id, effect, requiredPermissions: Object.freeze([...requiredPermissions]) }))),
})
