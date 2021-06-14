import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import Confirmation from '@/components/Confirmation'

describe('ConfirmationComponent', function () {
  let localVue
  let router
  let wrapper
  let store
  let tMock

  beforeEach(() => {
    tMock = v => v

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

    wrapper = shallowMount(Confirmation, {
      localVue,
      router,
      store,
      mocks: {
        $t: tMock
      }
    })
  })

  it('should create', function () {
    expect(wrapper).toBeTruthy()
  })

  it('should pass ID to url', async function () {
    await wrapper.setProps({
      id: 'test'
    })
    expect(wrapper.find('a').element.getAttribute('href')).toBe('https://hiveblocks.com/tx/test')
  })

  it('should contain ID as text in link', async function () {
    await wrapper.setProps({
      id: 'test'
    })
    expect(wrapper.find('a').element.innerHTML.trim()).toBe('test')
  })
})
