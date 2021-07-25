<template>
  <dropdown class="account-selection hover:text-primary" with-chevron>
    <template slot="trigger">
      <avatar :username="currentAccount" :size="36" />
    </template>
    <div class="overflow-y-auto" style="max-height: 300px">
      <a
        v-for="account of accountsList"
        :key="account"
        :title="isDecryptedAccount(account) ? $t('common.decrypted') : $t('common.encrypted')"
        role="button"
        class="flex items-center my-1.5"
        :class="{
          'text-black': currentAccount === account,
          'text-gray hover:text-primary': currentAccount !== account
        }"
      >
        <div class="relative">
          <avatar :username="account" :size="42" class="mr-3" />
          <div class="mx-2 absolute bottom-0 right-0 bg-white p-1.5 rounded-full">
            <icon
              :name="isDecryptedAccount(account) ? 'unlock' : 'lock'"
              style="width: 12px; height: 12px"
            />
          </div>
        </div>
        <div class="flex items-center">
          {{ account }}
          <span
            v-if="account === currentAccount"
            class="text-gray text-sm"
          >({{ $t('common.logged_in') }})</span>
        </div>
      </a>
    </div>
  </dropdown>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import Dropdown from './UI/Dropdown.vue'
import Avatar from './Avatar.vue'
import Icon from './UI/Icons/Icon.vue'
import { AccountsModule, AuthModule } from '~/store'

@Component({
  components: { Icon, Avatar, Dropdown }
})
export default class AccountSelection extends Vue {
  private get currentAccount (): string {
    return AuthModule.username
  }

  private get accountsList (): string[] {
    return AccountsModule.accountsUsernamesList
  }

  private isDecryptedAccount (account: string): boolean {
    return AccountsModule.isDecrypted(account)
  }
}
</script>

<style scoped>

</style>
