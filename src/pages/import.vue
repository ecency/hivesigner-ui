<template>
  <Center>
    <router-link
      to="/"
      class="d-inline-block my-2 no-decoration"
      v-if="
        redirected == '/auths' ||
          redirected == '/profile' ||
          redirected == '/import' ||
          redirected.includes('/authorize') ||
          redirected.includes('accounts') ||
          redirected.includes('/sign') ||
          redirected.includes('/revoke')
      "
    >
      <span class="logo iconfont icon-hivesigner"/>
      <h4 class="m-0">hivesigner</h4>
    </router-link>
    <div
      v-if="
        !failed &&
          redirected != '/auths' &&
          redirected != '/profile' &&
          redirected != '/import' &&
          !redirected.includes('/authorize') &&
          !redirected.includes('accounts') &&
          !redirected.includes('/sign') &&
          !redirected.includes('/revoke')
      "
      class="p-4 after-header"
    >
      <div class="container-sm mx-auto">
        <div v-if="!failed && !signature">
          <div class="mb-4 text-center" v-if="app && appProfile">
            <Avatar :username="app" :size="80"/>
            <div class="mt-2">
              <h4 v-if="appProfile.name" class="mb-0">{{ appProfile.name }}</h4>
              <span v-if="appProfile.website">{{ appProfile.website | parseUrl }}</span>
            </div>
          </div>
          <p>
            <span v-if="app"
            >The app <b>{{ app }}</b></span
            >
            <span v-else>This site </span>
            is requesting access to view your current account username.
          </p>
        </div>
      </div>
    </div>
    <div class="width-full p-4 mb-2">
      <form @submit.prevent="submitForm" method="post" class="text-left">
        <div v-if="step === 1">
          <label for="username">Username</label>
          <div v-if="dirty.username && !!errors.username" class="error mb-2">
            {{ errors.username }}
          </div>
          <input
            key="username"
            v-model.trim="username"
            id="username"
            type="text"
            class="form-control input-lg input-block mb-2"
            autocorrect="off"
            autocapitalize="none"
            autocomplete="username"
            @blur="handleBlur('username')"
          />
          <label for="password"> Master password or {{ authority || 'private' }} key </label>
          <div v-if="dirty.password && !!errors.password" class="error mb-2">
            {{ errors.password }}
          </div>
          <input
            key="password"
            v-model.trim="password"
            id="password"
            type="password"
            autocorrect="off"
            autocapitalize="none"
            autocomplete="current-password"
            class="form-control input-lg input-block mb-2"
            @blur="handleBlur('password')"
          />
          <label class="mb-2" :class="{ 'mb-4': !error }">
            <input key="storeAccount" v-model="storeAccount" type="checkbox"/> Encrypt your keys
          </label>
          <div v-if="!!error" class="error mb-4">{{ error }}</div>
          <button
            :disabled="nextDisabled || isLoading"
            class="btn btn-large btn-blue input-block mb-2"
            @click.prevent="submitNext"
          >
            {{ nextText }}
          </button>
          <router-link
            v-if="hasAccounts"
            :to="{ name: 'login', query: { redirect, authority } }"
            class="btn btn-large input-block text-center mb-2"
          >
            Select account
          </router-link>
          <button
            :disabled="isLoading"
            class="btn btn-large input-block text-center mb-2"
            @click="signUp()"
          >
            Signup
          </button>
        </div>
        <div v-if="step === 2">
          <label for="key">
            Hivesigner password
            <span
              class="tooltipped tooltipped-n tooltipped-multiline"
              :aria-label="TOOLTIP_IMPORT_ENCRYPTION_KEY"
            >
              <span class="iconfont icon-info"/>
            </span>
          </label>
          <div v-if="dirty.key && !!errors.key" class="error mb-2">
            {{ errors.key }}
          </div>
          <input
            key="key"
            id="key"
            v-model.trim="key"
            type="password"
            autocorrect="off"
            autocapitalize="none"
            autocomplete="new-password"
            class="form-control input-lg input-block mb-2"
            @blur="handleBlur('key')"
          />
          <label for="key-confirmation">Confirm password</label>
          <div v-if="dirty.keyConfirmation && !!errors.keyConfirmation" class="error mb-2">
            {{ errors.keyConfirmation }}
          </div>
          <input
            key="keyConfirmation"
            id="key-confirmation"
            v-model.trim="keyConfirmation"
            type="password"
            autocorrect="off"
            autocapitalize="none"
            autocomplete="new-password"
            class="form-control input-lg input-block mb-2"
            @blur="handleBlur('keyConfirmation')"
          />
          <legend class="mb-4 d-block">
            The hivesigner password will be required to unlock your account for usage.
            {{ TOOLTIP_IMPORT_ENCRYPTION_KEY }}
          </legend>
          <button
            :disabled="submitDisabled || isLoading"
            type="submit"
            class="btn btn-large btn-blue input-block mb-2"
          >
            Import account
          </button>
        </div>
      </form>
    </div>
    <VueLoadingIndicator v-if="loading" class="overlay fixed big"/>
    <Footer/>
  </Center>
