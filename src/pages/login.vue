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
    <div
      v-if="!failed && !isRedirected"
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
            <span v-if="app">The app <b>{{ app }}</b></span>
            <span v-else>This site </span>
            is requesting access to view your current account username.
          </p>
        </div>
      </div>
    </div>
    <div class="width-full p-4 mb-2">
      <login-form
        ref="login-form"
        :loading="isLoading"
        :keychain="keychain"
        :error="error"
        :authority="authority"
        @failed="value => this.failed = value"
        @error="value => this.error = value"
        @loading="value => this.loading = value"
        @signature="value => this.signature = value"
        @submit="loginMe"
      />
    </div>
    <VueLoadingIndicator v-if="loading" class="overlay fixed big"/>
    <Footer/>
  </Center>
</template>

<script lang="ts">
import { Component, Vue, Ref } from 'nuxt-property-decorator'
import {
  ERROR_INVALID_CREDENTIALS,
} from '~/consts'
import {
  buildSearchParams,
  client,
  getAuthority,
  getKeychain,
  isValidUrl,
  jsonParse,
  signComplete
} from '~/utils'
import { AuthModule, PersistentFormsModule } from '~/store'
import { Authority } from '~/enums'
import { Account } from '@hiveio/dhive'
import LoginForm from '~/components/Login/LoginForm.vue'

@Component({
  middleware: ['before-login'],
})
export default class Login extends Vue {
  @Ref('login-form')
  private loginFormRef!: LoginForm

  private keychain = {}
  private error = ''
  private isLoading = false
  private redirected = ''
  private showLoading = false
  private loading = false
  private failed = false
  private signature = null
  private app = null
  private appProfile: Record<string, any> = {}

  private get isRedirected(): boolean {
    return this.redirected === '/auths' ||
      this.redirected === '/profile' ||
      this.redirected === '/import' ||
      this.redirected.includes('/authorize') ||
      this.redirected.includes('accounts') ||
      this.redirected.includes('/sign') ||
      this.redirected.includes('/revoke')
  }

  private get callback(): string {
    return this.$route.query.redirect_uri as string
  }

  private get clientId(): string {
    return this.$route.params.clientId || this.$route.query.client_id as string
  }

  private get scope(): string {
    const scope = this.$route.query.scope as string
    return ['login', 'posting'].includes(scope) ? scope : 'login'
  }

  private get state(): string {
    return this.$route.query.state as string
  }

  private get responseType(): string {
    const responseType = this.$route.query.response_type as string
    return ['code', 'token'].includes(responseType) ? responseType : 'token'
  }

  private get requestId(): string {
    return this.$route.query.requestId as string
  }

  private get authority(): Authority {
    return getAuthority(this.$route.query.authority as Authority)
  }

  private get uri(): string {
    return `hive://login-request/${this.$route.params.clientId}${buildSearchParams(this.$route)}`
  }

  private get username(): string {
    return PersistentFormsModule.login.username
  }

  private set username(value: string) {
    PersistentFormsModule.saveLoginUsername(value)
  }

  private get currentAccountUsername(): string {
    return AuthModule.username
  }

  private get account(): Account | null {
    return AuthModule.account
  }

  private get hasAuthority(): boolean {
    const auths = this.account.posting.account_auths.map(auth => auth[0])
    return auths.indexOf(this.clientId) !== -1
  }

  private created(): void {
    this.loadKeychain()
  }

  private mounted(): void {
    this.redirected = this.$route.query.redirect as string || ''
    if (this.$route.fullPath === '/login' || this.$route.fullPath === '/login?authority=posting') {
      this.redirected = '/login'
    }

    if (
      this.scope === 'posting' &&
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

  private login(data: any): Promise<void> {
    return AuthModule.login(data)
  }

  private loadKeychain(): void {
    this.keychain = getKeychain()
    const usernames = Object.keys(this.keychain)
    if (usernames.length > 0) {
      [this.username] = usernames
    }
  }

  private async loginMe(buff): Promise<void> {
    const { authority } = this
    const keys = jsonParse(buff.toString())
    if (authority && !keys[authority]) {
      this.isLoading = false
      this.error = `You need to import your account using your password or at least ${authority} key to do this request. Click "Import account" button to proceed.`
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
        this.loginFormRef.resetForm()
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

  private async loadAppProfile(): Promise<void> {
    this.showLoading = true
    const app = this.clientId
    const accounts = await client.database.getAccounts([app])
    if (accounts[0]) {
      this.app = app
      try {
        this.appProfile = JSON.parse(accounts[0].json_metadata).profile
        if (!this.appProfile.redirect_uris.includes(this.callback) || !isValidUrl(this.callback)) {
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
}
</script>
