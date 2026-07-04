import { hasPostingGrant, confirmPostingGrant } from '@/utils/posting-authority.util'
import { client } from '@/utils/client.util'

jest.mock('@/utils/client.util', () => ({
  client: { database: { getAccounts: jest.fn() } }
}))

const posting = (accountAuths: [string, number][], weightThreshold = 1) => ({
  weight_threshold: weightThreshold,
  account_auths: accountAuths,
  key_auths: []
})

describe('hasPostingGrant', () => {
  it('is true when the app is present with sufficient weight', () => {
    expect(hasPostingGrant(posting([['ecency.app', 1]]), 'ecency.app')).toBe(true)
  })

  it('is false when the app is absent', () => {
    expect(hasPostingGrant(posting([['peakd.app', 1]]), 'ecency.app')).toBe(false)
    expect(hasPostingGrant(posting([]), 'ecency.app')).toBe(false)
  })

  it('is false when the entry weight is below the threshold', () => {
    expect(hasPostingGrant(posting([['ecency.app', 1]], 2), 'ecency.app')).toBe(false)
  })

  it('is true when a higher threshold is exactly met', () => {
    expect(hasPostingGrant(posting([['ecency.app', 2]], 2), 'ecency.app')).toBe(true)
  })

  it('is false for missing posting or clientId', () => {
    expect(hasPostingGrant(null, 'ecency.app')).toBe(false)
    expect(hasPostingGrant(undefined, 'ecency.app')).toBe(false)
    expect(hasPostingGrant(posting([['ecency.app', 1]]), '')).toBe(false)
  })
})

describe('confirmPostingGrant', () => {
  const getAccounts = client.database.getAccounts as jest.Mock

  beforeEach(() => getAccounts.mockReset())

  it('confirms when the chain shows a sufficient grant', async () => {
    getAccounts.mockResolvedValue([{ posting: posting([['ecency.app', 1]]) }])
    await expect(confirmPostingGrant('alice', 'ecency.app')).resolves.toBe(true)
  })

  it('fails closed when the app is not authorized on-chain', async () => {
    getAccounts.mockResolvedValue([{ posting: posting([]) }])
    await expect(confirmPostingGrant('alice', 'ecency.app')).resolves.toBe(false)
  })

  it('fails closed when the account is not yet propagated (empty result)', async () => {
    getAccounts.mockResolvedValue([])
    await expect(confirmPostingGrant('newbie', 'ecency.app')).resolves.toBe(false)
  })

  it('fails closed when the RPC call throws', async () => {
    getAccounts.mockRejectedValue(new Error('node down'))
    await expect(confirmPostingGrant('alice', 'ecency.app')).resolves.toBe(false)
  })

  it('fails closed for empty username or clientId without hitting the chain', async () => {
    await expect(confirmPostingGrant('', 'ecency.app')).resolves.toBe(false)
    await expect(confirmPostingGrant('alice', '')).resolves.toBe(false)
    expect(getAccounts).not.toHaveBeenCalled()
  })
})
