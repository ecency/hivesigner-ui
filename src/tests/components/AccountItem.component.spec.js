import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import AccountItem from '@/components/Accounts/AccountItem'
import * as storeModules from '@/store'

describe('AccountItemComponent', function () {
  let localVue
  let router
  let wrapper
  let store
  let tMock

  beforeEach(() => {
    tMock = (v) => v
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
    wrapper = shallowMount(AccountItem, {
      propsData: {
        user: 'test'
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

  it('should pass user to avatar', function () {
    initWrapper()
    expect(wrapper.find('avatar-stub').element.getAttribute('username')).toEqual('test')
  })
})
