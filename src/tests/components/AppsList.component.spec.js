import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import AppsList from '@/components/Apps/AppsList'

describe('AppsListComponent', function () {
  let localVue
  let router
  let wrapper
  let store
  let tMock

  beforeEach(() => {
    tMock = (v) => v
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
    wrapper = shallowMount(AppsList, {
      localVue,
      router,
      store,
      mocks: {
        $t: tMock
      }
    })
  }

  it('should create', function () {
    initWrapper()
    expect(wrapper).toBeTruthy()
  })

  it('should render title', async function () {
    initWrapper()
    await wrapper.setProps({
      title: 'My title'
    })

    expect(wrapper.find('.apps-list-title').element.innerHTML.trim()).toEqual('My title')
  })

  it('should show app item', async function () {
    initWrapper()
    await wrapper.setProps({
      apps: ['app1', 'app2']
    })

    expect(wrapper.findAll('appitem-stub').length).toBe(2)
  })

  it('should show loader', async function () {
    initWrapper()
    await wrapper.setProps({
      loading: true
    })

    expect(wrapper.find('loader-stub')).toBeTruthy()

    await wrapper.setProps({
      apps: ['app1']
    })

    expect(wrapper.findAll('loader-stub').length).toBe(0)
  })
})
