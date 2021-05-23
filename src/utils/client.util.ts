import { CLIENT_OPTIONS, DEFAULT_SERVER, EXPIRE_TIME } from '~/consts'
import { Client } from '@hiveio/dhive'
import * as hiveuri from 'hive-uri'

// TODO: Move it from utils

let rawClient = new Client(DEFAULT_SERVER, CLIENT_OPTIONS)

const handler = {
  get(target: any, prop: string) {
    if (prop === 'updateClient') {
      return (address: string) => {
        rawClient = new Client(address, CLIENT_OPTIONS)
      }
    }
    return (rawClient as any)[prop]
  },
}

export const client: Client = new Proxy({}, handler)

export async function resolveTransaction(parsed: any, signer: string) {
  const props = await client.database.getDynamicGlobalProperties()

  // resolve the decoded tx and params to a signable tx
  const { tx } = hiveuri.resolveTransaction(parsed.tx, parsed.params, {
    /* eslint-disable no-bitwise */
    ref_block_num: props.head_block_number & 0xffff,
    ref_block_prefix: Buffer.from(props.head_block_id, 'hex').readUInt32LE(4),
    expiration: new Date(Date.now() + client.broadcast.expireTime + EXPIRE_TIME)
      .toISOString()
      .slice(0, -5),
    signers: [signer],
    preferred_signer: signer,
  })
  tx.ref_block_num = parseInt(tx.ref_block_num + '', 10)
  tx.ref_block_prefix = parseInt(tx.ref_block_prefix + '', 10)

  return tx
}
