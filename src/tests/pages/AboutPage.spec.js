import { createLocalVue, shallowMount } from '@vue/test-utils'
import About from '@/pages/about'

jest.mock('@/consts')
import * as consts from '@/consts'

describe('AboutPage', function () {
  let localVue
  let $route
  let $router
  let wrapper
  let $t

  function initWrapper() {
    wrapper = shallowMount(About, {
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

  it('should return package', function () {
    consts.PACKAGE = { test: 'test' }
    initWrapper()
    expect(wrapper.vm.pkg).toEqual({ test: 'test' })
  })

  it('should return contributors', function () {
    consts.PACKAGE = {
      contributors: ['Tester 1 (https://ecency.com/@tester)', 'Tester 2' +
      ' (https://ecency.com/@tester)']
    }
    initWrapper()
    expect(JSON.stringify(wrapper.vm.contributors)).toBe(JSON.stringify([
      ['Tester 1 (https://ecency.com/@tester)', 'Tester 1', undefined, 'https://ecency.com/@tester'],
      ['Tester 2 (https://ecency.com/@tester)', 'Tester 2', undefined, 'https://ecency.com/@tester'],
    ]))
  })
})
