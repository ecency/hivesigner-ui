<template>
  <base-page-layout class="login">
    <template slot="left">
      <img class="block mx-auto image" :src="require('../assets/img/auth.svg')" alt="">
    </template>
    <template slot="right">
      <div
        v-if="!failed && !isRedirected"
        class="p-6"
      >
        <div class="container-sm mx-auto">
          <div v-if="!failed && !signature">
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
        <login-form
          ref="login-form"
          :loading="isLoading"
          :error="error"
          :authority="authority"
          @failed="value => failed = value"
          @error="value => error = value"
          @loading="value => isLoading = value"
          @signature="value => signature = value"
          @submit="loginMe"
        />
        <router-link
          :to="{ name: 'import', query: $route.query }"
          class="button block text-center mb-2"
        >
          {{ $t('import.add_another_account') }}
        </router-link>
        <div class="text-gray text-lg pt-4">
          {{ $t('import.dont_have_an_account') }}
          <a
            href="https://signup.hive.io"
            target="_blank"
            rel="noopener"
            class="text-black-500 hover:underline"
          >{{ $t('import.sign_up_here') }}</a>
        </div>
      </div>
      <Loader v-if="isLoading" class="overlay fixed" />
    </template>
  </base-page-layout>
</template>

<script lang="ts">
import { Component, Vue, Ref } from 'nuxt-property-decorator'
import { Account } from '@hiveio/dhive'
import Icon from '../components/UI/Icons/Icon.vue'
import Loader from '../components/UI/Loader.vue'
import BasePageLayout from '../components/Layouts/BasePageLayout.vue'
import {
  ERROR_INVALID_CREDENTIALS
} from '~/consts'
import {
  buildSearchParams,
  client,
  getAuthority,
  isValidUrl
} from '~/utils'
import { AccountsModule, AuthModule } from '~/store'
import { Authority } from '~/enums'
import LoginForm from '~/components/Login/LoginForm.vue'

@Component({
  components: { BasePageLayout, Loader, Icon },
  middleware: ['before-login']
})
export default class Login extends Vue {
  @Ref('login-form')
  private loginFormRef!: LoginForm

  private error = ''
  private isLoading = false
  private redirected = ''
  private showLoading = false
  private failed = false
  private signature = null
  private app = null
  private appProfile: Record<string, string> = {}

  private get isRedirected (): boolean {
    return this.redirected === '/auths' ||
      this.redirected === '/profile' ||
      this.redirected === '/import' ||
      this.redirected.includes('/authorize') ||
      this.redirected.includes('accounts') ||
      this.redirected.includes('/sign') ||
      this.redirected.includes('/revoke')
  }

  private get callback (): string {
    return this.$route.query.redirect_uri as string
  }

  private get clientId (): string {
    return this.$route.params.clientId || this.$route.query.client_id as string
  }

  private get scope (): string {
    const scope = this.$route.query.scope as string
    return ['login', 'posting'].includes(scope) ? scope : 'login'
  }

  private get state (): string {
    return this.$route.query.state as string
  }

  private get responseType (): string {
    const responseType = this.$route.query.response_type as string
    return ['code', 'token'].includes(responseType) ? responseType : 'token'
  }

  private get requestId (): string {
    return this.$route.query.requestId as string
  }

  private get authority (): Authority {
    return getAuthority(this.$route.query.authority as Authority)
  }

  private get uri (): string {
    return `hive://login-request/${this.$route.params.clientId}${buildSearchParams(this.$route)}`
  }

  private get currentAccountUsername (): string {
    return AuthModule.username
  }

  private get account (): Account | null {
    return AuthModule.account
  }

  private get hasAuthority (): boolean {
    const auths = this.account.posting.account_auths.map(auth => auth[0])
    return auths.includes(this.clientId)
  }

  private mounted (): void {
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
        query: { redirect_uri: this.uri.replace('hive:/', '') }
      })
    } else if (this.clientId) {
      this.loadAppProfile()
    }
  }

  private async loginMe (keys: Record<string, string>): Promise<void> {
    const { authority } = this
    if (authority && !keys[authority]) {
      this.isLoading = false
      this.error = this.$t('login.need_import', { authority }) as string
      return
    }
    this.isLoading = true
    this.showLoading = true
    try {
      await AuthModule.login({ username: AccountsModule.selectedAccount, keys })
      const redirect = this.$route.query.redirect as string

      if (this.redirected !== '' && !this.redirected.includes('/login-request')) {
        await this.$router.push(redirect || '/')
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
              signature: this.signature
            }
          })
          return
        }

        try {
          await AuthModule.signAndRedirectToCallback({
            username: AccountsModule.selectedAccount,
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
          this.isLoading = false
          this.showLoading = false
        }
      }
    } catch (err) {
      console.log('Login failed', err)
      this.isLoading = false
      this.error = this.$t(ERROR_INVALID_CREDENTIALS) as string
    }
  }

  private async loadAppProfile (): Promise<void> {
    this.showLoading = true
    const app = this.clientId
    const accounts = await client.database.getAccounts([app])
    if (accounts[0]) {
      this.app = app
      try {
        this.appProfile = JSON.parse(accounts[0].posting_json_metadata).profile as Record<string, string>
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
<style lang="scss">
.login {
  .image {
    max-width: 144px;
  }
}

@screen sm {
  .login {

    .image {
      max-width: 222px;
    }
  }
}

@screen xl {
  .login {

    .image {
      max-width: 411px;
    }
  }
}
</style>
