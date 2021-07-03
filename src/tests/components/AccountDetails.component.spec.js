import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import AccountDetails from '@/components/Accounts/AccountDetails'
import * as storeModules from '@/store'
import flushPromises from 'flush-promises'

describe('AccountDetailsComponent', function () {
  let localVue
  let router
  let wrapper
  let store
  let tMock

  beforeEach(() => {
    tMock = (v) => v
    storeModules.AccountsModule = {}
    storeModules.AuthModule = {}
    localVue = createLocalVue()
    localVue.use(VueRouter)
    localVue.use(Vuex)
    router = new VueRouter()
    store = new Vuex.Store({
      modules: {
        auth: {
          keys: {}
        }
      },
      getters: {
        username: jest.fn()
      }
    })
  })

  function initWrapper() {
    wrapper = shallowMount(AccountDetails, {
      propsData: {
        account: 'test',
      },
      localVue,
      router,
      store,
      filters: {
        parseUrl: value => value
      },
      mocks: {
        $t: tMock
      }
    })
  }

  it('should create', function () {
    initWrapper()
    expect(wrapper).toBeTruthy()
  })

  it('should login successfully', function () {
    initWrapper()
    storeModules.AuthModule.login = jest.fn()
    storeModules.AccountsModule.setSelectedAccount = jest.fn()

    expect(wrapper).toBeTruthy()
  })

  it('should remove account', function () {
    initWrapper()
    storeModules.AccountsModule.removeAccount = jest.fn()
    wrapper.vm.removeAccount()
    expect(storeModules.AccountsModule.removeAccount).toHaveBeenCalled()
    expect(wrapper.emitted().removed[0]).toEqual([])
  })

  it('should autologin with decrypted password', async function () {
    storeModules.AccountsModule.isDecrypted = jest.fn()
    storeModules.AccountsModule.isDecrypted.mockReturnValue(true)
    storeModules.AuthModule.login = jest.fn()
    storeModules.AccountsModule.setSelectedAccount = jest.fn()
    storeModules.AccountsModule.getEncryptedKeys = jest.fn()
    storeModules.AccountsModule.getEncryptedKeys.mockReturnValue({})

    initWrapper()
    await flushPromises()

    expect(storeModules.AuthModule.login).toHaveBeenCalledWith({ username: 'test', keys: {} })
    expect(storeModules.AccountsModule.setSelectedAccount).toHaveBeenCalledWith('test')
    expect(wrapper.vm.isLoggedIn).toBeTruthy()
  })
})
