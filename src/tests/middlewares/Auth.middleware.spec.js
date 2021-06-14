import auth from '@/middleware/auth'

describe('AuthMiddleware', function () {
  let redirectMock

  beforeEach(() => {
    redirectMock = jest.fn()
  })

  it('should redirect to login if current account doesn\'t exists', function () {
    auth({
      redirect: redirectMock,
      params: {},
      store: {
        getters: {
          'auth/username': undefined
        }
      },
      route: {}
    })
    expect(redirectMock).toHaveBeenCalledWith('/login', { redirect: [] })
  })

  it('should redirect to import if current account doesn\'t exists and user hasn\'t any accounts', function () {
    auth({
      redirect: redirectMock,
      params: {},
      store: {
        getters: {
          'auth/username': undefined
        }
      },
      route: {}
    })
    expect(redirectMock).toHaveBeenCalledWith('/import', { redirect: [] })
  })

  it('should have authority parameter in redirect call', function () {
    utils.hasAccounts.mockReturnValue(true)
    auth({
      redirect: redirectMock,
      params: {
        authority: 'myAuthority'
      },
      store: {
        getters: {
          'auth/username': undefined
        }
      },
      route: {}
    })
    expect(redirectMock).toHaveBeenCalledWith('/login', { redirect: [], authority: 'myAuthority' })
  })

  it('should have redirect parameter in redirect call', function () {
    utils.hasAccounts.mockReturnValue(true)
    auth({
      redirect: redirectMock,
      params: {},
      store: {
        getters: {
          'auth/username': undefined
        }
      },
      route: {
        fullPath: 'https://testing.com'
      }
    })
    expect(redirectMock).toHaveBeenCalledWith('/login', { redirect: 'https://testing.com' })
  })

  it('should not redirect if user has current account', function () {
    auth({
      redirect: redirectMock,
      params: {},
      store: {
        getters: {
          'auth/username': 'authorized'
        }
      },
      route: {}
    })
    expect(redirectMock).not.toBeCalled()
  })
})
