<template>
  <Center>
    <router-link
      to="/"
      class="d-inline-block my-2 no-decoration"
      v-if="isRedirected"
    >
      <span class="logo iconfont icon-hivesigner"/>
      <h4 class="m-0">hivesigner</h4>
    </router-link>
    <div v-if="!failed && !isRedirected" class="p-4 after-header">
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
            <span v-if="app">The app <b>{{ app }}</b></span>
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
            :to="{ name: 'login', query: $route.query }"
            class="btn btn-large input-block text-center mb-2"
          >
            Select account
          </router-link>
          <button
            :disabled="isLoading"
            class="btn btn-large input-block text-center mb-2"
            @click="signUp()"
          >Signup
          </button>
        </div>
        <import-set-password
          ref="set-password"
          v-if="step === 2"
          :loading="loading"
          :errors="errors"
          @blurred="handleBlur"
        />
      </form>
    </div>
    <VueLoadingIndicator v-if="loading" class="overlay fixed big"/>
    <Footer/>
  </Center>
</template>

<script lang="ts">
import triplesec from 'triplesec'
import PasswordValidator from 'password-validator'
import { Component, Ref, Vue } from 'nuxt-property-decorator'
import {
  addToKeychain,
  buildSearchParams,
  client,
  credentialsValid,
  getAuthority,
  getKeys,
  hasAccounts,
  isChromeExtension,
  isValidUrl,
  signComplete
} from '~/utils'
import { AuthModule, PersistentFormsModule } from '~/store'
import { ERROR_INVALID_CREDENTIALS } from '~/consts'
import { Authority } from '~/enums'
import { Account } from '@hiveio/dhive'
import ImportSetPassword from '~/components/Import/ImportSetPassword.vue'

const passphraseSchema = new PasswordValidator()
passphraseSchema.is().min(8).is().max(50).has().uppercase().has().lowercase()

@Component
export default class Import extends Vue {
  @Ref('set-password')
  private setPasswordRef!: ImportSetPassword

  private dirty = {
    username: false,
    password: false,
  }
  private error = ''
  private storeAccount = true
  private isLoading = false
  private redirected = ''
  private showLoading = false
  private loading = false
  private failed = false
  private signature = null
  private requestId = this.$route.query.requestId as string
  private clientId = this.$route.params.clientId || this.$route.query.client_id as string
  private app = null
  private appProfile: Record<string, any> = {}
  private callback = this.$route.query.redirect_uri as string
  private uri = `hive =//login-request/${this.$route.params.clientId}${buildSearchParams(this.$route)}`

  private get state(): string {
    return this.$route.query.state as string
  }

  private get responseType(): string {
    const responseType = this.$route.query.response_type as string
    return ['code', 'token'].includes(responseType) ? responseType : 'token'
  }

  private get scope(): string {
    const scope = this.$route.query.scope as string
    return ['login', 'posting'].includes(scope) ? scope : 'login'
  }

  private get authority(): Authority {
    return getAuthority(this.$route.query.authority as Authority)
  }

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

  private get importKey(): string {
    return PersistentFormsModule.import.key
  }

  private set importKey(value: string) {
    return PersistentFormsModule.saveImportKey(value)
  }

  private get keyConfirmation(): string {
    return PersistentFormsModule.import.keyConfirmation
  }

  private set keyConfirmation(value: string) {
    return PersistentFormsModule.saveImportKeyConfirmation(value)
  }

  private get currentAccountUsername(): string {
    return AuthModule.username
  }

  private get hasAccounts(): boolean {
    return hasAccounts()
  }

  private get isRedirected(): boolean {
    return this.redirected === '/auths' ||
      this.redirected === '/profile' ||
      this.redirected === '/import' ||
      this.redirected.includes('/authorize') ||
      this.redirected.includes('accounts') ||
      this.redirected.includes('/sign') ||
      this.redirected.includes('/revoke')
  }

  private get errors(): Record<string, any> {
    const current: Record<string, any> = {}
    const { username, password, importKey, keyConfirmation } = this
    if (!username) {
      current.username = 'Username is required.'
    }
    if (!password) {
      current.password = 'Password is required.'
    }
    if (!importKey) {
      current.key = 'Hivesigner password is required.'
    } else if (!passphraseSchema.validate(importKey as string)) {
      current.key =
        'Hivesigner password has to be at least 8 characters long, contain lowercase letter and uppercase letter.'
    }
    if (!keyConfirmation) {
      current.keyConfirmation = 'Hivesigner password confirmation is required.'
    } else if (keyConfirmation !== importKey) {
      current.keyConfirmation = 'Hivesigner passwords do not match.'
    }
    return current
  }

  private get account(): Account | null {
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

  private mounted(): void {
    this.redirected = this.$route.query.redirect as string || ''
    if (
      this.$route.fullPath === '/import' ||
      this.$route.fullPath === '/import?authority=posting'
    ) {
      this.redirected = '/import'
    }
    if (
      this.scope === 'posting' &&
      !isChromeExtension() &&
      this.clientId &&
      this.currentAccountUsername &&
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
        this.appProfile = JSON.parse(accounts[0].posting_json_metadata).profile
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
    }
    this.setPasswordRef.reset()
    this.step = 1
    this.username = ''
    this.password = ''
    this.importKey = ''
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
      await this.login({ username: this.username, keys })
      const redirect = this.$route.query.redirect as string

      if (this.redirected !== '' && !this.redirected.includes('/login-request')) {
        this.$router.push(redirect || '/')
        this.error = ''
        this.isLoading = false
        this.resetForm()
      } else {
        if (
          this.scope === 'posting' &&
          this.clientId &&
          this.currentAccountUsername &&
          !this.hasAuthority
        ) {
          this.$router.push({
            name: 'authorize-username',
            params: { username: this.clientId },
            query: {
              ...this.$route.query,
              redirect_uri: this.callback,
              app: this.app,
              signature: this.signature,
            },
          })
          return
        }

        try {
          await AuthModule.signAndRedirectToCallback({
            username: this.username,
            authority: this.authority,
            signature: this.signature,
            state: this.state,
            responseType: this.responseType,
            app: this.app,
            scope: this.scope,
            callback: this.callback,
          })
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
    this.isLoading = true
    const invalidCredentials = !(await credentialsValid(this.username, this.password))
    this.isLoading = false
    if (invalidCredentials) {
      this.error = ERROR_INVALID_CREDENTIALS
      return
    }
    this.error = ''
    if (this.storeAccount) {
      this.step += 1
    } else {
      const keys = await getKeys(this.username, this.password)
      const k = Buffer.from(JSON.stringify(keys))
      addToKeychain(this.username as string, `${k.toString('hex')}decrypted`)
      await this.startLogin()
    }

  }

  private async submitForm(): Promise<void> {
    this.isLoading = true
    const keys = await getKeys(this.username, this.password)
    // @ts-ignore
    triplesec.encrypt(
      {
        data: new triplesec.Buffer(JSON.stringify(keys)),
        key: new triplesec.Buffer(this.importKey),
      },
      (encryptError, buff) => {
        if (encryptError) {
          this.isLoading = false
          console.log('err', encryptError)
          return
        }
        addToKeychain(this.username, buff.toString('hex'))
        this.startLogin()
      },
    )
  }
}
</script>
