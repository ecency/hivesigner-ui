import { createLocalVue, shallowMount } from '@vue/test-utils'
import OAuth2 from '@/pages/oauth2/authorize'

describe('OAuth2Page', function () {
  let localVue
  let $route
  let $router
  let wrapper
  let $t

  function initWrapper() {
    wrapper = shallowMount(OAuth2, {
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
      query: {}
    }
    $router = {
      push: jest.fn()
    }
  })

  it('should create', function () {
    initWrapper()
    expect(wrapper).toBeTruthy()
  })

  it('should handle login scope', async function () {
    $route.query = {
      scope: 'login'
    }
    initWrapper()
    expect($router.push).toHaveBeenCalledWith({ path: '/login', query: { scope: 'login' }})
  })

  it('should handle posting scope', function () {
    initWrapper()
    expect($router.push).toHaveBeenCalledWith({ path: '/login', query: { scope: 'posting' }})
  })

  it('should handle offline scope', function () {
    $route.query = {
      scope: 'offline'
    }
    initWrapper()

    expect($router.push).toHaveBeenCalledWith({ path: '/login', query: { scope: 'posting', response_type: 'code' }})
  })

  it('should handle extra offline scope', function () {
    $route.query = {
      scope: 'login/offline'
    }
    initWrapper()

    expect($router.push).toHaveBeenCalledWith({ path: '/login', query: { scope: 'posting', response_type: 'code' }})
  })
})
