<template>
  <div>
    <form-control
      v-model="username"
      :error="dirty.username ? errors.username : ''"
      :placeholder="$t('import.username_placeholder')"
      :label="$t('import.username')"
      name="username"
      @blur="handleBlur('username')"
    />

    <password-form-control
      v-model="password"
      :error="dirty.password ? errors.password : ''"
      :placeholder="$t('import.password_placeholder')"
      :label="$t('import.master_password', { authority: authority || 'private' })"
      autocomplete="current-password"
      name="password"
      type="password"
      @blur="handleBlur('password')"
    />

    <form-control
      v-model="storeAccount"
      :label="$t('import.encrypt_keys')"
      class="mb-7"
      autocomplete="current-password"
      name="storeAccount"
      type="checkbox"
    />

    <div v-if="!!error" class="text-primary text-lg mb-6">
      {{ error }}
    </div>
    <button
      :disabled="nextDisabled || loading"
      class="button-primary w-full block mb-2"
      @click.prevent="submitNext"
    >
      {{ nextText }}
    </button>
    <div class="text-gray text-lg pt-4">
      {{ $t('import.dont_have_an_account') }}
      <a
        href="https://signup.hive.io"
        target="_blank"
        rel="noopener"
        class="text-black-500 hover:underline sign-up"
      >{{ $t('import.sign_up_here') }}</a>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import FormControl from '../UI/Form/FormControl.vue'
import PasswordFormControl from '../UI/Form/PasswordFormControl.vue'
import { AccountsModule, PersistentFormsModule } from '~/store'
import { ERROR_INVALID_CREDENTIALS } from '~/consts'
import { Authority } from '~/enums'

@Component({
  components: { PasswordFormControl, FormControl }
})
export default class ImportUserForm extends Vue {
  @Prop({
    type: Object,
    default: () => ({})
  })
  private errors!: Record<string, string>

  @Prop({
    type: String,
    default: ''
  })
  private error!: string

  @Prop({
    type: String,
    default: ''
  })
  private authority!: Authority

  @Prop({
    type: Boolean,
    default: false
  })
  private loading!: boolean

  private dirty = {
    username: false,
    password: false
  }

  private storeAccount = true

  private get username (): string {
    return PersistentFormsModule.import.username
  }

  private set username (value: string) {
    return PersistentFormsModule.saveImportUsername(value)
  }

  private get password (): string {
    return PersistentFormsModule.import.password
  }

  private set password (value: string) {
    return PersistentFormsModule.saveImportPassword(value)
  }

  private get nextText () {
    return this.storeAccount ? this.$t('common.continue') : this.$t('import.login')
  }

  private get nextDisabled (): boolean {
    return !!this.errors.username || !!this.errors.password
  }

  public reset (): void {
    this.dirty = {
      username: false,
      password: false
    }
  }

  private async submitNext (): Promise<void> {
    this.$emit('loading', true)
    const invalidCredentials = !(await AccountsModule.isValidCredentials({
      username: this.username,
      password: this.password
    }))
    this.$emit('loading', false)
    if (invalidCredentials) {
      this.$emit('error', this.$t(ERROR_INVALID_CREDENTIALS))
      return
    }
    this.$emit('error', '')
    if (this.storeAccount) {
      this.$emit('next-step')
    } else {
      const keys = await AccountsModule.getAuthoritiesKeys({
        username: this.username,
        password: this.password
      })
      const k = Buffer.from(JSON.stringify(keys))
      AccountsModule.saveAccount({
        username: this.username,
        keys: {
          password: `${k.toString('hex')}decrypted`,
          ...keys
        }
      })
      this.$emit('submit')
    }
  }

  private handleBlur (name: string): void {
    this.dirty[name] = true
  }
}
</script>

<style scoped>

</style>
