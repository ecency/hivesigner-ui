<template>
  <form class="mb-4" @submit.prevent="handleSubmit">
    <div class="mb-4">
      <div v-if="username" class="mb-4 text-center">
        <Avatar :username="username" :size="80" />
        <h4 class="mt-2 text-xl font-bold text-black-500">
          {{ username }}
        </h4>
      </div>
      <p class="text-black-400 text-lg" v-html="$t('authorize.authority_require', { username, authority: 'posting' })" />
      <div v-if="authority === 'active'" class="alert alert-error mt-4">
        {{ $t('authorize.authority_active') }}
      </div>
      <div
        v-if="accountName && !hasRequiredKey"
        class="alert alert-warning mt-4"
        v-html="$t('authorize.requires_active_key', { authority })"
      />
    </div>
    <div class="mt-2">
      <router-link
        v-if="!accountName || !hasRequiredKey"
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
        {{ $t('authorize.authorize') }}
      </button>
      <button class="mb-2" @click.prevent="handleReject">
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
export default class AuthorizeForm extends Vue {
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
    type: Boolean,
    default: false
  })
  private loading!: string

  @Prop({
    default: () => ({})
  })
  private account!: Account

  private get accountName (): string | undefined {
    return this.account?.name
  }

  private get hasRequiredKey (): boolean {
    return !!(AuthModule.username && AccountsModule.isValidKeysForAuthority(this.authority, AuthModule.keys))
  }

  private async handleSubmit (): Promise<void> {
    const { username, authority, account } = this
    this.$emit('loading', true)
    const data = {
      account: account.name,
      memo_key: account.memo_key,
      json_metadata: account.json_metadata
    }
    data[authority] = JSON.parse(JSON.stringify(account[authority]))
    data[authority].account_auths.push([username, account[authority].weight_threshold])
    data[authority].account_auths.sort((a, b) => (a[0] > b[0] ? 1 : -1))

    this.$emit('submit', data)
  }

  private handleReject (): void {
    this.$emit('reject')
  }
}
</script>
