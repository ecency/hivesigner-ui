<template>
  <form class="mb-4" @submit.prevent="handleSubmit">
    <div class="mb-4">
      <div class="mb-4 text-center" v-if="username">
        <Avatar :username="username" :size="80"/>
        <h4 class="mt-2 text-xl font-bold text-black-500">{{ username }}</h4>
      </div>
      <p class="text-black-400 text-lg">
        The <b>{{ username }}</b> requires your <b>{{ authority }}</b> authority in order for
        you to be able to interact with it. By clicking "Continue" you are allowing
        {{ authority }} access. This can be withdrawn by you at any time by clicking
        <a
          class="text-black hover:underline"
          :href="'https://hivesigner.com/revoke/' + username"
           target="_blank"
        >HERE</a>.
      </p>
      <div class="flash flash-error mt-4" v-if="authority === 'active'">
        Giving active authority enables the authorized account to do fund transfers from your
        account, this should be used with utmost care.
      </div>
      <div class="flash flash-warn mt-4" v-if="accountName && hasRequiredKey === false">
        This transaction requires your <b>active</b> key.
      </div>
    </div>
    <div class="mt-2">
      <router-link
        :to="{
          name: 'login',
          query: { redirect: this.$route.fullPath, authority: 'active' },
        }"
        class="button button-primary inline-block mr-2"
        v-if="!accountName || hasRequiredKey === false"
      >
        Continue
      </router-link>
      <button
        type="submit"
        class="button-success mr-2"
        :disabled="loading"
        v-else
      >
        Authorize
      </button>
      <button class="mb-2" @click.prevent="handleReject">
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
export default class AuthorizeForm extends Vue {
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
    type: Boolean,
    default: false,
  })
  private loading!: string

  @Prop({
    type: Object,
    default: () => {},
  })
  private account!: Account

  private get accountName(): string | undefined {
    return this.account?.name
  }

  private get hasRequiredKey(): boolean {
    return !!(AuthModule.username && AuthModule.keys.active)
  }

  private async handleSubmit(): Promise<void> {
    const { username, authority, account } = this
    this.$emit('loading', true)
    const data = {
      account: account.name,
      memo_key: account.memo_key,
      json_metadata: account.json_metadata,
    }
    data[authority] = JSON.parse(JSON.stringify(account[authority]))
    data[authority].account_auths.push([username, account[authority].weight_threshold])
    data[authority].account_auths.sort((a, b) => (a[0] > b[0] ? 1 : -1))

    this.$emit('submit', data)
  }

  private handleReject(): void {
    this.$emit('reject')
  }
}
</script>

