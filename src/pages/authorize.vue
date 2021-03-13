<template>
  <div>
    <Header title="Authorize (active)"/>
    <div class="p-4 after-header">
      <div class="container-sm mx-auto">
        <form
          v-if="!hasAuthority && !failed && !transactionId"
          @submit.prevent="handleSubmit"
          class="mb-4"
        >
          <div class="mb-4">
            <div class="mb-4 text-center" v-if="username">
              <Avatar :username="username" :size="80"/>
              <h4 class="mb-0 mt-2">{{ username }}</h4>
            </div>
            <p>
              The <b>{{ username }}</b> requires your <b>{{ authority }}</b> authority in order for
              you to be able to interact with it. By clicking "Continue" you are allowing
              {{ authority }} access. This can be withdrawn by you at any time by clicking
              <a :href="'https://hivesigner.com/revoke/' + username" target="_blank">HERE</a>.
            </p>
            <div class="flash flash-error mt-4" v-if="authority === 'active'">
              Giving active authority enables the authorized account to do fund transfers from your
              account, this should be used with utmost care.
            </div>
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
              Authorize
            </button>
            <button class="btn btn-large mb-2" @click.prevent="handleReject">
              Cancel
            </button>
          </div>
        </form>
        <div v-if="hasAuthority && !failed && !transactionId">
          <p class="mb-4">
            You already authorize the account <b>{{ username }}</b> to do
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
import { Vue } from 'nuxt-property-decorator'
import { buildSearchParams, getAuthority, isWeb } from '~/utils'
import { AuthModule } from '../store'

export default class Authorize extends Vue {
  private loading = false
  private failed = false
  private error = false
  private transactionId = ''

  private get isWeb(): boolean {
    return isWeb()
  }

  private get username(): string {
    return this.$route.params.username
  }

  private get authority(): string {
    return getAuthority(this.$route.query.authority, 'posting')
  }

  private get callback(): string {
    return this.$route.query.redirect_uri as string
  }

  private uri(): string {
    return `hive://authorize/${this.$route.params.username}${buildSearchParams(this.$route)}`
  }

  private get account(): any {
    return AuthModule.account
  }

  private get hasAuthority(): boolean {
    if (this.account.name) {
      const auths = this.account[this.authority].account_auths.map(auth => auth[0])
      return auths.indexOf(this.username) !== -1
    }
    return false
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
    data[authority].account_auths.push([username, account[authority].weight_threshold])
    data[authority].account_auths.sort((a, b) => (a[0] > b[0] ? 1 : -1))

    try {
      const confirmation = this.updateAccount(data)
      const response = await this.loadAccount()

      if (isWeb && callback) {
        if (callback[0] === '/') {
          // this.$router.push(callback);
          this.$router.push({
            name: 'login',
            query: { redirect: callback },
          })
        } else {
          // @ts-ignore
          window.location = callback
        }
      } else {
        this.transactionId = confirmation.id
        this.failed = false
        this.loading = false
      }
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
