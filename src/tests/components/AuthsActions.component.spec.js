import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import AuthsActions from '@/components/Auths/AuthsActions'
import * as storeModules from '@/store'

describe('AuthsActionsComponent', function () {
  let localVue
  let router
  let wrapper
  let store
  let tMock

  beforeEach(() => {
    storeModules.AccountsModule = {
      hasAuthorityPrivateKey: () => true
    }
    tMock = (v) => v
    localVue = createLocalVue()
    localVue.use(VueRouter)
    localVue.use(Vuex)
    router = new VueRouter()
    router.push = jest.fn()
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
    wrapper = shallowMount(AuthsActions, {
      propsData: {
        value: {
          Key: {
            type: ''
          }
        },
        account: {}
      },
      router,
      localVue,
      store,
      mocks: {
        $t: tMock,
        $popupMessages: {
          show: jest.fn()
        }
      }
    })
  }

  it('should create', function () {
    initWrapper()
    expect(wrapper).toBeTruthy()
  })

  it('should revoke if type is revoke', async function () {
    initWrapper()
    await wrapper.setProps({
      value: {
        Key: {
          type: 'account',
          public: 'mykey',
        },
        Type: 'authority'
      }
    })

    const revokeEl = wrapper.find('a[data-e2e=revoke]')
    expect(revokeEl).toBeTruthy()

    await revokeEl.trigger('click')
    expect(router.push).toHaveBeenCalledWith('/revoke/mykey?authority=authority')

    await wrapper.setProps({
      value: {
        Key: {
          type: 'account',
          public: 'mykey',
        },
        Type: 'posting'
      }
    })

    await revokeEl.trigger('click')
    expect(router.push).toHaveBeenCalledWith('/revoke/mykey')
  })

  it('should copy if type is not account', async function () {
    navigator.clipboard = {
      writeText: jest.fn()
    }

    initWrapper()
    await wrapper.setProps({
      value: {
        Key: {
          public: 'mykey',
          private: 'myprivatekey'
        },
        Type: 'authority'
      },
      isPrivateKey: false,
    })
    await wrapper.vm.copy()

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('mykey')
    expect(wrapper.vm.$popupMessages.show).toHaveBeenCalledWith('auths.successfully_copied', 5000)

    await wrapper.setProps({
      isPrivateKey: true,
    })
    await wrapper.vm.copy()
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('myprivatekey')
    expect(wrapper.vm.$popupMessages.show).toHaveBeenCalledWith('auths.successfully_copied', 5000)
  })

  it('should reveal or import private if type is not account', function () {
    storeModules.AccountsModule.hasAuthorityPrivateKey = jest.fn()
    storeModules.AccountsModule.hasAuthorityPrivateKey.mockReturnValue(true)
    initWrapper()

    wrapper.vm.revealOrImport()
    expect(wrapper.emitted()['private:show'][0]).toEqual([true])
  })

  it('should import if type is not account', function () {
    storeModules.AccountsModule.hasAuthorityPrivateKey = jest.fn()
    storeModules.AccountsModule.hasAuthorityPrivateKey.mockReturnValue(false)
    initWrapper()

    wrapper.vm.revealOrImport()
    expect(wrapper.emitted()['import:show'][0]).toBeTruthy()
  })
})
