import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import RevokeForm from '@/components/Revoke/RevokeForm'
import Avatar from '@/components/Avatar'

describe('RevokeFormComponent', function () {
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

    wrapper = shallowMount(RevokeForm, {
      localVue,
      router,
      store,
      computed: {
        account: jest.fn().mockReturnValue({
          name: 'tester',
          memo_key: 'test-memo-key',
          json_metadata: 'my-json-metadata',
          authority1: {
            weight_threshold: 1,
            account_auths: [
              ['test', 1]
            ]
          },
        }),
        hasRequiredKey: jest.fn(),
      },
      components: {
        Avatar,
      },
    })
  })

  it('should create', function () {
    expect(wrapper).toBeTruthy()
  })

  it('should submit form successfully w/o callback', async function () {
    wrapper.vm.updateAccount = jest.fn().mockReturnValue({ id: 'testConfirmationId' })
    wrapper.vm.loadAccount = jest.fn()
    await wrapper.setProps({
      username: 'testUsername',
      authority: 'authority1',
    })

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted().loading[0]).toEqual([true])
    expect(wrapper.emitted().transactionId[0]).toEqual(['testConfirmationId'])
    expect(wrapper.emitted().loading[1]).toEqual([false])
  })

  it('should submit form successfully with absolute callback', async function () {
    wrapper.vm.updateAccount = jest.fn().mockReturnValue({ id: 'testConfirmationId' })
    wrapper.vm.loadAccount = jest.fn()
    await wrapper.setProps({
      username: 'testUsername',
      authority: 'authority1',
      callback: 'http://absolute',
    })

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted().loading[0]).toEqual([true])
  })

  it('should submit form successfully with relative callback', async function () {
    wrapper.vm.updateAccount = jest.fn().mockReturnValue({ id: 'testConfirmationId' })
    wrapper.vm.loadAccount = jest.fn()
    await wrapper.setProps({
      username: 'testUsername',
      authority: 'authority1',
      callback: '/relative',
    })

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted().loading[0]).toEqual([true])
    expect(wrapper.vm.$route.path).toBe('/relative')
  })

  it('should submit form failure', async function () {
    const error = new Error('failed')
    wrapper.vm.updateAccount = jest.fn().mockReturnValue({ id: 'testConfirmationId' })
    wrapper.vm.loadAccount = jest.fn().mockImplementation(() => {
      throw error
    })
    await wrapper.setProps({
      username: 'testUsername',
      authority: 'authority1',
      callback: '/relative',
    })

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted().loading[0]).toEqual([true])
    expect(wrapper.emitted().error[0]).toEqual([error])
    expect(wrapper.emitted().loading[1]).toEqual([false])
    expect(wrapper.emitted().failed[0]).toEqual([true])
  })

  it('should handle form reject', async function () {
    await wrapper.find('button.revoke-cancel').trigger('click')

    expect(wrapper.emitted().failed[0]).toEqual([false])
    expect(wrapper.emitted().loading[0]).toEqual([false])
    expect(wrapper.emitted().transactionId[0]).toEqual([''])
    expect(wrapper.vm.$route.path).toBe('/')
  })
})
