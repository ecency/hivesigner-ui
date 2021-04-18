<template>
  <div>
    <label for="username">Username</label>
    <div v-if="dirty.username && !!errors.username" class="text-primary mb-2">
      {{ errors.username }}
    </div>
    <input
      key="username"
      v-model.trim="username"
      id="username"
      type="text"
      class="input-lg block mb-2"
      autocorrect="off"
      autocapitalize="none"
      autocomplete="username"
      @blur="handleBlur('username')"
    />
    <label for="password">
      {{ $t('import.master_password', { authority: authority || 'private' }) }}
    </label>
    <div v-if="dirty.password && !!errors.password" class="text-primary mb-2">
      {{ errors.password }}
    </div>
    <input
      key="password"
      v-model.trim="password"
      id="password"
      type="password"
      autocorrect="off"
      autocapitalize="none"
      autocomplete="current-password"
      class="input-lg block mb-2"
      @blur="handleBlur('password')"
    />
    <label :class="{ 'mb-6': !error, 'mb-2': error }">
      <input key="storeAccount" v-model="storeAccount" type="checkbox"/>
      {{ $t('import.encrypt_keys') }}
    </label>
    <div v-if="!!error" class="error mb-4">{{ error }}</div>
    <button
      :disabled="nextDisabled || loading"
      class="button-primary w-full block mb-2"
      @click.prevent="submitNext"
    >
      {{ nextText }}
    </button>
    <router-link
      v-if="hasAccounts"
      :to="{ name: 'login', query: $route.query }"
      class="button block text-center mb-2"
    >
      {{ $t('import.select_account') }}
    </router-link>
    <button
      :disabled="loading"
      class="block text-center w-full mb-2"
      @click="signUp()"
    >
      {{ $t('import.signup') }}
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import { addToKeychain, credentialsValid, getKeys, hasAccounts } from '~/utils'
import { PersistentFormsModule } from '~/store'
import { ERROR_INVALID_CREDENTIALS } from '~/consts'
import { Authority } from '~/enums'

@Component
export default class ImportUserForm extends Vue {
  @Prop({
    type: Object,
    default: () => ({}),
  })
  private errors!: Record<string, string>

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

  @Prop({
    type: Boolean,
    default: false,
  })
  private loading!: boolean

  private dirty = {
    username: false,
    password: false,
  }
  private storeAccount = true

  private get hasAccounts(): boolean {
    return hasAccounts()
  }

  private get username(): string {
    return PersistentFormsModule.import.username
  }

  private set username(value: string) {
    return PersistentFormsModule.saveImportUsername(value)
  }

  private get password(): string {
    return PersistentFormsModule.import.password
  }

  private set password(value: string) {
    return PersistentFormsModule.saveImportPassword(value)
  }

  private get nextText() {
    return this.storeAccount ? this.$t('common.continue') : this.$t('import.import_account')
  }

  private get nextDisabled(): boolean {
    return !!this.errors.username || !!this.errors.password
  }

  public reset(): void {
    this.dirty = {
      username: false,
      password: false,
    }
  }

  private signUp(): void {
    window.open('https://signup.hive.io', '_blank')
  }

  private async submitNext(): Promise<void> {
    this.$emit('loading', true)
    const invalidCredentials = !(await credentialsValid(this.username, this.password))
    this.$emit('loading', false)
    if (invalidCredentials) {
      this.$emit('error', this.$t(ERROR_INVALID_CREDENTIALS))
      return
    }
    this.$emit('error', '')
    if (this.storeAccount) {
      this.$emit('next-step')
    } else {
      const keys = await getKeys(this.username, this.password)
      const k = Buffer.from(JSON.stringify(keys))
      addToKeychain(this.username as string, `${k.toString('hex')}decrypted`)
      this.$emit('submit')
    }
  }

  private handleBlur(name: string): void {
    this.dirty[name] = true
  }
}
</script>

<style scoped>

</style>
