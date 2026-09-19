const { test } = require('node:test')
const assert = require('node:assert/strict')
const { OAuth2Client } = require('google-auth-library')
const User = require('../models/User')
const { googleLogin } = require('../services/googleAuthService')

test('Google login verifies credentials, creates regular users and refuses email linking', async (t) => {
  process.env.GOOGLE_CLIENT_ID = 'test-client'
  let payload = { sub: 'google-user', email: 'user@example.com', email_verified: true, name: 'Example' }
  t.mock.method(OAuth2Client.prototype, 'verifyIdToken', async (options) => {
    assert.equal(options.audience, 'test-client')
    if (options.idToken === 'invalid') throw new Error('invalid')
    return { getPayload: () => payload }
  })
  t.mock.method(User, 'findOne', async () => null)
  const exists = t.mock.method(User, 'exists', async () => false)
  t.mock.method(User, 'create', async (data) => {
    assert.equal(data.role, 'user')
    assert.equal(data.password, undefined)
    const doc = new User(data)
    await doc.validate()
    return doc
  })
  await assert.rejects(googleLogin('invalid'), { status: 401 })
  await assert.rejects(googleLogin(null), { status: 400 })
  assert.equal((await googleLogin('valid')).googleId, 'google-user')
  exists.mock.mockImplementation(async () => true)
  await assert.rejects(googleLogin('valid'), { status: 409 })
  payload = { ...payload, email_verified: false }
  await assert.rejects(googleLogin('valid'), { status: 401 })
})

test('password is required for local accounts and Google-only password login fails safely', async () => {
  const local = new User({ username: 'local', email: 'local@example.com' })
  await assert.rejects(local.validate(), /password/)
  const google = new User({ username: 'google', email: 'google@example.com', googleId: 'subject' })
  await google.validate()
  assert.equal(await google.matchPassword('anything'), false)
})
