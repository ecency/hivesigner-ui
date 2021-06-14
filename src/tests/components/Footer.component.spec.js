import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import Footer from '@/components/Footer'

describe('FooterComponent', function () {
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

    wrapper = shallowMount(Footer, {
      localVue,
      router,
      store,
      mocks: {
        $t: v => v
      }
    })
  })

  it('should create', function () {
    expect(wrapper).toBeTruthy()
  })
})
