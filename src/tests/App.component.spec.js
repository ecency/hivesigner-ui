import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import App from '@/components/App'

describe('AppComponent', function () {
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

    wrapper = shallowMount(App, {
      localVue,
      router,
      store,
    })
  })

  it('should create', function () {
    expect(wrapper).toBeTruthy()
  })

  it('should emit select on clicking on link', async function () {
    await wrapper.find('a').trigger('click')
    expect(wrapper.emitted().select[0]).toEqual([])
  })

  it('should render username', async function () {
    await wrapper.setProps({
      username: 'test'
    })

    expect(wrapper.find('a').element.innerHTML).toContain('test')
  })
})
