<template>
  <form class="mb-4" @submit.prevent="handleSubmit">
    <div class="mb-4">
      <div v-if="username" class="mb-4 text-center">
        <Avatar :username="username" :size="80" />
        <h4 class="mt-2 text-xl font-bold text-black-500">
          {{ username }}
        </h4>
      </div>
      <p class="text-black-400 text-lg" v-html="$t('revoke.message', { authority, username })" />
      <div
        v-if="account && account.name && !hasRequiredKey"
        class="alert alert-warning mt-4"
        v-html="$t('authorize.requires_active_key', { authority: 'active' })"
      />
    </div>
    <div class="mt-2">
      <router-link
        v-if="!(account && account.name) || !hasRequiredKey"
        :to="{
          name: 'login',
          query: { redirect: $route.fullPath, authority: 'active' },
        }"
        class="button button-primary inline-block mr-2"
      >
        {{ $t('common.continue') }}
      </router-link>
      <button
        v-else
        type="submit"
        class="button-success mr-2"
        :disabled="loading"
      >
        {{ $t('revoke.revoke') }}
      </button>
      <button class="button-cancel" @click.prevent="handleReject">
        {{ $t('common.cancel') }}
      </button>
    </div>
  </form>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import { Account } from '@hiveio/dhive'
import { AccountsModule, AuthModule } from '~/store'

@Component
export default class RevokeForm extends Vue {
  @Prop({
    type: String,
    default: ''
  })
  private username!: string

  @Prop({
    type: String,
    default: ''
  })
  private authority!: string

  @Prop({
    type: String,
    default: ''
  })
  private transactionId!: string

  @Prop()
  private error!: string

  @Prop({
    type: Boolean,
    default: false
  })
  private loading!: boolean

  private get account (): Account {
    return AuthModule.account
  }

  private get hasRequiredKey (): boolean {
    return !!(AuthModule.username && AccountsModule.isValidKeysForAuthority(this.authority, AuthModule.keys))
  }

  private get callback (): string {
    return this.$route.query.redirect_uri as string
  }

  private async handleSubmit (): Promise<void> {
    const { username, authority, callback, account } = this
    this.$emit('loading', true)
    const data = {
      account: account.name,
      memo_key: account.memo_key,
      json_metadata: account.json_metadata
    }
    data[authority] = JSON.parse(JSON.stringify(account[authority]))
    data[authority].account_auths.forEach((accountAuth, i) => {
      if (accountAuth[0] === username) { data[authority].account_auths.splice(i, 1) }
    })
    try {
      const confirmation = await AuthModule.updateAccount(data)
      await AuthModule.loadAccount()

      if (callback) {
        if (callback[0] === '/') {
          this.$router.push(callback)
        } else {
          window.location = callback
        }
      } else {
        this.$emit('transactionId', confirmation.id)
        this.$emit('loading', false)
      }
    } catch (err) {
      this.$emit('error', err)
      console.error('Failed to broadcast transaction', err)
      this.$emit('failed', true)
      this.$emit('loading', false)
    }
  }

  private handleReject (): void {
    this.$emit('failed', false)
    this.$emit('loading', false)
    this.$emit('transactionId', '')
    this.$router.push('/')
  }
}
</script>

<style scoped>

</style>
