import triplesec from 'triplesec'
import { DecryptionExceptions } from '~/enums'

export function decrypt (key: string, encryptionKey?: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    triplesec.decrypt({
      data: new (triplesec as any).Buffer(key, 'hex'),
      key: new (triplesec as any).Buffer(encryptionKey as string, 'utf-8')
    }, (decryptError, buff) => {
      if (decryptError) {
        reject(DecryptionExceptions.TriplesecError)
      }
      resolve(buff as Buffer)
    })
  })
}

export function encrypt (key: Record<string, string>, encryptionKey?: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    triplesec.encrypt(
      {
        data: new (triplesec as any).Buffer(JSON.stringify(key)),
        key: new (triplesec as any).Buffer(encryptionKey)
      },
      (encryptError, buff) => {
        if (encryptError) {
          reject(DecryptionExceptions.TriplesecError)
        }
        resolve(buff as Buffer)
      }
    )
  })
}
