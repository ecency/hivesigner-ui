import { createLocalVue, shallowMount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import Vuex from 'vuex'
import AuthorizeForm from '~/components/Authorize/AuthorizeForm'

describe('AuthorizeComponent', function () {
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

    wrapper = shallowMount(AuthorizeForm, {
      localVue,
      router,
      store,
    })
  })

  it('should create', function () {
    expect(wrapper).toBeTruthy()
  })

  it('should submit data', async function () {
    wrapper = shallowMount(AuthorizeForm, {
      localVue,
      router,
      propsData: {
        username: 'test',
        authority: 'authority1',
        account: {
          name: 'Tester',
          memo_key: 'Memo key',
          json_metadata: 'JSON Metadata',
          authority1: {
            weight_threshold: 1,
            account_auths: []
          },
          authority2: {
            weight_threshold: 2,
            account_auths: []
          },
        },
      },
      computed: {
        hasRequiredKey: jest.fn().mockReturnValue(true)
      }
    })

    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted().loading[0]).toEqual([true])
    expect(wrapper.emitted().submit[0]).toEqual([{
      account: 'Tester',
      memo_key: 'Memo key',
      json_metadata: 'JSON Metadata',
      authority1: {
        weight_threshold: 1,
        account_auths: [
          ['test', 1]
        ]
      }
    }])
  })

  it('should emit reject on cancel', async function () {
    await wrapper.findAll('button').at(0).trigger('click')
    expect(wrapper.emitted().reject[0]).toEqual([])
  })

  it('should show continue if user doesnt exists', function () {
    wrapper = shallowMount(AuthorizeForm, {
      localVue,
      router,
      store,
      computed: {
        accountUsername: jest.fn().mockReturnValue(null)
      }
    })
    expect(wrapper.find('a')).toBeTruthy()
    expect(wrapper.findAll('button').length).toBe(1)
  })
})
