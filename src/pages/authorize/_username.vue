<template>
  <single-page-layout
    :title="$t('authorize.authorize')"
    :flat="!loading && (failed || !!transactionId)"
  >
    <transaction-status
      v-if="!loading && (failed || !!transactionId)"
      :status="failed ? 'failure' : 'success'"
      :success-message="successMessage"
      :failure-message="failureMessage"
    />
    <div v-if="!failed && !transactionId" class="container-sm mx-auto">
      <authorize-form
        v-if="!hasAuthority && !failed && !transactionId"
        :username="username"
        :account="account"
        :authority="lowestRequiredAuthority"
        :loading="loading"
        @submit="handleSubmit"
        @loading="onLoadingChange"
        @reject="handleReject"
      />
      <already
        v-if="hasAuthority && !failed && !transactionId"
        action="authorized"
        :username="username"
        :authority="authority"
        :callback="callback"
      />
      <Error v-if="!loading && failed" :error="error" />
      <Confirmation v-if="!loading && !!transactionId" :id="transactionId" />
    </div>
  </single-page-layout>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import { Account, TransactionConfirmation } from '@hiveio/dhive'
import SinglePageLayout from '../../components/Layouts/SinglePageLayout.vue'
import TransactionStatus from '../../components/TransactionStatus.vue'
import { getAuthority } from '~/utils'
import { AuthModule } from '~/store'
import { Authority } from '~/enums'

@Component({
  components: { TransactionStatus, SinglePageLayout },
  layout: 'page'
})
export default class AuthorizeUsername extends Vue {
  private loading = false
  private failed = false
  private error = false
  private transactionId = ''

  private get username (): string {
    return this.$route.params.username.replace('@', '')
  }

  private get authority (): Authority {
    return getAuthority(this.$route.query.authority as Authority, Authority.Posting)
  }

  private get lowestRequiredAuthority (): Authority {
    return ['active', 'owner'].includes(this.authority) ? this.authority : Authority.Active
  }

  private get account (): Account | null {
    return AuthModule.account
  }

  private get callback (): string {
    return this.$route.query.redirect_uri as string
  }

  private get scope (): string {
    const scope = this.$route.query.scope as string
    return ['login', 'posting'].includes(scope) ? scope : 'login'
  }

  private get responseType (): string {
    const responseType = this.$route.query.response_type as string
    return ['code', 'token'].includes(responseType) ? responseType : 'token'
  }

  private get hasAuthority (): boolean {
    if (this.account?.name) {
      const auths = this.account[this.authority].account_auths.map(auth => auth[0])
      return auths.includes(this.username)
    }
    return false
  }

  private get successMessage (): string {
    return `<span class="text-gray">${this.$t('sign.transaction_id')}:</span> <a href="https://hiveblocks.com/tx/${this.transactionId}" target="_blank" class="text-black hover:underline cursor-pointer">${this.transactionId}</a>`
  }

  private get failureMessage (): string {
    return `<span class="text-gray">${this.$t('sign.error_message')}:</span> ${this.error}`
  }

  private updateAccount (data: any): Promise<TransactionConfirmation> {
    return AuthModule.updateAccount(data)
  }

  private loadAccount (): Promise<void> {
    return AuthModule.loadAccount()
  }

  private async handleSubmit (data: Record<string, string>): Promise<void> {
    try {
      const confirmation = await this.updateAccount(data)
      await this.loadAccount()

      if (this.callback) {
        if (this.callback[0] === '/') {
          await this.$router.push({
            name: 'login',
            query: { redirect: this.callback }
          })
        } else {
          await AuthModule.signAndRedirectToCallback({
            username: this.username,
            authority: this.authority as string,
            signature: this.$route.query.signature as string || '',
            state: this.$route.query.state as string || '',
            responseType: this.responseType,
            app: this.$route.query.app as string || '',
            scope: this.scope,
            callback: this.callback
          })
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

  private handleReject (): void {
    this.failed = false
    this.loading = false
    this.transactionId = ''
    this.$router.push('/')
  }

  private onLoadingChange (value: boolean): void {
    this.loading = value
  }
}
</script>
