<template>
  <form @submit.prevent="handleSubmit" class="mb-4">
    <div class="mb-4">
      <div class="mb-4 text-center" v-if="username">
        <Avatar :username="username" :size="80"/>
        <h4 class="mb-0 mt-2">{{ username }}</h4>
      </div>
      <p>
        By clicking "Continue" you are revoking <b>{{ authority }}</b> authority from
        <b>{{ username }}</b>.
        Going forward <b>{{ username }}</b> will not be able to perform actions on your
        behalf.
      </p>
      <div class="flash flash-warn mt-4" v-if="account.name && !hasRequiredKey">
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
        v-if="!account.name || !hasRequiredKey"
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
      <button class="revoke-cancel btn btn-large mb-2" @click.prevent="handleReject">
        Cancel
      </button>
    </div>
  </form>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import { Account } from '@hiveio/dhive'
import { AuthModule } from '~/store'

@Component
export default class RevokeForm extends Vue {
  @Prop({
    type: String,
    default: '',
  })
  private username!: string

  @Prop({
    type: String,
    default: '',
  })
  private authority!: string

  @Prop({
    type: String,
    default: '',
  })
  private transactionId!: string

  @Prop({
    type: String,
    default: '',
  })
  private error!: string

  @Prop({
    type: Boolean,
    default: false,
  })
  private loading!: boolean

  @Prop({
    type: String,
    default: '',
  })
  private callback!: string

  private get account(): Account {
    return AuthModule.account
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
    this.$emit('loading', true)
    const data = {
      account: account.name,
      memo_key: account.memo_key,
      json_metadata: account.json_metadata,
    }
    data[authority] = JSON.parse(JSON.stringify(account[authority]))
    data[authority].account_auths.forEach((accountAuth, i) => {
      if (accountAuth[0] === username) {
        data[authority].account_auths.splice(i, 1)
      }
    })
    try {
      const confirmation = await this.updateAccount(data)
      await this.loadAccount()

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

  private handleReject(): void {
    this.$emit('failed', false)
    this.$emit('loading', false)
    this.$emit('transactionId', '')
    this.$router.push('/')
  }
}
</script>

<style scoped>

</style>
