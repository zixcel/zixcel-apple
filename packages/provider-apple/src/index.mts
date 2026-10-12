import { createLocalProviderControl, parameters, segment, text } from '@crowsi/provider-http-transport/local-control'
import type { CredentialSource, LocalAccount, LocalOperation } from '@crowsi/provider-http-transport/local-control'
const origin = 'https://api.appstoreconnect.apple.com'
export const operations: readonly LocalOperation[] = Object.freeze([
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
  return createLocalProviderControl({ account, credentials, operations: [...operations, ...extensions], allowedOrigins: [origin], fetchImplementation })
}
