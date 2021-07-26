import { createLocalVue, shallowMount } from '@vue/test-utils'
import Search from '@/components/Search'
import Vuex from 'vuex'
import VueRouter from 'vue-router'

describe('SearchComponent', function () {
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

    wrapper = shallowMount(Search, {
      localVue,
      router,
      store,
    })
  })

  it('should create', function () {
    expect(wrapper).toBeTruthy()
  })

  it('should pass placeholder into input', async function () {
    await wrapper.setProps({
      placeholder: 'test',
    })

    expect(wrapper.find('input').element.getAttribute('placeholder')).toBe('test')
  })

  it('should emit input on input value change', async function () {
    wrapper.vm.handleInput({ target: { value: 'test' } })
    expect(wrapper.emitted().input[0]).toEqual(['test'])
  })

  it('should set input value by prop', async function () {
    await wrapper.setProps({
      value: 'test'
    })
    expect(wrapper.find('input').element.value).toBe('test')
  })
})
