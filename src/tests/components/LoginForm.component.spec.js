import { createLocalVue, shallowMount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import Vuex from 'vuex'
import LoginForm from '@/components/Login/LoginForm'

jest.mock('triplesec')
import triplesec from 'triplesec'
import { ERROR_INVALID_ENCRYPTION_KEY } from '@/consts';

describe('LoginFormComponent', function () {
  let localVue
  let router
  let wrapper
  let store

  beforeEach(() => {
    localVue = createLocalVue()
    localVue.use(VueRouter)
    localVue.use(Vuex)
    router = new VueRouter()
    store = new Vuex.Store({})

    wrapper = shallowMount(LoginForm, {
      localVue,
      router,
      store,
      computed: {
        username: jest.fn().mockReturnValue('testUsername'),
        loginKey: jest.fn(),
      }
    })
  })

  it('should create', function () {
    expect(wrapper).toBeTruthy()
  })

  it('should call submitForm on form submit', async function () {
    wrapper.vm.submitForm = jest.fn()
    await wrapper.find('form').trigger('submit')
    expect(wrapper.vm.submitForm).toBeCalled()
  })

  it('should submit form successfully with decrypted', async function () {
    await wrapper.setProps({
      keychain: {
        testUsername: 'decrypted',
      },
    })
    await wrapper.vm.handleBlur('username')
    await wrapper.vm.submitForm()

    expect(wrapper.emitted().loading[0]).toEqual([true])
    expect(wrapper.emitted().loading[1]).toEqual([false])
    expect(wrapper.emitted().submit[0].length).toBe(1)
  })

  it('should submit form successfully if not decrypted', async function () {
    await wrapper.setProps({
      keychain: {
        testUsernameDecrypted: ['decrypted'],
        testUsername: ['key'],
      },
    })
    triplesec.decrypt.mockImplementation((_, success) => success(false, 'buff'))
    await wrapper.vm.submitForm()

    expect(wrapper.emitted().loading[0]).toEqual([true])
    expect(wrapper.emitted().submit[0]).toEqual(['buff'])
  })

  it('should submit form failure if not decrypted and triplesec failed', async function () {
    await wrapper.setProps({
      keychain: {
        testUsernameDecrypted: ['decrypted'],
        testUsername: ['key'],
      },
    })
    triplesec.decrypt.mockImplementation((_, success) => success('error'))
    await wrapper.vm.submitForm()

    expect(wrapper.emitted().loading[0]).toEqual([true])
    expect(wrapper.emitted().loading[1]).toEqual([false])
    expect(wrapper.emitted().error[0]).toEqual([ERROR_INVALID_ENCRYPTION_KEY])
  })

  it('should handle username input blur and mark as dirty', async function () {
    await wrapper.setProps({
      keychain: {
        testUsernameDecrypted: ['decrypted'],
        testUsername: ['key'],
      },
    })
    await wrapper.vm.handleBlur('username')

    expect(wrapper.vm.dirty.username).toBe(true)
    expect(wrapper.vm.dirty.key).toBe(true)
  })

  it('should handle another input blur and mark as dirty', async function () {
    await wrapper.setProps({
      keychain: {
        testUsernameDecrypted: ['decrypted'],
        testUsername: ['key'],
      },
    })
    await wrapper.vm.handleBlur('usernames')

    expect(wrapper.vm.dirty.usernames).toBe(true)
    expect(wrapper.vm.dirty.key).toBe(true)
  })

  it('should reset form', function () {
    wrapper.vm.reset()
    expect(wrapper.vm.dirty).toEqual({
      username: false,
      key: false,
    })
  })

  it('should disable submit if has any errors', async function () {
    wrapper = shallowMount(LoginForm, {
      localVue,
      router,
      store,
      computed: {
        username: jest.fn().mockReturnValue(''),
        loginKey: jest.fn().mockReturnValue(''),
      },
    })
    expect(wrapper.vm.submitDisabled).toBeTruthy()
    expect(wrapper.find('button').element.getAttribute('disabled')).toBe('disabled')
  })

  it('should disable submit if loading', async function () {
    wrapper = shallowMount(LoginForm, {
      localVue,
      router,
      store,
      computed: {
        username: jest.fn().mockReturnValue(''),
        loginKey: jest.fn().mockReturnValue(''),
      },
    })
    await wrapper.setProps({
      loading: true,
    })

    expect(wrapper.find('button').element.getAttribute('disabled')).toBe('disabled')
  })
})
