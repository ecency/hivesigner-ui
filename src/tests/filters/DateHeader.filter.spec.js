import { dateHeader } from '@/plugins/filter-functions'

describe('DateHeaderFilter', function () {
  it('should return locale string', function () {
    const rawDate = '12-12-2021'
    expect(dateHeader(rawDate)).toBe(new Date(rawDate).toLocaleString())
  })
})
