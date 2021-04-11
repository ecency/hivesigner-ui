import { createLocalVue, shallowMount } from '@vue/test-utils'
import RevokeUsername from '@/pages/revoke/_username'
import RevokeForm from '@/components/Revoke/RevokeForm'
import Already from '@/components/Already'
import ErrorComponent from '@/components/Error'
import Confirmation from '@/components/Confirmation'

jest.mock('@/utils')
jest.mock('@/store')
import * as utils from '@/utils'
import * as store from '@/store'

describe('RevokeUsernamePage', function () {
  let localVue
  let wrapper
  let redirectMock
  let $route

  function initWrapper() {
    localVue = createLocalVue()

    redirectMock = jest.fn()

    wrapper = shallowMount(RevokeUsername, {
      localVue,
      components: {
        RevokeForm,
        Already,
        Error: ErrorComponent,
        Confirmation,
      },
      mocks: {
        $route,
      },
    })
  }

  beforeEach(() => {
    $route = {
      params: {},
      query: {},
    }
    store.AuthModule = {
      account: {
        name: 'tester',
        posting: {
          account_auths: [['tester', 'tester2']]
        },
      },
    }
  })

  it('should create', function () {
    initWrapper()
    expect(wrapper).toBeTruthy()
  })

  it('should get authority from route query', function () {
    $route.query.authority = 'posting'
    utils.getAuthority = jest.fn().mockReturnValue('posting1')
    initWrapper()
    expect(wrapper.vm.authority).toBe('posting1')
  })

  it('should get username from route params', function () {
    $route.params.username = 'tester'
    initWrapper()
    expect(wrapper.vm.username).toBe('tester')
  })

  it('should get callback from route query', function () {
    $route.query.redirect_uri = 'callback'
    initWrapper()
    expect(wrapper.vm.callback).toBe('callback')
  })

  it('should get account from store', function () {
    store.AuthModule = {
      account: 'my acc',
    }
    initWrapper()
    expect(wrapper.vm.account).toBe('my acc')
  })

  it('should return hasAuthority', function () {
    $route.params.username = 'tester'
    $route.query.authority = 'posting'
    utils.getAuthority = jest.fn().mockReturnValue('posting')
    initWrapper()
    expect(wrapper.vm.hasAuthority).toBeTruthy()
  })

  it('should show revoke form if has authority and hasn\'t transaction id', function () {
    $route.params.username = 'tester'
    $route.query.authority = 'posting'
    $route.query.redirect_uri = 'callback'
    utils.getAuthority = jest.fn().mockReturnValue('posting')
    initWrapper()

    const element = wrapper.find('revoke-form-stub').element
    expect(element.getAttribute('username')).toBe('tester')
    expect(element.getAttribute('authority')).toBe('posting')
    expect(element.getAttribute('callback')).toBe('callback')
  })

  it('should show already if hasn\'t authority and hasn\'t transaction id', function () {
    $route.query.authority = 'posting2'
    $route.params.username = 'tester'
    $route.query.redirect_uri = 'callback'
    utils.getAuthority = jest.fn().mockReturnValue('posting2')
    initWrapper()

    const element = wrapper.find('already-stub').element
    expect(element.getAttribute('action')).toBe('revoked')
    expect(element.getAttribute('username')).toBe('tester')
    expect(element.getAttribute('authority')).toBe('posting2')
    expect(element.getAttribute('callback')).toBe('callback')
  })

  it('should show error if failed', async function () {
    initWrapper()
    wrapper.vm.failed = true
    wrapper.vm.error = 'my error'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('error-stub').element.getAttribute('error')).toBe('my error')
  })

  it('should show confirmation if has transaction id', async function () {
    initWrapper()
    wrapper.vm.transactionId = 'id'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('confirmation-stub').element.getAttribute('id')).toBe('id')
  })
})
