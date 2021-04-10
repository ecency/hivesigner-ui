import { createLocalVue, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'
import Authorize from '@/pages/authorize/_username'
import AuthorizeForm from '@/components/Authorize/AuthorizeForm'
import Already from '@/components/Already'
import ErrorComponent from '@/components/Error'
import Confirmation from '@/components/Confirmation'

jest.mock('@/store')
import * as storeModules from '@/store'

describe('AuthorizePage', function () {
  let localVue
  let $route
  let $router
  let wrapper
  let store

  function initWrapper() {
    wrapper = shallowMount(Authorize, {
      localVue,
      store,
      components: {
        AuthorizeForm,
        Already,
        Error: ErrorComponent,
        Confirmation,
      },
      mocks: {
        $route,
        $router,
      },
    })
  }

  beforeEach(() => {
    localVue = createLocalVue()
    localVue.use(Vuex)
    store = new Vuex.Store({})

    $route = {
      params: {
        username: 'my-username',
      },
      query: {
        authority: 'posting',
          scope: 'posting',
          response_type: 'code',
      },
    }
    $router = {
      push: jest.fn(),
    }
    storeModules.AuthModule = {
      account: {},
    }
  })

  it('should create', function () {
    initWrapper()
    expect(wrapper).toBeTruthy()
  })

  it('should render authorize form if doesn\'t have authority and transactionId', function () {
    initWrapper()
    expect(wrapper.findAll('authorize-form-stub').length).toBe(1)
  })

  it('should render already component if has authority and not have transactionId', function () {
    storeModules.AuthModule = {
      account: {
        name: 'tester',
        posting: {
          account_auths: [['tester', 'anotherUser']],
        },
      },
    }
    $route.params.username = 'tester'
    initWrapper()
    expect(wrapper.findAll('already-stub').length).toBe(1)
  })

  it('should render error if failed and not loading', async function () {
    initWrapper()
    wrapper.vm.error = 'my error'
    wrapper.vm.failed = true
    await wrapper.vm.$nextTick()
    expect(wrapper.find('error-stub').element.getAttribute('error')).toBe('my error')
  })

  it('should render confirmation if not loading and has transactionId', async function () {
    initWrapper()
    wrapper.vm.transactionId = 'my id'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('confirmation-stub').element.getAttribute('id')).toBe('my id')
  })

  it('should handle submit successfully with relative callback', async function () {
    storeModules.AuthModule = {
      account: {},
      updateAccount: jest.fn().mockReturnValue(Promise.resolve()),
      loadAccount: jest.fn().mockReturnValue(Promise.resolve()),
    }
    $route.query.redirect_uri = '/relative'
    initWrapper()
    await wrapper.vm.handleSubmit()
    expect($router.push).toHaveBeenCalledWith({ name: 'login', query: { redirect: '/relative' } })
  })

  it('should handle submit successfully with absolute callback', async function () {
    storeModules.AuthModule = {
      account: {},
      updateAccount: jest.fn().mockReturnValue(Promise.resolve()),
      loadAccount: jest.fn().mockReturnValue(Promise.resolve()),
      signAndRedirectToCallback: jest.fn()
    }
    $route.query.redirect_uri = 'https://testing.com'
    $route.query.authority = 'posting'
    $route.query.signature = 'signature'
    $route.query.code = 'code'
    $route.query.state = 'state'
    $route.query.scope = 'login'
    $route.query.app = 'app'
    $route.params.username = 'tester'
    initWrapper()
    await wrapper.vm.handleSubmit()
    expect(storeModules.AuthModule.signAndRedirectToCallback).toHaveBeenCalledWith({
      username: 'tester',
      authority: 'posting',
      signature: 'signature',
      state: 'state',
      responseType: 'code',
      app: 'app',
      scope: 'login',
      callback: 'https://testing.com',
    })
  })

  it('should handle submit successfully and set transactionId if callback is not set', async function () {
    storeModules.AuthModule = {
      account: {},
      updateAccount: jest.fn().mockReturnValue(Promise.resolve({ id: 'transactionId' })),
      loadAccount: jest.fn().mockReturnValue(Promise.resolve()),
    }
    initWrapper()
    await wrapper.vm.handleSubmit()
    expect(wrapper.vm.transactionId).toBe('transactionId')
    expect(wrapper.vm.failed).toBeFalsy()
    expect(wrapper.vm.loading).toBeFalsy()
  })

  it('should handle submit failure and set error', async function () {
    storeModules.AuthModule = {
      account: {},
      updateAccount: jest.fn().mockReturnValue(Promise.reject('my error')),
      loadAccount: jest.fn().mockReturnValue(Promise.resolve()),
    }
    initWrapper()
    await wrapper.vm.handleSubmit()
    expect(wrapper.vm.error).toBe('my error')
    expect(wrapper.vm.failed).toBeTruthy()
    expect(wrapper.vm.loading).toBeFalsy()
  })

  it('should handle reject', async function () {
    storeModules.AuthModule = {
      account: {},
      updateAccount: jest.fn().mockReturnValue(Promise.resolve()),
      loadAccount: jest.fn().mockReturnValue(Promise.resolve()),
    }
    initWrapper()
    wrapper.vm.handleReject()
    expect(wrapper.vm.failed).toBeFalsy()
    expect(wrapper.vm.loading).toBeFalsy()
    expect(wrapper.vm.transactionId).toBe('')
    expect($router.push).toHaveBeenCalledWith('/')
  })

  it('should change loading', function () {
    storeModules.AuthModule = {
      account: {},
      updateAccount: jest.fn().mockReturnValue(Promise.resolve()),
      loadAccount: jest.fn().mockReturnValue(Promise.resolve()),
    }
    initWrapper()
    wrapper.vm.onLoadingChange(true)
    expect(wrapper.vm.loading).toBeTruthy()
  })
})
