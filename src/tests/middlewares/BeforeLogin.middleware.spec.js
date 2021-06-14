import beforeLogin from '@/middleware/before-login'

describe('BeforeLoginMiddleware', function () {
  let redirectMock
  let store

  beforeEach(() => {
    store = {
      getters: {
        'accounts/hasAccounts': false
      }
    }
    redirectMock = jest.fn()
  })

  it('should redirect to import if has not accounts', function () {
    beforeLogin({
      store,
      redirect: redirectMock,
      query: { param: 'param1' },
    })
    expect(redirectMock).toHaveBeenCalledWith('/import', { param: 'param1' })
  })

  it('should not redirect if has accounts', function () {
    store.getters['accounts/hasAccounts'] = true
    beforeLogin({
      store,
      redirect: redirectMock,
      query: { param: 'param1' },
    })
    expect(redirectMock).not.toBeCalled()
  })
})
