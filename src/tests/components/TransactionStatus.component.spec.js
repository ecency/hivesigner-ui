import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import TransactionStatus from '@/components/TransactionStatus'

describe('TransactionStatusComponent', function () {
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

    wrapper = shallowMount(TransactionStatus, {
      localVue,
      router,
      store,
      mocks: {
        $t: v => v,
      }
    })
  })

  it('should create', function () {
    expect(wrapper).toBeTruthy()
  })

  it('should show icon with status', async function () {
    await wrapper.setProps({
      status: 'failure'
    })
    expect(wrapper.find('icon-stub[name=failure]')).toBeTruthy()

    await wrapper.setProps({
      status: 'success'
    })
    expect(wrapper.find('icon-stub[name=success]')).toBeTruthy()
  })

  it('should show title depended by status', async function () {
    await wrapper.setProps({
      status: 'failure'
    })
    expect(wrapper.find('.text-2xl').element.innerHTML.trim()).toBe('sign.failure_title')

    await wrapper.setProps({
      status: 'success'
    })
    expect(wrapper.find('.text-2xl').element.innerHTML.trim()).toBe('sign.success_title')
  })

  it('should show message depended by status', async function () {
    await wrapper.setProps({
      status: 'failure',
      failureMessage: 'Failed!'
    })
    expect(wrapper.find('.break-all').element.innerHTML.trim()).toBe('Failed!')

    await wrapper.setProps({
      status: 'success',
      successMessage: 'Success!'
    })
    expect(wrapper.find('.break-all').element.innerHTML.trim()).toBe('Success!')
  })
})
