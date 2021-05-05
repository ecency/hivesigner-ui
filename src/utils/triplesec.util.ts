import triplesec from 'triplesec'
import { DecryptionExceptions } from '~/enums'

export function decrypt(key: string, encryptionKey?: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    triplesec.decrypt({
      data: new triplesec.Buffer(key, 'hex'),
      key: new triplesec.Buffer(encryptionKey as string, 'utf-8'),
    }, (decryptError, buff) => {
      if (decryptError) {
        reject(DecryptionExceptions.TriplesecError)
      }
      resolve(buff as Buffer)
    })
  })
}
