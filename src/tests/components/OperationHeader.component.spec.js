import { createLocalVue, shallowMount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import Vuex from 'vuex'
import OperationHeader from '@/components/Operation/OperationHeader'

jest.mock('@/consts')
import * as consts from '@/consts'

describe('OperationHeaderComponent', function () {
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

    wrapper = shallowMount(OperationHeader, {
      localVue,
      router,
      store,
    })
  })

  it('should create', function () {
    expect(wrapper).toBeTruthy()
  })

  it('should render operation w/o model name', async function () {
    consts.OPERATIONS = {
      myOperation1: {}
    }
    await wrapper.setProps({
      operation: 'myOperation'
    })

    expect(wrapper.find('h4').element.innerHTML.trim()).toBe('myOperation')
  })

  it('should render operation w/o model name', async function () {
    consts.OPERATIONS = {
      myOperation: {
        name: 'model name'
      }
    }
    await wrapper.setProps({
      operation: 'myOperation'
    })

    expect(wrapper.find('h4').element.innerHTML.trim()).toBe('model name')
  })
})
