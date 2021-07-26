import { createLocalVue, shallowMount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import Vuex from 'vuex'
import ImportUserForm from '@/components/Import/ImportUserForm'
import * as storeModules from '@/store'

describe('ImportUserFormComponent', function () {
  let localVue
  let router
  let wrapper
  let store
  let $t

  beforeEach(() => {
    $t = v => v
    storeModules.AccountsModule = {
      saveAccount: jest.fn()
    }

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

    wrapper = shallowMount(ImportUserForm, {
      localVue,
      router,
      store,
      computed: {
        username: {
          get: jest.fn(),
          set: jest.fn()
        },
        password: {
          get: jest.fn(),
          set: jest.fn()
        }
      },
      mocks: {
        $t
      }
    })
  })

  it('should create', function () {
    expect(wrapper).toBeTruthy()
  })

  it('should call submitNext on button click', async function () {
    wrapper.vm.submitNext = jest.fn()
    await wrapper.find('.button-primary').trigger('click')
    expect(wrapper.vm.submitNext).toBeCalled()
  })

  it('should submit and change state', async function () {
    storeModules.AccountsModule.isValidCredentials = jest.fn().mockReturnValue(true)

    await wrapper.vm.submitNext()

    expect(wrapper.emitted().loading[0]).toEqual([true])
    expect(wrapper.emitted().loading[1]).toEqual([false])
    expect(wrapper.emitted().error[0]).toEqual([''])
    expect(wrapper.emitted()['next-step'][0]).toEqual([])
  })

  it('should submit form if step is next', async function () {
    storeModules.AccountsModule.isValidCredentials = jest.fn().mockReturnValue(true)
    storeModules.AccountsModule.getAuthoritiesKeys = jest.fn().mockReturnValue({
      posting: 'key'
    })

    wrapper.vm.storeAccount = false
    await wrapper.vm.submitNext()

    expect(wrapper.emitted().loading[0]).toEqual([true])
    expect(wrapper.emitted().loading[1]).toEqual([false])
    expect(wrapper.emitted().error[0]).toEqual([''])
    expect(storeModules.AccountsModule.saveAccount).toHaveBeenCalled()
  })

  it('should reset form', function () {
    wrapper.vm.reset()
    expect(wrapper.vm.dirty).toEqual({
      username: false,
      password: false
    })
  })
})
