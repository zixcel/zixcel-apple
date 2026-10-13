import assert from 'node:assert/strict'
import test from 'node:test'
import { gzipSync } from 'node:zlib'
import { decodeFinanceReport } from '../dist/finance.mjs'
import { createControl } from '../dist/index.mjs'
const account = { provider: 'apple-appstoreconnect', account: 'synthetic-issuer', subject: 'synthetic-key' }
test('bounded gzip TSV keeps decimal text, fiscal scope and source bytes through the one-use control', async () => {
  let calls = 0
  const control = createControl(account, { acquire: async () => 'synthetic-never-real-credential' }, async () => {
    calls++; return new Response(gzipSync('Amount\tCurrency\n12345678901234567890.123\tUSD\n'))
  })
  const plan = control.prepare('billing.finance-report', { vendorNumber: '123456789', regionCode: 'Z1', reportDate: '2026-09' })
  assert.equal(new URL(plan.request.url).searchParams.get('filter[reportType]'), 'FINANCIAL')
  const grant = control.approve(plan, Date.now() + 10000)
  const result = await control.execute(grant.id, plan)
  assert.deepEqual(result.data.rows, [['12345678901234567890.123', 'USD']])
  assert.equal(result.data.scope.fiscalMonth, '2026-09')
  assert.match(result.data.sourceDigest, /^[a-f0-9]{64}$/)
  await assert.rejects(control.execute(grant.id, plan), /unknown/)
  assert.equal(calls, 1)
})
test('compression bombs and inconsistent/duplicate headers fail closed', () => {
  assert.throws(() => decodeFinanceReport(gzipSync('x'.repeat(8388609)), true), /compression-invalid/)
  for (const text of ['A\tA\n1\t2\n', 'A\tB\n1\n']) {
    assert.throws(() => decodeFinanceReport(gzipSync(text), true), /invalid/)
  }
})
