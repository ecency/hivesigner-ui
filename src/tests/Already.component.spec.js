import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import Already from '@/components/Already'

describe('AlreadyComponent', function () {
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

    wrapper = shallowMount(Already, {
      localVue,
      router,
      store,
    })
  })

  it('should create', function () {
    expect(wrapper).toBeTruthy()
  })

  it('should render action username and authority in text', async function () {
    await wrapper.setProps({
      action: 'actionTest',
      username: 'usernameTest',
      authority: 'authorityTest',
    })
    expect(wrapper.find('p').element.innerHTML.trim())
      .toBe('You already actionTest the account <b>usernameTest</b> to do\n    <b>authorityTest</b> operations on your behalf.')
  })

  it('should render continue if callback is relative', async function () {
    expect(wrapper.findAll('router-link-stub').length).toBe(0)
    expect(wrapper.findAll('a').length).toBe(0)
    await wrapper.setProps({
      callback: '/path'
    })
    expect(wrapper.findAll('router-link-stub').length).toBe(1)
  })

  it('should render continue to path if callback is absolute', async function () {
    expect(wrapper.findAll('router-link-stub').length).toBe(0)
    expect(wrapper.findAll('a').length).toBe(0)
    await wrapper.setProps({
      callback: 'https'
    })
    expect(wrapper.findAll('a').length).toBe(1)
    expect(wrapper.find('a').element.getAttribute('href')).toBe('https')
  })
})
