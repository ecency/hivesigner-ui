import { createLocalVue, shallowMount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import Vuex from 'vuex'
import ImportUserForm from '@/components/Import/ImportUserForm'

jest.mock('@/utils')
import * as utils from '@/utils'

describe('ImportUserFormComponent', function () {
  let localVue
  let router
  let wrapper
  let store

  beforeEach(() => {
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

    utils.hasAccounts.mockReturnValue(true)

    wrapper = shallowMount(ImportUserForm, {
      localVue,
      router,
      store,
      computed: {
        username: {
          get: jest.fn(),
          set: jest.fn(),
        },
        password: {
          get: jest.fn(),
          set: jest.fn(),
        },
      },
    })
  })

  it('should create', function () {
    expect(wrapper).toBeTruthy()
  })

  it('should handle blur', async function () {
    wrapper.vm.handleBlur = jest.fn()

    await wrapper.find('input[id="username"]').trigger('blur')
    expect(wrapper.vm.handleBlur).toHaveBeenCalledWith('username')
  })

  it('should submit and change state', async function () {
    utils.credentialsValid.mockReturnValue(Promise.resolve(true))
    utils.getKeys.mockReturnValue(Promise.resolve(true))
    utils.addToKeychain.mockReturnValue(Promise.resolve(true))

    await wrapper.find('button.btn-blue').trigger('click')

    expect(wrapper.emitted().loading[0]).toEqual([true])
    expect(wrapper.emitted().loading[1]).toEqual([false])
    expect(wrapper.emitted().error[0]).toEqual([''])
    expect(wrapper.emitted()['next-step'][0]).toEqual([])
  })

  it('should submit form if step is next', async function () {
    utils.credentialsValid.mockReturnValue(Promise.resolve(true))
    utils.getKeys.mockReturnValue(Promise.resolve({ k: 1 }))
    utils.addToKeychain.mockReturnValue(true)

    wrapper.vm.storeAccount = false
    await wrapper.find('button.btn-blue').trigger('click')

    expect(wrapper.emitted().loading[0]).toEqual([true])
    expect(wrapper.emitted().loading[1]).toEqual([false])
    expect(wrapper.emitted().error[0]).toEqual([''])
  })

  it('should show select account has accounts', function () {
    expect(wrapper.findAll('.select-account').length).toBe(1)
  })

  it('should call signup on signup button click', async function () {
    wrapper.vm.signUp = jest.fn()
    await wrapper.find('.sign-up').trigger('click')

    expect(wrapper.vm.signUp).toHaveBeenCalled()
  })
})