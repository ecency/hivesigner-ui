import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import Header from '@/components/Header'

describe('HeaderComponent', function () {
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

    wrapper = shallowMount(Header, {
      localVue,
      router,
      store
    })
  })

  it('should create', function () {
    expect(wrapper).toBeTruthy()
  })

  it('should render title', async function () {
    await wrapper.setProps({
      title: 'test'
    })
    expect(wrapper.find('h5').element.innerHTML.trim()).toBe('test')
  })
})
