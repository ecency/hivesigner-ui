import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import BaseFormControl from '@/components/UI/Form/BaseFormControl'

describe('BaseFormControlComponent', function () {
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
  })

  function initWrapper() {
    wrapper = shallowMount(BaseFormControl, {
      propsData: {
        account: 'test',
      },
      localVue,
      router,
      store,
    })
  }

  it('should create', function () {
    initWrapper()
    expect(wrapper).toBeTruthy()
  })

  it('should emit input value', function () {
    initWrapper()
    wrapper.vm.onInput({ target: { value: 'new value' } })
    expect(wrapper.emitted().input[0]).toEqual(['new value', { target: { value: 'new value' } }])
  })
})
