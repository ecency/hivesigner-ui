import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import Operation from '@/components/Operation'

jest.mock('@/consts')
import * as consts from '@/consts'

describe('OperationComponent', function () {
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

    wrapper = shallowMount(Operation, {
      localVue,
      router,
      store,
    })
  })

  it('should create', function () {
    expect(wrapper).toBeTruthy()
  })

  it('should has default schema value', async function () {
    consts.OPERATIONS = {
      test: {}
    }
    await wrapper.setProps({
      operation: ['test']
    })
    expect(wrapper.vm.schema).toEqual({})
  })
})
