import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import AppDetails from '@/components/Apps/AppDetails'
jest.mock('@/utils', () => ({
  client: {
    database: {
      getAccounts: jest.fn().mockReturnValue({
        accounts: [
          {
            posting_json_metadata: '{ "profile": { "name": "testName" } }'
          }
        ]
      })
    }
  }
}))

describe('AppDetailsComponent', function () {
  let localVue
  let router
  let wrapper
  let store
  let tMock

  beforeEach(() => {
    tMock = (v) => v
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
    wrapper = shallowMount(AppDetails, {
      localVue,
      router,
      store,
      mocks: {
        $t: tMock
      }
    })
  }

  it('should create', function () {
    initWrapper()
    expect(wrapper).toBeTruthy()
  })

  it('should show loader if its loading', function () {
    initWrapper()
    wrapper.vm.isLoading = true
    wrapper.vm.$nextTick()

    expect(wrapper.find('loader-stub')).toBeTruthy()
  })

  // it('should show profile name', async function () {
  //   initWrapper()
  //   await wrapper.vm.loadProfile()
  //   expect(wrapper.find('h4').element.innerHTML.trim()).toEqual('testName')
  // })
})
