import { KEYCHAIN_LOCALSTORAGE_KEY } from '~/consts'

export function getKeychain(): Record<string, unknown> {
  const storedKeychain = localStorage.getItem(KEYCHAIN_LOCALSTORAGE_KEY)
  let keychain = {}
  if (storedKeychain) {
    try {
      keychain = JSON.parse(storedKeychain)
    } catch (err) {
      console.log('Couldn`t parse stored hivesigner data', err)
    }
  }
  return keychain
}

export function hasAccounts(): boolean {
  const keychain = getKeychain()
  return Object.keys(keychain).length !== 0
}

export function addToKeychain(username: string, encryptedPassword: string): void {
  const keychain = getKeychain()
  keychain[username] = encryptedPassword
  localStorage.setItem(KEYCHAIN_LOCALSTORAGE_KEY, JSON.stringify(keychain))
}

export function removeFromKeychain(username: string): void {
  const keychain = getKeychain()
  delete keychain[username]
  localStorage.setItem(KEYCHAIN_LOCALSTORAGE_KEY, JSON.stringify(keychain))
}
