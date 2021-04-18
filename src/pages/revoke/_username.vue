<template>
  <div class="font-old">
    <Header title="Revoke (active)"/>
    <div class="p-6">
      <div class="container-sm mx-auto">
        <revoke-form
          v-if="hasAuthority && !failed && !transactionId"
          :username="username"
          :authority="authority"
          :loading="loading"
          :transaction-id="transactionId"
          :error="error"
          @loading="(value) => loading = value"
          @transaction-id="(value) => transactionId = value"
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
        <Error v-if="!loading && failed" :error="error"/>
        <Confirmation v-if="!loading && !!transactionId" :id="transactionId"/>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import { getAuthority } from '~/utils'
import { AuthModule } from '~/store'
import { Authority } from '~/enums'
import { Account } from '@hiveio/dhive'

@Component({
  layout: 'page',
})
export default class RevokeUsername extends Vue {
  private loading = false
  private failed = false
  private error = false
  private transactionId = ''

  private get username(): string {
    return this.$route.params.username
  }

  private get authority(): Authority {
    return getAuthority(this.$route.query.authority as Authority, Authority.Posting)
  }

  private get callback(): any {
    return this.$route.query.redirect_uri
  }

  private get account(): Account {
    return AuthModule.account
  }

  private get hasAuthority(): boolean {
    if (this.account.name) {
      const auths = this.account[this.authority].account_auths.map(auth => auth[0])
      return auths.indexOf(this.username) !== -1
    }
    return true
  }
}
</script>
