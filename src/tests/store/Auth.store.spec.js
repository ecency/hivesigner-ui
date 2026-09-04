import Vuex from 'vuex'
import { createLocalVue } from '@vue/test-utils'
import { getModule } from 'vuex-module-decorators'
import Auth from '@/store/auth'

jest.mock('@/store/index', () => ({ AccountsModule: {} }))
jest.mock('@/utils', () => ({
  b64uEnc: jest.fn(),
  privateKeyFrom: jest.fn(),
  client: { database: { getAccounts: jest.fn() } }
}))
import { client } from '@/utils'

describe('AuthStore.loadAccount', function () {
  let auth

  function deferred () {
    const out = {}
    out.promise = new Promise((resolve) => { out.resolve = resolve })
    return out
  }

  beforeEach(() => {
    const localVue = createLocalVue()
    localVue.use(Vuex)
    const store = new Vuex.Store({ modules: { auth: Auth } })
    auth = getModule(Auth, store)
    auth.setUser({ result: { name: 'alice', posting_json_metadata: 'old' }, keys: {} })
    client.database.getAccounts.mockReset()
  })

  it('replaces the account with what the node returned', async function () {
    client.database.getAccounts.mockResolvedValue([{ name: 'alice', posting_json_metadata: 'fresh' }])
    await auth.loadAccount()
    expect(client.database.getAccounts).toHaveBeenCalledWith(['alice'])
    expect(auth.account.posting_json_metadata).toBe('fresh')
  })

  it('drops an answer that arrives after a logout', async function () {
    const pending = deferred()
    client.database.getAccounts.mockReturnValue(pending.promise)
    const loading = auth.loadAccount()
    auth.clearUser()
    pending.resolve([{ name: 'alice', posting_json_metadata: 'fresh' }])
    await loading
    expect(auth.account).toBeNull()
  })

  it('drops an answer that arrives after a switch to another account', async function () {
    const pending = deferred()
    client.database.getAccounts.mockReturnValue(pending.promise)
    const loading = auth.loadAccount()
    auth.setUser({ result: { name: 'bob', posting_json_metadata: 'bobs' }, keys: {} })
    pending.resolve([{ name: 'alice', posting_json_metadata: 'fresh' }])
    await loading
    expect(auth.account.name).toBe('bob')
    expect(auth.account.posting_json_metadata).toBe('bobs')
  })

  it('fails rather than storing nothing when the node returns no account', async function () {
    client.database.getAccounts.mockResolvedValue([])
    await expect(auth.loadAccount()).rejects.toThrow(/^Account alice not found$/)
    expect(auth.account.posting_json_metadata).toBe('old')
  })
})
