import { createLocalVue, shallowMount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import Vuex from 'vuex'
import OperationValueAccount from '@/components/Operation/OperationValueAccount'
import Avatar from '@/components/Avatar'

describe('OperationValueAccountComponent', function () {
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

    wrapper = shallowMount(OperationValueAccount, {
      localVue,
      router,
      store,
      components: {
        Avatar,
      },
    })
  })

  it('should create', function () {
    expect(wrapper).toBeTruthy()
  })
})
