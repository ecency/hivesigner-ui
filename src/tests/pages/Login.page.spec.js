import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import flushPromises from 'flush-promises'
import Login from '@/pages/login'

jest.mock('@/store')
jest.mock('~/utils', () => ({
  client: { database: { getAccounts: jest.fn() } },
  buildSearchParams: jest.fn(() => ''),
  getAuthority: jest.fn(),
  isValidUrl: jest.fn(() => true)
}))

import * as storeModules from '@/store'
import { client } from '~/utils'

describe('LoginPage', function () {
  let localVue
  let wrapper
  let store
  let $route
  let $router
  let $t

  function initWrapper() {
    wrapper = shallowMount(Login, {
      localVue,
      store,
      mocks: {
        $route,
        $router,
        $t
      }
    })
  }

  beforeEach(() => {
    localVue = createLocalVue()
    localVue.use(Vuex)
    store = new Vuex.Store({})

    $t = v => v
    $route = {
      query: {
        scope: 'posting',
        clientId: 'test-app',
        redirect_uri: 'https://callback.com'
      },
      params: {},
      fullPath: '/login?scope=posting'
    }
    $router = {
      push: jest.fn()
    }

    storeModules.AccountsModule = {
      selectedAccount: 'alice'
    }
    storeModules.AuthModule = {
      username: '',
      account: null,
      login: jest.fn().mockResolvedValue(undefined),
      signAndRedirectToCallback: jest.fn().mockResolvedValue(undefined)
    }

    client.database.getAccounts = jest.fn()
      .mockResolvedValueOnce([{ name: 'alice', posting: { account_auths: [['test-app', 1]] } }])
      .mockResolvedValueOnce([{ posting_json_metadata: JSON.stringify({ profile: { redirect_uris: ['https://callback.com'] } }) }])
  })

  it('allows posting key login when app already has posting authority', async function () {
    initWrapper()
    await flushPromises()
    wrapper.vm.$refs['login-form'] = { resetForm: jest.fn() }
    await wrapper.vm.loginMe({ posting: 'posting-key' })

    expect(storeModules.AuthModule.login).toHaveBeenCalledWith({ username: 'alice', keys: { posting: 'posting-key' } })
    expect(wrapper.vm.error).toBe('')
  })
})