</template>

<script lang="ts">
import triplesec from 'triplesec'
import PasswordValidator from 'password-validator'
import { Component, Vue } from 'nuxt-property-decorator'
import {
  addToKeychain,
  b64uEnc,
  buildSearchParams,
  client, credentialsValid,
  getAuthority, getKeys,
  hasAccounts,
  isChromeExtension, isValidUrl,
  isWeb, signComplete
} from '~/utils'
import { AuthModule, PersistentFormsModule } from '~/store'
import { ERROR_INVALID_CREDENTIALS } from '../consts'

const passphraseSchema = new PasswordValidator()
passphraseSchema.is().min(8).is().max(50).has().uppercase().has().lowercase()

@Component
export default class Import extends Vue {
  private dirty = {
    username: false,
    password: false,
    key: false,
    keyConfirmation: false,
  }
  private error = ''
  private storeAccount = true
  private isLoading = false
  private redirect = this.$route.query.redirect
  private redirected = ''
  private TOOLTIP_IMPORT_ENCRYPTION_KEY
  private showLoading = false
  private loading = false
  private failed = false
  private signature = null
  private errorMessage = ''
  private isWeb = isWeb()
  private requestId = this.$route.query.requestId as string
  private authority = getAuthority(this.$route.query.authority)
  private isChrome = isChromeExtension()
  private clientId = this.$route.params.clientId || this.$route.query.client_id as string
  private app = null
  private appProfile: Record<string, any> = {}
  private callback = this.$route.query.redirect_uri as string
  private responseType = ['code', 'token'].includes(this.$route.query.response_type as string) ?
    this.$route.query.response_type as string : 'token'
  private state = this.$route.query.state as string
  private scope = ['login', 'posting'].includes(this.$route.query.scope as string) ?
    this.$route.query.scope : 'login'
  private uri = `hive =//login-request/${this.$route.params.clientId}${buildSearchParams(this.$route)}`

  private get step(): number {
    return PersistentFormsModule.import.step
  }

  private set step(value: number) {
    return PersistentFormsModule.saveImportStep(value)
  }

  private get username(): string {
    return PersistentFormsModule.import.username
  }

  private set username(value: string) {
    return PersistentFormsModule.saveImportUsername(value)
  }

  private get password(): string {
    return PersistentFormsModule.import.password
  }

  private set password(value: string) {
    return PersistentFormsModule.saveImportPassword(value)
  }

  private get key(): string {
    return PersistentFormsModule.import.key
  }

  private set key(value: string) {
    return PersistentFormsModule.saveImportKey(value)
  }

  private get keyConfirmation(): string {
    return PersistentFormsModule.import.keyConfirmation
  }

