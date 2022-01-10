import { buildSearchParams } from '@/utils'

describe('Auth utils', function () {
  it('should return query params', function () {
    const results = buildSearchParams({ query: { test: 'test', test1: 'test1' } })
    expect(results).toBe('?test=test&test1=test1')
  })

  it('should return empty string if params doesn\'t exists', function () {
    expect(buildSearchParams({ query: {} })).toBe('')
  })

  it('should not pass requestId param', function () {
    const results = buildSearchParams({ query: {
      test: 'test',
        test1: 'test1',
        requestId: 'requestId'
    } })
    expect(results).toBe('?test=test&test1=test1')
  })
})
