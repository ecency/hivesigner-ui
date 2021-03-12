<template>
  <div>
    <Header title="Revoke (active)"/>
    <div class="p-4 after-header">
      <div class="container-sm mx-auto">
        <form
          v-if="hasAuthority && !failed && !transactionId"
          @submit.prevent="handleSubmit"
          class="mb-4"
        >
          <div class="mb-4">
            <div class="mb-4 text-center" v-if="username">
              <Avatar :username="username" :size="80"/>
              <h4 class="mb-0 mt-2">{{ username }}</h4>
            </div>
            <p>
              By clicking "Continue" you are revoking <b>{{ authority }}</b> authority from
              <b>{{ username }}</b
              >. Going forward <b>{{ username }}</b> will not be able to perform actions on your
              behalf.
            </p>
            <div class="flash flash-warn mt-4" v-if="account.name && hasRequiredKey === false">
              This transaction requires your <b>active</b> key.
            </div>
          </div>
          <div class="mt-2">
            <router-link
              :to="{
                name: 'login',
                query: { redirect: this.$route.fullPath, authority: 'active' },
              }"
              class="btn btn-large btn-blue mr-2 mb-2"
              v-if="!account.name || hasRequiredKey === false"
            >
              Continue
            </router-link>
            <button
              type="submit"
              class="btn btn-large btn-success mb-2 mr-2"
              :disabled="loading"
              v-else
            >
              Revoke
            </button>
            <button class="btn btn-large mb-2" @click.prevent="handleReject">
              Cancel
            </button>
          </div>
        </form>
        <div v-if="!hasAuthority && !failed && !transactionId">
          <p class="mb-4">
            You already revoked the account <b>{{ username }}</b> to do
            <b>{{ authority }}</b> operations on your behalf.
          </p>
          <template v-if="callback">
            <router-link
              v-if="callback[0] === '/'"
              :to="callback"
              class="btn btn-large btn-blue mb-2 mt-2"
            >
              Continue
            </router-link>
            <a v-else :href="callback" class="btn btn-large btn-blue mb-2 mt-2">
              Continue to {{ callback | parseUrl }}
            </a>
          </template>
        </div>
        <Error v-if="!loading && failed" :error="error"/>
        <Confirmation v-if="!loading && !!transactionId" :id="transactionId"/>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import { buildSearchParams, getAuthority, isWeb } from '~/utils'
import { AuthModule } from '../../store'
import Auth from '../../store/auth'

@Component
export default class RevokeUsername extends Vue {
  private loading = false
  private failed = false
  private error = false
  private transactionId = ''
  private isWeb = isWeb

  private get username(): string {
    return this.$route.params.username
  }

  private get authority(): string {
    return getAuthority(this.$route.query.authority, 'posting')
  }

  private get callback(): any {
    return this.$route.query.redirect_uri
  }

  private get uri(): string {
    return `hive://revoke/${this.$route.params.username}${buildSearchParams(this.$route)}`
  }

  private get account(): any {
    return AuthModule.account
  }

  private get hasAuthority(): boolean {
    if (this.account.name) {
      const auths = this.account[this.authority].account_auths.map(auth => auth[0])
      return auths.indexOf(this.username) !== -1
    }
    return true
  }

  private get hasRequiredKey(): boolean {
    return !!(AuthModule.username && AuthModule.keys.active)
  }

  private updateAccount(data: any): Promise<any> {
    return AuthModule.updateAccount(data)
  }

  private loadAccount(): Promise<void> {
    return AuthModule.loadAccount()
  }

  private async handleSubmit(): Promise<void> {
    const { username, authority, callback, account } = this
    this.loading = true
    const data = {
      account: account.name,
      memo_key: account.memo_key,
      json_metadata: account.json_metadata,
    }
    data[authority] = JSON.parse(JSON.stringify(account[authority]))
    data[authority].account_auths.forEach((accountAuth, i) => {
      if (accountAuth[0] === username) data[authority].account_auths.splice(i, 1)
    })
    try {
      const confirmation = await this.updateAccount(data)
      this.loadAccount().then(() => {
        if (isWeb && callback) {
          if (callback[0] === '/') {
            this.$router.push(callback)
          } else {
            window.location = callback
          }
        } else {
          this.transactionId = confirmation.id
          this.failed = false
          this.loading = false
        }
      })
    } catch (err) {
      this.error = err
      console.error('Failed to broadcast transaction', err)
      this.failed = true
      this.loading = false
    }
  }

  private handleReject(): void {
    this.failed = false
    this.loading = false
    this.transactionId = ''
    this.$router.push('/')
  }
}
</script>
