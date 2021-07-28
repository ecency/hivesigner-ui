<template>
  <div class="account-details h-full flex flex-col justify-center">
    <account-item :user="account" />
    <div class="accounts-details-menu flex flex-col text-center text-black-400 mt-12">
      <router-link v-if="isLoggedIn" to="/auths" class="p-4 hover:bg-gray-100">
        {{ $t('accounts.auths') }}
      </router-link>
      <router-link v-if="isLoggedIn" to="/signs" class="p-4 hover:bg-gray-100">
        {{ $t('accounts.sign_transactions') }}
      </router-link>
      <a
        v-if="!isLoggedIn"
        role="button"
        class="p-4 hover:bg-gray-100"
        @click="showLoginModal"
      >
        {{ $t('import.login') }}
      </a>
      <a
        role="button"
        class="p-4 hover:bg-gray-100"
        @click="showConfirmModal"
      >
        {{ $t('accounts.delete') }}
      </a>
    </div>
    <confirm-modal
      ref="confirm-modal"
      message="accounts.delete_account_confirm"
      positive-label="accounts.delete_account"
      @positive="removeAccount"
    />

    <modal ref="encryption-modal" mobile-full animation="slide-right">
      <confirm-encryption-key :account="account" @loggedin="onLoggedIn" />
    </modal>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue, Ref } from 'nuxt-property-decorator'
import ConfirmModal from '../UI/ConfirmModal.vue'
import Modal from '../UI/Modal.vue'
import ConfirmEncryptionKey from '../Login/ConfirmEncryptionKey.vue'
import AccountItem from './AccountItem.vue'
import { AccountsModule, AuthModule } from '~/store'

@Component({
  components: { Modal, ConfirmModal, AccountItem, ConfirmEncryptionKey }
})
export default class AccountDetails extends Vue {
  @Prop({
    type: String,
    required: true
  })
  private account!: string

  @Ref('encryption-modal')
  private encryptionConfirmationModal!: Modal

  private isLoggedIn = false

  @Ref('confirm-modal')
  private confirmModalRef!: ConfirmModal

  private async mounted (): Promise<void> {
    if (this.account === AuthModule.account?.name) {
      this.isLoggedIn = true
    }

    if (!this.isLoggedIn) {
      const isDecrypted = AccountsModule.isDecrypted(this.account)
      if (isDecrypted) {
        try {
          await AuthModule.login({
            username: this.account,
            keys: await AccountsModule.getEncryptedKeys({ username: this.account })
          })
          await AccountsModule.setSelectedAccount(this.account)
          this.isLoggedIn = true
        } catch (_) {
        }
      } else {
        setTimeout(() => (this.showLoginModal()), 300)
      }
    }
  }

  @Emit('removed')
  private removeAccount (): void {
    AccountsModule.removeAccount(this.account)
  }

  private onLoggedIn (): void {
    this.isLoggedIn = true
    this.encryptionConfirmationModal.hide()
  }

  private showLoginModal (): void {
    this.encryptionConfirmationModal.show()
  }

  private showConfirmModal (): void {
    this.confirmModalRef.show()
  }
}
</script>

<style scoped>

</style>
