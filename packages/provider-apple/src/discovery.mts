import { parameters, text } from '@crowsi/provider-http-transport/local-control'
import type { LocalOperation } from '@crowsi/provider-http-transport/local-control'
export const discoveryOperations: readonly LocalOperation[] = [
  { id: 'apps.page-read', effect: 'read', requiredPermissions: ['App Store Connect API key with app access'],
    build(input) { const p = parameters(input, ['cursor']); const query = new URLSearchParams({ limit: '20' })
      if (p.cursor !== null) query.set('cursor', text(p.cursor, 2048))
      return { method: 'GET', url: `https://api.appstoreconnect.apple.com/v1/apps?${query}` } } },
]
