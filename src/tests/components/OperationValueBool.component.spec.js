import { createLocalVue, shallowMount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import Vuex from 'vuex'
import OperationValueBool from '@/components/Operation/OperationValueBool'

describe('OperationValueBoolComponent', function () {
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

    wrapper = shallowMount(OperationValueBool, {
      localVue,
      router,
      store,
    })
  })

  it('should create', function () {
    expect(wrapper).toBeTruthy()
  })

  it('should set and render value as text', async function () {
    await wrapper.setProps({
      value: 'test'
    })
    expect(wrapper.find('span').element.innerHTML).toBe('test')
  })
})
