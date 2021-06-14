import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import Avatar from '@/components/Avatar'

describe('AvatarComponent', function () {
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

    wrapper = shallowMount(Avatar, {
      localVue,
      router,
      store,
      propsData: {
        username: 'test1'
      }
    })
  })

  it('should create', function () {
    expect(wrapper).toBeTruthy()
  })

  it('should set background image url with username', async function () {
    await wrapper.setProps({
      username: 'test'
    })
    expect(wrapper.find('.avatar').element.style.backgroundImage)
      .toBe('url(https://images.ecency.com/u/test/avatar/small)')
  })

  it('should set avatar dimensions by size', async function () {
    await wrapper.setProps({
      size: 10
    })
    expect(wrapper.find('.avatar').element.style.width).toBe('10px')
    expect(wrapper.find('.avatar').element.style.height).toBe('10px')
  })

  it('should set avatar dimensions by default size', async function () {
    expect(wrapper.find('.avatar').element.style.width).toBe('32px')
    expect(wrapper.find('.avatar').element.style.height).toBe('32px')
  })
})
