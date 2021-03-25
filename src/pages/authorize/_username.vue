<template>
  <div>
    <Header title="Authorize (active)"/>
    <div class="p-4 after-header">
      <div class="container-sm mx-auto">
        <authorize-form
          v-if="!hasAuthority && !failed && !transactionId"
          :username="username"
          :account="account"
          :authority="authority"
          :loading="loading"
          :submit="handleSubmit"
          @loading="onLoadingChange"
          @reject="handleReject"
        />
        <already-authorized
          v-if="hasAuthority && !failed && !transactionId"
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

@Component
export default class AuthorizeUsername extends Vue {
  private loading = false
  private failed = false
  private error = false
  private transactionId = ''
  private username = this.$route.params.username
  private authority = getAuthority(this.$route.query.authority as Authority, Authority.Posting)

  private get account(): Account | null {
    return AuthModule.account
  }

  private get callback(): string {
    return this.$route.query.redirect_uri as string
  }

  private get hasAuthority(): boolean {
    if (this.account?.name) {
      const auths = this.account[this.authority].account_auths.map(auth => auth[0])
      return auths.indexOf(this.username) !== -1
    }
    return false
  }

  private updateAccount(data: any): Promise<any> {
    return AuthModule.updateAccount(data)
  }

  private loadAccount(): Promise<void> {
    return AuthModule.loadAccount()
  }

  private async handleSubmit(data: Record<string, string>): Promise<void> {
    try {
      const confirmation = await this.updateAccount(data)
      await this.loadAccount()

      if (this.callback) {
        if (this.callback[0] === '/') {
          this.$router.push({
            name: 'login',
            query: { redirect: this.callback },
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

  private onLoadingChange(value: boolean): void {
    this.loading = value
  }
}
</script>
