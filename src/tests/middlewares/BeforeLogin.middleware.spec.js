import beforeLogin from '@/middleware/before-login'

jest.mock('@/utils')
import * as utils from '@/utils'

describe('BeforeLoginMiddleware', function () {
  let redirectMock

  beforeEach(() => {
    redirectMock = jest.fn()
    utils.hasAccounts = jest.fn()
  })

  it('should redirect to import if has not accounts', function () {
    utils.hasAccounts.mockReturnValue(false)
    beforeLogin({
      redirect: redirectMock,
      query: { param: 'param1' },
    })
    expect(redirectMock).toHaveBeenCalledWith('/import', { param: 'param1' })
  })

  it('should not redirect if has accounts', function () {
    utils.hasAccounts.mockReturnValue(true)
    beforeLogin({
      redirect: redirectMock,
      query: { param: 'param1' },
    })
    expect(redirectMock).not.toBeCalled()
  })
})
