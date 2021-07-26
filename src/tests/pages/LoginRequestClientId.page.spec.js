import { createLocalVue, shallowMount } from '@vue/test-utils'
import LoginRequest from '@/pages/login-request/_clientId'
import flushPromises from 'flush-promises'

describe('LoginRequestClientIdPage', function () {
  let localVue
  let $route
  let $router
  let wrapper
  let $t

  function initWrapper() {
    wrapper = shallowMount(LoginRequest, {
      localVue,
      mocks: {
        $route,
        $router,
        $t,
      },
    })
  }

  beforeEach(() => {
    $t = v => v
    localVue = createLocalVue()

    $route = {
      params: {
        clientId: 'myclient'
      },
      query: {
        param: 'test'
      },
    }
    $router = {
      push: jest.fn(),
    }
  })

  it('should create', function () {
    initWrapper()
    expect(wrapper).toBeTruthy()
  })

  it('should redirect to login', async function () {
    initWrapper()
    await flushPromises()
    expect($router.push).toHaveBeenCalledWith({
      path: '/login',
      query: {
        param: 'test',
        clientId: 'myclient'
      },
    })
  })
})
