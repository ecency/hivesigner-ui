import { createLocalVue, shallowMount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import Vuex from 'vuex'
import OperationValueJson from '@/components/Operation/OperationValueJson'

describe('OperationValueJsonComponent', function () {
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
    })

    wrapper = shallowMount(OperationValueJson, {
      localVue,
      router,
      store,
      filters: {
        pretty: jest.fn().mockReturnValue('test1')
      }
    })
  })

  it('should create', function () {
    expect(wrapper).toBeTruthy()
  })

  it('should set and render value as text', async function () {
    await wrapper.setProps({
      value: 'test'
    })
    expect(wrapper.find('pre').element.innerHTML).toBe('test1')
  })
})
