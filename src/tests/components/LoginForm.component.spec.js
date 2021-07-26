import { createLocalVue, shallowMount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import Vuex from 'vuex'
import LoginForm from '@/components/Login/LoginForm'
import { ERROR_INVALID_ENCRYPTION_KEY } from '@/consts'

jest.mock('@/store')
import * as storeModules from '@/store'
import { DecryptionExceptions } from '@/enums'

describe('LoginFormComponent', function () {
  let localVue
  let router
  let wrapper
  let store
  let $t

  beforeEach(() => {
    storeModules.AccountsModule = {
      isSelectedAccountDecrypted: false,
      accountsUsernamesList: []
    }
    $t = v => v
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
      },
      mocks: {
        $t,
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

  it('should submit form successfully', async function () {
    storeModules.AccountsModule.getEncryptedKeys = () => ({
      posting: 'key'
    })
    await wrapper.vm.handleBlur('username')
    await wrapper.vm.submitForm()

    expect(wrapper.emitted().submit[0].length).toBe(1)
  })

  it('should submit form failure if not decrypted and buffer failed', async function () {
    storeModules.AccountsModule.getEncryptedKeys = () => (throw DecryptionExceptions.BuiltInBufferError)
    await wrapper.vm.submitForm()

    expect(wrapper.emitted().failed[0]).toEqual([false])
    expect(wrapper.emitted().loading[0]).toEqual([false])
    expect(wrapper.emitted().signature[0]).toEqual([''])
  })

  it('should submit form failure if not decrypted and triplesec failed', async function () {
    storeModules.AccountsModule.getEncryptedKeys = () => {
      throw DecryptionExceptions.TriplesecError
    }
    await wrapper.vm.submitForm()

    expect(wrapper.emitted().error[0]).toEqual([ERROR_INVALID_ENCRYPTION_KEY])
  })

  it('should reset form', function () {
    wrapper.vm.resetForm()
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
      mocks: {
        $t,
      }
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
      mocks: {
        $t,
      }
    })
    await wrapper.setProps({
      loading: true,
    })

    expect(wrapper.find('button').element.getAttribute('disabled')).toBe('disabled')
  })
})
