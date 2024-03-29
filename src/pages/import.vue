<template>
  <base-page-layout class="import">
    <template slot="left">
      <img class="block mx-auto image" :src="require('../assets/img/auth.svg')" alt="">
    </template>
    <template slot="right">
      <div v-if="!failed && !isRedirected">
        <div class="container-sm mx-auto">
          <div v-if="!failed && !signature && step === 1">
            <div v-if="app && appProfile" class="mb-4 text-center">
              <Avatar :username="app" :size="80" />
              <div class="mt-2">
                <h4 v-if="appProfile.name" class="mb-0">
                  {{ appProfile.name }}
                </h4>
                <span v-if="appProfile.website">{{ appProfile.website | parseUrl }}</span>
              </div>
            </div>
            <p>
              <span v-if="app">{{ $t('import.app') }}<b>{{ app }}</b></span>
              <span v-else>{{ $t('import.site') }}</span>
              {{ $t('import.request_access') }}
            </p>
          </div>
        </div>
      </div>
      <div class="mb-2">
        <form method="post" class="text-left" @submit.prevent="submitForm">
          <import-user-form
            v-if="step === 1"
            ref="import-user"
            :loading="loading"
            :error="error"
            :authority="authority"
            :errors="errors"
            @submit="startLogin"
            @loading="(value) => loading = value"
            @error="(value) => error = value"
            @next-step="() => step += 1"
          />
          <import-set-password
            v-if="step === 2"
            ref="set-password"
            :loading="loading"
            :errors="errors"
            @submit="submitForm"
          />
        </form>
      </div>
      <Loader v-if="loading" class="overlay fixed z-40" />
    </template>
  </base-page-layout>
</template>

<script lang="ts">
import PasswordValidator from 'password-validator'
import { Component, Ref, Vue, Watch } from 'nuxt-property-decorator'
import { Account } from '@hiveio/dhive'
import Bugsnag from '../plugins/bugsnag'
import BasePageLayout from '../components/Layouts/BasePageLayout.vue'
import { buildSearchParams, client, encrypt, getAuthority, isValidUrl } from '~/utils'
import { AccountsModule, AuthModule, PersistentFormsModule } from '~/store'
import { ERROR_INVALID_CREDENTIALS } from '~/consts'
import { Authority } from '~/enums'
import ImportSetPassword from '~/components/Import/ImportSetPassword.vue'
import ImportUserForm from '~/components/Import/ImportUserForm.vue'
import Icon from '~/components/UI/Icons/Icon.vue'
import Loader from '~/components/UI/Loader.vue'

const passphraseSchema = new PasswordValidator()
passphraseSchema.is().min(8).is().max(50).has().uppercase().has().lowercase()

@Component({
  components: { BasePageLayout, Loader, Icon }
})
export default class Import extends Vue {
  @Ref('set-password')
  private setPasswordRef!: ImportSetPassword

  @Ref('import-user')
  private importUserRef!: ImportUserForm

  private error = ''
  private isLoading = false
  private redirected = ''
  private showLoading = false
  private loading = false
  private failed = false
  private signature = null
  private requestId = this.$route.query.requestId as string
  private app = null
  private appProfile: Record<string, string> = {}
  private extraErrors: Record<string, any> = {}

  private get clientId (): string {
    return this.$route.params.clientId || this.$route.query.clientId as string ||
      this.$route.query.client_id as string
  }

  private get uri (): string {
    return `hive://login-request/${this.clientId}${buildSearchParams(this.$route)}`
  }

  private get callback (): string {
    return this.$route.query.redirect_uri as string
  }

  private get state (): string {
    return this.$route.query.state as string
  }

  private get responseType (): string {
    const responseType = this.$route.query.response_type as string
    return ['code', 'token'].includes(responseType) ? responseType : 'token'
  }

  private get scope (): string {
    const scope = this.$route.query.scope as string
    return ['login', 'posting'].includes(scope) ? scope : 'login'
  }

  private get authority (): Authority {
    return getAuthority((this.$route.query.authority as Authority) || Authority.Posting)
  }

  private get step (): number {
    return PersistentFormsModule.import.step as number
  }

  private set step (value: number) {
    return PersistentFormsModule.saveImportStep(value)
  }

  private get username (): string {
    return PersistentFormsModule.import.username as string
  }

  private set username (value: string) {
    return PersistentFormsModule.saveImportUsername(value)
  }

  private get password (): string {
    return PersistentFormsModule.import.password as string
  }

  private set password (value: string) {
    return PersistentFormsModule.saveImportPassword(value)
  }

  private get importKey (): string {
    return PersistentFormsModule.import.key as string
  }

  private set importKey (value: string) {
    return PersistentFormsModule.saveImportKey(value)
  }

  private get keyConfirmation (): string {
    return PersistentFormsModule.import.keyConfirmation as string
  }

  private set keyConfirmation (value: string) {
    return PersistentFormsModule.saveImportKeyConfirmation(value)
  }

  private get currentAccountUsername (): string {
    return AuthModule.username
  }

