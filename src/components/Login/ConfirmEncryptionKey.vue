<template>
  <form class="import-auth-key" @submit.prevent.stop="submit">
    <icon
      class="logo text-primary mx-auto mb-16"
      name="logo"
    />
    <password-form-control
      v-model="encryptionKey"
      class="mb-6"
      name="importKey"
      :label="$t('import.hs_password')"
      type="password"
      data-e2e="confirm-encryption-key-password"
    />

    <div v-for="error of errors" :key="error" class="errors text-primary pb-5" data-e2e="confirm-encryption-key-error">
      <div>*{{ error }}</div>
    </div>

    <button :disabled="disabled" class="button button-primary w-full block" data-e2e="confirm-encryption-key-login">
      {{ $t('import.login') }}
    </button>
  </form>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import { AccountsModule, AuthModule } from '../../store'
import Icon from '../UI/Icons/Icon.vue'
import PasswordFormControl from '../UI/Form/PasswordFormControl.vue'

@Component({
  components: { PasswordFormControl, Icon }
})
export default class ConfirmEncryptionKey extends Vue {
  @Prop()
  private account!: string

  encryptionKey = ''

  private errors = []

  private get disabled (): boolean {
    return !this.encryptionKey
  }

  private async submit (): Promise<void> {
    this.errors = []
    const valid = await AccountsModule.isValidEncryptionKey({
      username: this.account,
      password: this.encryptionKey
    })

    if (!valid) {
      this.errors.push(this.$t('import.incorrect_encryption_key') as string)
      return
    }

    const keys = await AccountsModule.getEncryptedKeys({ username: this.account, encryptionKey: this.encryptionKey })
    await AuthModule.login({ username: this.account, keys })
    await AccountsModule.setSelectedAccount(this.account)

    this.$popupMessages.show('accounts.successfully_logged_in', 5000)

    this.$emit('loggedin')
  }
}
</script>

<style scoped>

</style>
