import test from 'node:test'
import assert from 'node:assert/strict'
import { whatsappUrl } from '../src/lib/whatsapp.ts'

test('tautan WhatsApp hanya dibuat untuk nomor resmi berformat 62', () => {
  assert.equal(whatsappUrl('6281234567890', 'SDN 03 Wonosari'), 'https://wa.me/6281234567890?text=Halo%20SDN%2003%20Wonosari%2C%20saya%20ingin%20bertanya.')
  assert.equal(whatsappUrl('', 'SDN'), null)
  assert.equal(whatsappUrl('081234567890', 'SDN'), null)
  assert.equal(whatsappUrl('62812345678901234', 'SDN'), null)
  assert.match(whatsappUrl('6281234567890', '  ') ?? '', /Halo%20sekolah/)
})
