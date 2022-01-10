import { createLocalVue, shallowMount } from '@vue/test-utils'
import LoginRequest from '@/pages/login-request/_'
import flushPromises from 'flush-promises'

describe('LoginRequestPage', function () {
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
      query: 'myqueries',
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
      query: 'myqueries',
    })
  })
})
