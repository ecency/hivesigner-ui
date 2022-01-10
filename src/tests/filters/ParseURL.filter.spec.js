import { parseURL } from '@/plugins/filter-functions'
import urlParse from 'url-parse'

jest.mock('url-parse', () => ({
  __esModule: true, // this property makes it work
  default: jest.fn(),
  namedExport: jest.fn()
}))

describe('ParseURLFilter', function () {
  it('should return host from url-parse', function () {
    urlParse.mockReturnValue({ host: 'my-host' })
    expect(parseURL('my-url')).toBe('my-host')
  })
})
