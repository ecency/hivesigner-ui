import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import { decode } from 'hive-uri'
import Profile from '@/pages/profile'

jest.mock('@/store')
import * as storeModules from '@/store'

function account (redirectUris) {
  return {
    name: 'ecency.app',
    json_metadata: '',
    posting_json_metadata: JSON.stringify({
      profile: { type: 'app', name: 'Ecency', redirect_uris: redirectUris, secret: 'hash', version: 2 }
    })
  }
}

// What the store still holds from login, and what the chain says now.
const loginSnapshot = ['https://ecency.com/auth']
const onChain = ['https://ecency.com/auth', 'https://blog.example.com/auth']

describe('ProfilePage', function () {
  let localVue
  let store
  let $router
  let wrapper

  const flush = () => new Promise(resolve => setImmediate(resolve))

  function initWrapper () {
    wrapper = shallowMount(Profile, {
      localVue,
      store,
      stubs: ['form-control', 'loader', 'single-page-layout'],
      mocks: {
        $router,
        $t: v => v
      }
    })
  }

  beforeEach(() => {
    localVue = createLocalVue()
    localVue.use(Vuex)
    store = new Vuex.Store({})
    $router = { push: jest.fn() }
    storeModules.AuthModule = {
      account: account(loginSnapshot),
      loadAccount: jest.fn(() => {
        storeModules.AuthModule.account = account(onChain)
        return Promise.resolve()
      })
    }
  })

  it('reloads the account from chain before filling the form', async function () {
    initWrapper()
    await flush()
    expect(storeModules.AuthModule.loadAccount).toHaveBeenCalledTimes(1)
    expect(wrapper.vm.draft.redirect_uris).toBe(onChain.join('\n'))
    expect(wrapper.vm.loaded).toBe(true)
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('loader-stub').exists()).toBe(false)
  })

  it('shows no form while the reload is still running, so nothing typed can be lost', async function () {
    let finish
    storeModules.AuthModule.loadAccount = jest.fn(() => new Promise((resolve) => { finish = resolve }))
    initWrapper()
    await flush()
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.find('loader-stub').exists()).toBe(true)
    storeModules.AuthModule.account = account(onChain)
    finish()
    await flush()
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('treats a reload that left no account as a failure', async function () {
    storeModules.AuthModule.loadAccount = jest.fn(() => {
      storeModules.AuthModule.account = null
      return Promise.resolve()
    })
    initWrapper()
    await flush()
    expect(wrapper.vm.error).toBe('Not logged in')
    expect(wrapper.vm.loaded).toBe(false)
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('submits the on-chain profile plus the edit, not the login snapshot', async function () {
    initWrapper()
    await flush()
    wrapper.vm.draft.redirect_uris += '\nhttps://new.example.com/callback'
    wrapper.vm.handleSubmit()
    expect($router.push).toHaveBeenCalledTimes(1)
    const [type, op] = decode('hive://' + $router.push.mock.calls[0][0]).tx.operations[0]
    expect(type).toBe('account_update2')
    expect(op.json_metadata).toBe('')
    const profile = JSON.parse(op.posting_json_metadata).profile
    expect(profile.redirect_uris).toEqual([...onChain, 'https://new.example.com/callback'])
    expect(profile.secret).toBe('hash')
  })

  it('does not offer a form it could not fill', async function () {
    storeModules.AuthModule.loadAccount = jest.fn().mockRejectedValue(new Error('node down'))
    initWrapper()
    await flush()
    expect(wrapper.vm.error).toBe('node down')
    expect(wrapper.vm.loaded).toBe(false)
    expect(wrapper.vm.draft.redirect_uris).toBeNull()
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.find('loader-stub').exists()).toBe(false)
    wrapper.vm.handleSubmit()
    expect($router.push).not.toHaveBeenCalled()
  })
})
