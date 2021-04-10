import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import Vue from 'vue'
import VueRouter from 'vue-router'
import Default from '@/layouts/default'

describe('DefaultLayout', function () {
  let localVue
  let router
  let wrapper
  let store

  beforeEach(() => {
    localVue = createLocalVue()
    localVue.use(VueRouter)
    localVue.use(Vuex)
    router = new VueRouter()
    store = new Vuex.Store()

    wrapper = shallowMount(Default, {
      localVue,
      router,
      store,
      components: {
        Nuxt: new Vue(),
      },
    })
  })

  it('should create', function () {
    expect(wrapper).toBeTruthy()
  })

  it('should contain nuxt component', function () {
    expect(wrapper.findAll('nuxt-stub').length).toBe(1)
  })
})