  private set keyConfirmation(value: string) {
    return PersistentFormsModule.saveImportKeyConfirmation(value)
  }

  private get username_pre(): string {
    return AuthModule.username
  }

  private get hasAccounts(): boolean {
    return hasAccounts()
  }

  private get errors(): Record<string, any> {
    const current: Record<string, any> = {}
    const { username, password, key, keyConfirmation } = this
    if (!username) {
      current.username = 'Username is required.'
    }
    if (!password) {
      current.password = 'Password is required.'
    }
    if (!key) {
      current.key = 'Hivesigner password is required.'
    } else if (!passphraseSchema.validate(key as string)) {
      current.key =
        'Hivesigner password has to be at least 8 characters long, contain lowercase letter and uppercase letter.'
    }
    if (!keyConfirmation) {
      current.keyConfirmation = 'Hivesigner password confirmation is required.'
    } else if (keyConfirmation !== key) {
      current.keyConfirmation = 'Hivesigner passwords do not match.'
    }
    return current
  }

  private get account(): any {
    return AuthModule.account
  }

  private get hasAuthority(): boolean {
    const auths = this.account.posting.account_auths.map(auth => auth[0])
    return auths.indexOf(this.clientId) !== -1
  }

  private get nextText(): string {
    return this.storeAccount ? 'Continue' : 'Import account'
  }

  private get nextDisabled(): boolean {
    return !!this.errors.username || !!this.errors.password
  }

  private get submitDisabled(): boolean {
    return !!this.errors.key || !!this.errors.keyConfirmation
  }

  private mounted(): void {
    this.redirected = this.$route.query.redirect as string || ''
    if (
      this.$route.fullPath === '/import' ||
      this.$route.fullPath === '/import?authority=posting'
    ) {
      this.redirected = '/import'
    }
    const url = this.getJsonFromUrl().redirect
    if (url) {
      const params = `?${url.split('?')[0]}`
      const query = this.getJsonFromUrl(`?${url.split('?').pop()}`)
      this.callback = query.redirect_uri
      this.responseType = ['code', 'token'].includes(query.response_type)
        ? query.response_type
        : 'token'
      this.state = query.state
      this.scope = ['login', 'posting'].includes(query.scope) ? query.scope : 'login'
      this.clientId = (!params.includes('/sign') && params.split('/').pop()) || query.client_id
    }
    if (
      this.scope === 'posting' &&
      !isChromeExtension() &&
      this.clientId &&
      this.username_pre &&
      !this.hasAuthority
    ) {
      this.$router.push({
        name: 'authorize',
        params: { username: this.clientId },
        query: { redirect_uri: this.uri.replace('hive:/', '') },
      })
    } else if (this.clientId) {
      this.loadAppProfile()
    }
  }

  private login(data: any): Promise<any> {
    return AuthModule.login(data)
  }

  private signMessage(data: any): Promise<any> {
    return AuthModule.signMessage(data)
  }

  private getJsonFromUrl(url?: string): Record<string, any> {
    let theUrl = url
    if (!theUrl) theUrl = window.location.search
    const query = theUrl.substr(1)
    const result = {}
    query.split('&').forEach(part => {
      const item = part.split('=')
      result[item[0]] = decodeURIComponent(item[1])
    })
    return result
  }

  private signUp(): void {
    window.open('https://signup.hive.io', '_blank')
  }

  private async loadAppProfile(): Promise<void> {
    this.showLoading = true
    const app = this.clientId
    const accounts = await client.database.getAccounts([app])
    if (accounts[0]) {
      this.app = app
      try {
        this.appProfile = JSON.parse(accounts[0].json_metadata).profile
        if (
          !isChromeExtension() &&
          (!this.appProfile.redirect_uris.includes(this.callback) || !isValidUrl(this.callback))
        ) {
          this.failed = true
        }
      } catch (e) {
        console.log('Failed to parse app account', e)
      }
    } else {
      this.failed = true
    }
    this.showLoading = false
  }