  private get isRedirected (): boolean {
    return this.redirected === '/auths' ||
      this.redirected === '/profile' ||
      this.redirected === '/import' ||
      this.redirected.includes('/authorize') ||
      this.redirected.includes('accounts') ||
      this.redirected.includes('/sign') ||
      this.redirected.includes('/revoke')
  }

  private get errors (): Record<string, string> {
    const current: Record<string, string> = {}
    const { username, password, importKey, keyConfirmation } = this
    if (!username) {
      current.username = this.$t('login.username_required') as string
    }
    if (!password) {
      current.password = this.$t('login.password_required') as string
    }
    if (!PersistentFormsModule.import.useSameEncryptionKey) {
      if (!importKey) {
        current.key = this.$t('login.hs_password_required') as string
      } else if (!passphraseSchema.validate(importKey as string)) {
        current.key = this.$t('login.hs_password_length') as string
      }
    }
    if (!keyConfirmation) {
      current.keyConfirmation = this.$t('login.hs_password_confirmation_required') as string
    } else if (keyConfirmation !== importKey && !PersistentFormsModule.import.useSameEncryptionKey) {
      current.keyConfirmation = this.$t('login.hs_password_not_match') as string
    }
    return { ...current, ...this.extraErrors }
  }

  private get account (): Account | null {
    return AuthModule.account
  }

  private get hasAuthority (): boolean {
    const auths = this.account.posting.account_auths.map(auth => auth[0])
    return auths.includes(this.clientId)
  }

  @Watch('keyConfirmation')
  private keyConfirmationChanged () {
    this.extraErrors = {}
  }

  private mounted (): void {
    this.redirected = this.$route.query.redirect as string || ''
    if (
      this.$route.fullPath === '/import' ||
      this.$route.fullPath === '/import?authority=posting'
    ) {
      this.redirected = '/import'
    }
    if (
      this.scope === 'posting' &&
      this.clientId &&
      this.currentAccountUsername &&
      !this.hasAuthority
    ) {
      this.$router.push({
        path: `/authorize/${this.clientId}`,
        query: { redirect_uri: this.uri.replace('hive:/', '') }
      })
    }
    if (this.clientId) {
      this.loadAppProfile()
    }
  }

  private beforeDestroy (): void {
    this.resetForm()
  }

  private async loadAppProfile (): Promise<void> {
    this.showLoading = true
    const app = this.clientId
    const accounts = await client.database.getAccounts([app])
    if (accounts[0]) {
      this.app = app
      try {
        this.appProfile = JSON.parse(accounts[0].posting_json_metadata).profile
        if ((!this.appProfile.redirect_uris.includes(this.callback) || !isValidUrl(this.callback))) {
          this.failed = true
        }
      } catch (e) {
        console.log('Failed to parse app account', e)

        Bugsnag.notify(e)
      }
    } else {
      this.failed = true
    }
    this.showLoading = false
  }

  private resetForm (): void {
    this.importUserRef?.reset()
    this.setPasswordRef?.reset()
    this.step = 1
    this.username = ''
    this.password = ''
    this.importKey = ''
    this.keyConfirmation = ''
  }

  private async startLogin (): Promise<void> {
    this.isLoading = true
    const { username, password, authority } = this
    const keys = await AccountsModule.getAuthoritiesKeys({ username, password })
    if (!AccountsModule.isValidKeysForAuthority(authority, keys)) {
      this.isLoading = false
      this.error = this.$t('import.master_key', { authority }) as string
      return
    }
    this.loading = true
    this.showLoading = true

    try {
      await AuthModule.login({ username: this.username, keys })
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
              signature: this.signature
            }
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
            callback: this.callback
          })
        } catch (err) {
          console.error('Failed to login', err)
          this.signature = ''
          this.failed = true
          this.loading = false
          this.showLoading = false

          Bugsnag.notify(err)
        }
      }
    } catch (err) {
      console.log('Login failed', err)
      this.isLoading = false
      this.error = this.$t(ERROR_INVALID_CREDENTIALS) as string
    }
  }

  private async submitForm (): Promise<void> {
    this.isLoading = true

    if (PersistentFormsModule.import.useSameEncryptionKey) {
      const isValidEncryptionPassword = await AccountsModule.isValidEncryptionKey({
        username: PersistentFormsModule.import.currentSelectedAccount,
        password: this.keyConfirmation
      })

      if (isValidEncryptionPassword) {
        this.importKey = this.keyConfirmation
      } else {
        this.$set(this.extraErrors, 'keyConfirmation', this.$t('import.same_key_not_match'))
        return
      }
    }

    const keys = await AccountsModule.getAuthoritiesKeys({
      username: this.username,
      password: this.password
    })
    try {
      const buff = await encrypt(keys, this.importKey)
      AccountsModule.saveAccount({
        username: this.username,
        keys: {
          password: buff.toString('hex')
        }
      })
      await this.startLogin()
    } catch (e) {
      this.isLoading = false

      Bugsnag.notify(e)
    }
  }
}
</script>

<style lang="scss">
.import {
  .image {
    max-width: 144px;
  }
}

@screen sm {
  .import {

    .image {
      max-width: 222px;
    }
  }
}

@screen xl {
  .import {

    .image {
      max-width: 411px;
    }
  }
}
</style>
