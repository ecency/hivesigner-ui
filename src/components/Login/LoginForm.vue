<template>
  <form @submit.prevent="submitForm" method="post" class="text-left">
    <form-control
      v-model="username"
      name="username"
      :label="$t('login.switch_an_account')"
      :error="dirty.username && errors.username"
      :options="accountsList"
      type="select"
      @blur="handleBlur('username')"
    />

    <form-control
      v-if="!isSelectedAccountDecrypted"
      v-model="loginKey"
      name="key"
      :label="$t('import.hs_password')"
      :error="dirty.key && errors.key"
      :tooltip="tooltipLoginEncryptionKey"
      autocomplete="password"
      type="password"
      @blur="handleBlur('key')"
    />

    <div v-if="!!error" class="text-primary mb-6">{{ error }}</div>
    <button
      :disabled="submitDisabled || loading"
      type="submit"
      class="button-primary w-full block mb-2"
    >
      {{ $t('common.continue') }}
    </button>
  </form>
</template>

<script lang="ts">
import triplesec from 'triplesec'
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import { ERROR_INVALID_ENCRYPTION_KEY, TOOLTIP_LOGIN_ENCRYPTION_KEY } from '~/consts'
import { AccountsModule, PersistentFormsModule } from '~/store'
import { signComplete } from '~/utils'
import { Authority } from '~/enums'
import Icon from '../UI/Icons/Icon.vue'
import FormControl from '../UI/Form/FormControl.vue'

@Component({
  components: { FormControl, Icon }
})
export default class LoginForm extends Vue {
  @Prop({
    type: Boolean,
    default: false,
  })
  private loading!: boolean

  @Prop({
    type: String,
    default: '',
  })
  private error!: string

  @Prop({
    type: String,
    default: '',
  })
  private authority!: Authority

  private dirty = {
    username: false,
    key: false,
  }

  private get isSelectedAccountDecrypted(): boolean {
    return AccountsModule.isSelectedAccountDecrypted
  }

  private get accountsList(): string[] {
    return AccountsModule.accountsUsernamesList
  }

  private get errors(): Record<string, any> {
    const current: Record<string, any> = {}
    const { username, key } = this
    if (!username) {
      current.username = this.$t('login.username_required')
    }
    if (!key && !this.dirty.key) {
      current.key = this.$t('login.hs_password_required')
    }
    return current
  }

  private get username(): string {
    return AccountsModule.selectedAccount
  }

  private set username(value: string) {
    AccountsModule.setSelectedAccount(value)
  }

  private get loginKey(): string {
    return PersistentFormsModule.login.key
  }

  private set loginKey(value: string) {
    return PersistentFormsModule.saveLoginKey(value)
  }

  private get tooltipLoginEncryptionKey() {
    return this.$t(TOOLTIP_LOGIN_ENCRYPTION_KEY)
  }

  private get submitDisabled(): boolean {
    return !!this.errors.username || (!!this.errors.key && !!this.dirty.key)
  }

  private get redirect(): string {
    return this.$route.query.redirect as string
  }

  public resetForm(): void {
    this.dirty = {
      username: false,
      key: false,
    }
    this.loginKey = ''
  }

  private submitForm(): void {
    const encryptedKeys = AccountsModule.selectedAccountEncryptedKey
    this.$emit('loading', true)
    if (this.isSelectedAccountDecrypted) {
      this.$emit('loading', false)
      let bb = encryptedKeys
      try {
        bb = Buffer.from(encryptedKeys, 'hex').toString()
      } catch (_) {
        this.handleReject()
      }
      this.$emit('submit', bb)
    } else {
      // @ts-ignore
      triplesec.decrypt({
          data: new triplesec.Buffer(encryptedKeys, 'hex'),
          key: new triplesec.Buffer(this.loginKey),
        }, (decryptError, buff) => {
          if (decryptError) {
            this.$emit('loading', false)
            this.$emit('error', this.$t(ERROR_INVALID_ENCRYPTION_KEY))
            console.log('err', decryptError)
            return
          }
          this.$emit('submit', buff)
        })
    }
  }

  private handleBlur(name: string): void {
    this.dirty[name] = true
  }

  private handleReject(): void {
    const requestId = this.$route.query.requestId as string
    if (requestId) {
      signComplete(requestId, 'Request canceled', null)
    }
    this.$emit('failed', false)
    this.$emit('loading', false)
    this.$emit('signature', '')
  }
}
</script>

<style scoped>

</style>