  private resetForm(): void {
    this.dirty = {
      username: false,
      password: false,
      key: false,
      keyConfirmation: false,
    }
    this.step = 1
    this.username = ''
    this.password = ''
    this.key = ''
    this.keyConfirmation = ''
  }

  private handleBlur(name: string): void {
    this.dirty[name] = true
  }

  private async startLogin(): Promise<void> {
    this.isLoading = true
    const { username, password, authority } = this
    const keys = await getKeys(username, password)
    if (authority && !keys[authority]) {
      this.isLoading = false
      this.error = `You need to use master or at least ${authority} key to login.`
      return
    }
    this.loading = true
    this.showLoading = true

    try {
      const response = await this.login({ username, keys })
      const redirect = this.$route.query.redirect as string
      if (this.redirected !== '' && !this.redirected.includes('/login-request')) {
        this.$router.push(redirect || '/')
        this.error = ''
        this.isLoading = false
        this.resetForm()
      } else {
        if (
          this.scope === 'posting' &&
          !isChromeExtension() &&
          this.clientId &&
          this.username_pre &&
          !this.hasAuthority
        ) {
          const uri = `hive://login-request/${this.clientId}?${redirect.replace(/\/login-request\/[a-z]+\?/, '')}`
          this.$router.push({
            name: 'authorize',
            params: { username: this.clientId },
            query: { redirect_uri: uri.replace('hive:/', '') },
          })
          return
        }
        try {
          const loginObj: Record<string, any> = {}
          loginObj.type = isChromeExtension() ? 'login' : this.scope
          if (this.responseType === 'code') loginObj.type = 'code'
          if (this.app) loginObj.app = this.app
          const signedMessageObj = await this.signMessage({
            message: loginObj,
            authority: this.authority,
          });
          [this.signature] = signedMessageObj.signatures
          const token = b64uEnc(JSON.stringify(signedMessageObj))
          if (this.requestId) {
            signComplete(this.requestId, null, token)
          }
          if (!isChromeExtension()) {
            let { callback } = this
            callback +=
              this.responseType === 'code' ? `?code=${token}` : `?access_token=${token}`
            callback += `&username=${this.username}`
            if (this.responseType !== 'code') callback += '&expires_in=604800'
            if (this.state) callback += `&state=${encodeURIComponent(this.state)}`
            // @ts-ignore
            window.location = callback
          }
        } catch (err) {
          console.error('Failed to login', err)
          this.signature = ''
          this.failed = true
          if (this.requestId) {
            signComplete(this.requestId, err, null)
          }
          this.loading = false
          this.showLoading = false
        }
      }
    } catch (err) {
      console.log('Login failed', err)
      this.isLoading = false
      this.error = ERROR_INVALID_CREDENTIALS
    }
  }

  private async submitNext(): Promise<void> {
    const { username, password } = this
    this.isLoading = true
    const invalidCredentials = !(await credentialsValid(username, password))
    this.isLoading = false
    if (invalidCredentials) {
      this.error = ERROR_INVALID_CREDENTIALS
      return
    }
    this.error = ''
    if (this.storeAccount) {
      this.step += 1
    } else {
      const keys = await getKeys(username, password)
      const k = Buffer.from(JSON.stringify(keys))
      addToKeychain(username as string, `${k.toString('hex')}decrypted`)
      this.startLogin()
    }

  }

  private async submitForm(): Promise<void> {
    const { username, password, key } = this
    this.isLoading = true
    const keys = await getKeys(username, password)
    // @ts-ignore
    triplesec.encrypt(
      {
        data: new triplesec.Buffer(JSON.stringify(keys)),
        key: new triplesec.Buffer(key),
      },
      (encryptError, buff) => {
        if (encryptError) {
          this.isLoading = false
          console.log('err', encryptError)
          return
        }
        addToKeychain(username, buff.toString('hex'))
        this.startLogin()
      },
    )
  }
}
</script>
