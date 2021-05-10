import { Module, VuexAction, VuexModule, VuexMutation } from 'nuxt-property-decorator'
import { Account, cryptoUtils, SignedTransaction } from '@hiveio/dhive'
import { b64uEnc, client, privateKeyFrom, signComplete } from '~/utils'
import { AccountsModule } from './index'

@Module({
  stateFactory: true,
  namespaced: true,
  name: 'auth'
})
export default class Auth extends VuexModule {
  public keys: Record<string, string> = {}
  public account: Account | null = null

  public get username(): string {
    return this.account?.name || ''
  }

  public get password(): string {
    return this.keys.owner || this.keys.active || this.keys.posting || this.keys.memo
  }

  @VuexMutation
  public setUser({ result, keys }: { result: Account, keys: Record<string, string> }): void {
    this.keys = keys
    this.account = result
  }

  @VuexMutation
  public clearUser(): void {
    this.keys = {}
    this.account = null
  }

  @VuexMutation
  public setAccount(account: Account): void {
    this.account = account
  }

  @VuexAction({
    rawError: true
  })
  public async login({ username, keys }: any): Promise<any> {
    const key = keys.owner || keys.active || keys.posting || keys.memo
    const valid = await AccountsModule.isValidCredentials({
      username,
      password: key,
    })
    console.log(valid)

    if (!valid) {
      throw new Error('Invalid credentials')
    }

    const result = await client.database.getAccounts([username])

    this.setUser({ result: result[0], keys })

    this.store.app.$idleDetector.start(this.context.rootState.settings.timeout * 60 * 1000, () => {
      this.store.app.$idleDetector.stop()
      this.logout()
    })
  }P9nCkwDxQHoyoxvbp2ziBEyyYKGU1NRGHjSPButBvGZzn

  @VuexAction
  public async logout(): Promise<void> {
    this.clearUser()
    this.store.app.router.push('/')
  }

  @VuexAction
  public async loadAccount(): Promise<void> {
    const [account] = await client.database.getAccounts([this.username])
    this.setAccount(account)
  }

  @VuexAction({
    rawError: true,
  })
  public async sign({ tx, authority }: any): Promise<SignedTransaction> {
    const { chainId } = this.context.rootState.settings
    const privateKey = authority && this.keys[authority]
      ? privateKeyFrom(this.keys[authority])
      : privateKeyFrom(this.password)
    return cryptoUtils.signTransaction(tx, [privateKey], Buffer.from(chainId, 'hex'))
  }

  @VuexAction({
    rawError: true,
  })
  public async signMessage({ message, authority }: any): Promise<any> {
    const timestamp = parseInt((new Date().getTime() / 1000) + '', 10)
    const messageObj: any = { signed_message: message, authors: [this.username], timestamp }
    const hash = cryptoUtils.sha256(JSON.stringify(messageObj))
    const privateKey =
      authority && this.keys[authority]
        ? privateKeyFrom(this.keys[authority])
        : privateKeyFrom(this.password)
    const signature = privateKey.sign(hash).toString()
    messageObj.signatures = [signature]
    return messageObj
  }

  @VuexAction({
    rawError: true,
  })
  public async broadcast(tx: any): Promise<SignedTransaction> {
    return client.broadcast.send(tx)
  }

  @VuexAction({
    rawError: true,
  })
  public async updateAccount(data: any): Promise<SignedTransaction> {
    const privateKey = privateKeyFrom(this.keys.owner || this.keys.active)
    return client.broadcast.updateAccount(data, privateKey)
  }

  @VuexAction
  public async signAndRedirectToCallback(payload: any): Promise<void> {
    const loginObj: Record<string, any> = {
      type: payload.responseType === 'code' ? 'code' : payload.scope,
      ...(payload.app ? { app: payload.app } : {})
    }
    const signedMessageObj = await this.signMessage({
      message: loginObj,
      authority: payload.authority,
    });
    [payload.signature] = signedMessageObj.signatures
    const token = b64uEnc(JSON.stringify(signedMessageObj))

    if (payload.requestId) {
      signComplete(payload.requestId, null, token)
    }

    const additionalCallbackQuery = new URLSearchParams({
      ...(payload.responseType === 'code' ? { code: token } : {}),
      ...(payload.responseType !== 'code' ? {
        access_token: token,
        expires_in: '604800',
      } : {}),
      username: payload.username,
      state: encodeURIComponent(payload.state)
    })
    // @ts-ignore
    window.location = payload.callback + `?${additionalCallbackQuery.toString()}`
  }
}
