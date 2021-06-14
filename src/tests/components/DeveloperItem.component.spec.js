import { createLocalVue, shallowMount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import Vuex from 'vuex'
import DeveloperItem from '@/components/Developers/DeveloperItem'

describe('DeveloperItemComponent', function () {
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

    wrapper = shallowMount(DeveloperItem, {
      localVue,
      router,
      store
    })
  })

  it('should create', function () {
    expect(wrapper).toBeTruthy()
  })

  it('should toggle', async function () {
    wrapper = shallowMount(DeveloperItem, {
      localVue,
      router,
      store,
      propsData: {
        title: 'current',
        value: 'another'
      }
    })
    expect(wrapper.findAll('.developer-item > div').length).toBe(0)

    await wrapper.setProps({
      value: 'current'
    })

    expect(wrapper.findAll('.developer-item > div').length).toBe(1)

    await wrapper.setProps({
      value: 'another'
    })

    expect(wrapper.findAll('.developer-item > div').length).toBe(0)
  })

  it('should emit value', async function () {
    wrapper = shallowMount(DeveloperItem, {
      localVue,
      router,
      store,
      propsData: {
        title: 'current',
        value: 'another'
      }
    })

    await wrapper.find('a').trigger('click')
    expect(wrapper.emitted().input[0]).toEqual(['current'])

    await wrapper.setProps({
      value: 'current'
    })
    await wrapper.find('a').trigger('click')
    expect(wrapper.emitted().input[1]).toEqual([null])

    await wrapper.setProps({
      value: 'another'
    })
    await wrapper.find('a').trigger('click')
    expect(wrapper.emitted().input[2]).toEqual(['current'])
  })
})
