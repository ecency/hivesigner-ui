import { PrivateKey } from '@hiveio/dhive'
import * as bs58 from 'bs58'
import { client } from './client.util'
import { Authority } from '~/enums'

// TODO: Move it from utils

function decodePrivate (encodedKey: string): Buffer {
  const buffer: Buffer = bs58.decode(encodedKey)

  if (buffer[0] !== 128) { throw new Error('private key network id mismatch') }

  return buffer.slice(0, -4)
}

export function privateKeyFrom (password: string): PrivateKey {
  return new PrivateKey(decodePrivate(password).slice(1))
}

export function isKey (_: string, password: string): boolean {
  try {
    privateKeyFrom(password)
    return true
  } catch (err) {
    return false
  }
}

export async function getUserKeysMap (username: string): Promise<Record<string, string>> {
  const keys: Record<string, string> = {}

  let accounts = null
  try {
    accounts = await client.database.getAccounts([username])
  } catch (err) {
    console.error('Error getting data from chain', err)
    return keys
  }

  if (accounts.length !== 1) { return keys }

  const [account] = accounts

  keys[account.memo_key] = 'memo'

  const types = ['owner', 'active', 'posting']

  for (let i = 0; i < types.length; i += 1) {
    const keysOfType = account[types[i]].key_auths

    for (let j = 0; j < keysOfType.length; j += 1) {
      keys[keysOfType[j][0]] = types[i]
    }
  }

  return keys
}

export function getAuthority (str: Authority, fallback?: Authority): Authority | undefined {
  return Object.values(Authority).includes(str) ? str : fallback
}
