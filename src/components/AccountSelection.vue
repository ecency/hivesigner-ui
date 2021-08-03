<template>
  <div>
    <dropdown ref="dropdown" class="account-selection hover:text-primary" with-chevron>
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
          @click="() => selectAccount(account)"
        >
          <div class="relative">
            <avatar :username="account" :size="42" class="mr-3" />
            <div class="mx-2 absolute bottom-0 right-0 bg-white p-1.5 rounded-full">
              <icon
                v-if="currentAccount !== account"
                :name="isDecryptedAccount(account) ? 'unlock' : 'lock'"
                style="width: 12px; height: 12px"
              />
              <icon
                v-else
                name="check"
                style="width: 10px; height: 10px"
              />
            </div>
          </div>
          <div class="flex items-center">
            {{ account }}
          </div>
        </a>
      </div>
    </dropdown>

    <modal ref="encryption-modal" mobile-full animation="slide-right">
      <confirm-encryption-key :account="encryptionKeyAccount" @loggedin="onLoggedIn" />
    </modal>
  </div>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'nuxt-property-decorator'
import Bugsnag from '@bugsnag/js'
import Dropdown from './UI/Dropdown.vue'
import Avatar from './Avatar.vue'
import Icon from './UI/Icons/Icon.vue'
import Modal from './UI/Modal.vue'
import ConfirmEncryptionKey from './Login/ConfirmEncryptionKey.vue'
import { AccountsModule, AuthModule } from '~/store'

@Component({
  components: { ConfirmEncryptionKey, Modal, Icon, Avatar, Dropdown }
})
export default class AccountSelection extends Vue {
  @Ref('encryption-modal')
  private encryptionConfirmationModal!: Modal

  @Ref('dropdown')
  private dropdown: Dropdown

  private encryptionKeyAccount: string | null = null

  private get currentAccount (): string {
    return AuthModule.username
  }

  private get accountsList (): string[] {
    return AccountsModule.accountsUsernamesList
  }

  private isDecryptedAccount (account: string): boolean {
    return AccountsModule.isDecrypted(account)
  }

  private async selectAccount (account: string): Promise<void> {
    if (account === this.currentAccount) {
      return
    }

    const isDecrypted = AccountsModule.isDecrypted(account)
    if (isDecrypted) {
      try {
        await AuthModule.login({
          username: account,
          keys: await AccountsModule.getEncryptedKeys({ username: account })
        })
        await AccountsModule.setSelectedAccount(account)
      } catch (err) {
        Bugsnag.notify(err)
      }
    } else {
      this.dropdown.hide()
      this.encryptionKeyAccount = account
      setTimeout(() => (this.encryptionConfirmationModal.show()), 300)
    }
  }

  private onLoggedIn (): void {
    this.encryptionKeyAccount = null
    this.encryptionConfirmationModal.hide()
  }
}
</script>

<style scoped>

</style>
