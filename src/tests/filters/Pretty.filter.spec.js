import { pretty } from '@/plugins/filter-functions'

describe('PrettyFilter', function () {
  it('should return prettied json', function () {
    const value = '{   "value":   1,"value2":   "test"    }'
    expect(pretty(value)).toBe('{\n  "value": 1,\n  "value2": "test"\n}')
  })

  it('should return value if given value is not JSON-parsable', function () {
    const value = '{   value:   1,"value2":   "test"    }'
    expect(pretty(value)).toBe('{   value:   1,"value2":   "test"    }')
  })
})
