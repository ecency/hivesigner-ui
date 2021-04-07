import { createLocalVue, shallowMount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import Vuex from 'vuex'
import ImportSetPassword from '@/components/Import/ImportSetPassword'

describe('ImportSetPasswordComponent', function () {
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

    wrapper = shallowMount(ImportSetPassword, {
      localVue,
      router,
      store,
      computed: {
        importKey: {
          get() {
            return jest.fn()
          },
          set() {
            return jest.fn()
          }
        },
        keyConfirmation: {
          get() {
            return jest.fn()
          },
          set() {
            return jest.fn()
          }
        }
      }
    })
  })

  it('should create', function () {
    expect(wrapper).toBeTruthy()
  })

  it('should reset form', function () {
    wrapper.vm.handleBlur('key')
    wrapper.vm.handleBlur('keyConfirmation')

    expect(wrapper.vm.dirty).toEqual({
      key: true,
      keyConfirmation: true,
    })

    wrapper.vm.reset()

    expect(wrapper.vm.dirty).toEqual({
      key: false,
      keyConfirmation: false,
    })
  })

  it('should handle blur', async function () {
    wrapper.vm.handleBlur = jest.fn()

    await wrapper.find('input[id="key"]').trigger('blur')
    expect(wrapper.vm.handleBlur).toHaveBeenCalledWith('key')
  })

  it('should disable submit button if has errors', async function () {
    await wrapper.setProps({
      errors: {
        key: 'Key error',
        keyConfirmation: 'Key confirmation error',
      }
    })
    expect(wrapper.findAll('button[disabled]').length).toBe(1)
  })

  it('should show errors', async function () {
    wrapper.vm.handleBlur('key')
    wrapper.vm.handleBlur('keyConfirmation')

    expect(wrapper.findAll('.error').length).toBe(0)

    await wrapper.setProps({
      errors: {
        key: 'Key error',
        keyConfirmation: 'Key confirmation error',
      }
    })

    expect(wrapper.findAll('.error').at(0).text()).toBe('Key error')
    expect(wrapper.findAll('.error').at(1).text()).toBe('Key confirmation error')
  })
})
