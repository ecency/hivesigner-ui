<template>
<div class="account-details h-full flex flex-col justify-center">
  <account-item :user="account" />
  <div class="accounts-details-menu flex flex-col text-center text-black-400 mt-12">
    <router-link to="/auths" class="p-4 hover:bg-gray-100">
      {{ $t('accounts.auths') }}
    </router-link>
    <router-link to="/sign/transactions" class="p-4 hover:bg-gray-100">
      {{ $t('accounts.sign_transactions') }}
    </router-link>
    <a
      role="button"
      class="p-4 hover:bg-gray-100"
      @click="confirmModalRef.show()"
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
</div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue, Ref } from 'nuxt-property-decorator'
import AccountItem from './AccountItem.vue'
import { AccountsModule, AuthModule } from '~/store'
import ConfirmModal from '../UI/ConfirmModal.vue'

@Component({
  components: { ConfirmModal, AccountItem },
})
export default class AccountDetails extends Vue {
  @Prop({
    type: String,
    required: true,
  })
  private account!: string

  @Ref('confirm-modal')
  private confirmModalRef!: ConfirmModal

  private async mounted(): Promise<void> {
    try {
      await AuthModule.login({
        username: this.account,
        keys: await AccountsModule.getEncryptedKeys({ username: this.account })
      })
      await AccountsModule.setSelectedAccount(this.account)
    } catch (_) {
    }
  }

  @Emit('removed')
  private removeAccount(): void {
    AccountsModule.removeAccount(this.account)
  }
}
</script>

<style scoped>

</style>
