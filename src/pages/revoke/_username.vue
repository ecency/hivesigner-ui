<template>
  <single-page-layout :title="$t('revoke.revoke')" :flat="!loading && (failed || !!transactionId)">
    <transaction-status
      v-if="!loading && (failed || !!transactionId)"
      :status="failed ? 'failure' : 'success'"
      :success-message="successMessage"
      :failure-message="failureMessage"
    />
    <div v-if="!failed && !transactionId" class="container-sm mx-auto">
      <revoke-form
        v-if="hasAuthority && !failed && !transactionId"
        :username="username"
        :authority="authority"
        :loading="loading"
        :transaction-id="transactionId"
        :error="error"
        @loading="(value) => loading = value"
        @transactionId="setTransactionId"
        @error="(value) => error = value"
        @failed="(value) => failed = value"
      />
      <already
        v-if="!hasAuthority && !failed && !transactionId"
        action="revoked"
        :username="username"
        :authority="authority"
        :callback="callback"
      />
    </div>
  </single-page-layout>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import { Account } from '@hiveio/dhive'
import SinglePageLayout from '../../components/Layouts/SinglePageLayout.vue'
import TransactionStatus from '../../components/TransactionStatus.vue'
import { getAuthority } from '~/utils'
import { AuthModule } from '~/store'
import { Authority } from '~/enums'

@Component({
  components: { TransactionStatus, SinglePageLayout },
  layout: 'page'
})
export default class RevokeUsername extends Vue {
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

  private get callback (): any {
    return this.$route.query.redirect_uri
  }

  private get account (): Account {
    return AuthModule.account
  }

  private get hasAuthority (): boolean {
    if (this.account?.name) {
      const auths = this.account[this.authority]?.account_auths.map(auth => auth[0])
      return auths?.includes(this.username)
    }
    return true
  }

  private get successMessage (): string {
    return `<span class="text-gray">${this.$t('sign.transaction_id')}:</span> <a href="https://hiveblocks.com/tx/${this.transactionId}" target="_blank" class="text-black hover:underline cursor-pointer">${this.transactionId}</a>`
  }

  private get failureMessage (): string {
    return `<span class="text-gray">${this.$t('sign.error_message')}:</span> ${this.error}`
  }

  private setTransactionId (value: string): void {
    this.transactionId = value
  }
}
</script>
