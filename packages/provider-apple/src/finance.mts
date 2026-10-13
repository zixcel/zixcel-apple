import { createHash } from 'node:crypto'
import { gunzipSync } from 'node:zlib'
import { createProviderHttpTransport } from '@crowsi/provider-http-transport'
import { parameters, text } from '@crowsi/provider-http-transport/local-control'
import type { LocalOperation } from '@crowsi/provider-http-transport/local-control'
const origin = 'https://api.appstoreconnect.apple.com'
export const financeOperations: readonly LocalOperation[] = [{
  id: 'billing.finance-report', effect: 'read', requiredPermissions: ['App Store Connect finance-report access for selected vendor'],
  build(input) {
    const p = parameters(input, ['vendorNumber', 'regionCode', 'reportDate'])
    const vendor = text(p.vendorNumber, 12), region = text(p.regionCode, 2), date = text(p.reportDate, 7)
    if (!/^[0-9]{6,12}$/.test(vendor) || !/^[A-Z0-9]{2}$/.test(region)
      || !/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(date)) throw new Error('provider/input/finance-report')
    const query = new URLSearchParams({ 'filter[vendorNumber]': vendor, 'filter[regionCode]': region,
      'filter[reportDate]': date, 'filter[reportType]': 'FINANCIAL' })
    return { method: 'GET', url: `${origin}/v1/financeReports?${query}` }
  },
}]

/** Strict bounded TSV retains vendor columns/decimal text; it performs no tax/FX inference. */
export function decodeFinanceReport(bytes: Uint8Array, encoded: boolean) {
  if (bytes.byteLength > 1048576) throw new Error('provider/finance/compressed-limit')
  let plain: Uint8Array
  try { plain = encoded ? gunzipSync(bytes, { maxOutputLength: 8388608 }) : bytes }
  catch { throw new Error('provider/finance/compression-invalid') }
  const value = new TextDecoder('utf-8', { fatal: true }).decode(plain)
  const lines = value.replace(/^\uFEFF/, '').split(/\r?\n/)
  if (lines.at(-1) === '') lines.pop()
  if (lines.length < 1 || lines.length > 10001) throw new Error('provider/finance/row-limit')
  const header = lines.shift()!.split('\t')
  if (header.length < 1 || header.length > 64 || header.some(v => !v || v.length > 256)
    || new Set(header).size !== header.length) throw new Error('provider/finance/header-invalid')
  const rows = lines.map(line => {
    const fields = line.split('\t')
    if (fields.length !== header.length || fields.some(v => v.length > 4096)) throw new Error('provider/finance/row-invalid')
    return fields
  })
  return { format: 'apple-finance-tsv', sourceDigest: createHash('sha256').update(bytes).digest('hex'), header, rows }
}
export function financeResponseAdapter(implementation: typeof fetch = globalThis.fetch): typeof fetch {
  const transport = createProviderHttpTransport({ allowedOrigins: [origin], fetchImplementation: implementation,
    maximumRequestBytes: 65536, maximumResponseBytes: 1048576, timeoutMs: 15000 })
  return async (input, init) => {
    if (typeof input !== 'string' || input.split('?')[0] !== `${origin}/v1/financeReports`) return implementation(input, init)
    const result = await transport.request({ url: input, method: 'GET', headers: init?.headers, signal: init?.signal ?? undefined })
    if (result.status !== 200) return new Response('{}', { status: result.status })
    const encoded = result.body[0] === 0x1f && result.body[1] === 0x8b
    if (!encoded && result.headers.get('content-encoding') !== 'gzip') throw new Error('provider/finance/format-invalid')
    const report = decodeFinanceReport(result.body, encoded)
    const query = new URL(input).searchParams
    const body = JSON.stringify({ ...report, scope: { vendorNumber: query.get('filter[vendorNumber]'),
      regionCode: query.get('filter[regionCode]'), fiscalMonth: query.get('filter[reportDate]') } })
    if (Buffer.byteLength(body) > 1048576) throw new Error('provider/finance/normalized-limit')
    return new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
}
