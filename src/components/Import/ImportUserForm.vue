<template>
  <div>
    <label for="username">Username</label>
    <div v-if="dirty.username && !!errors.username" class="error mb-2">
      {{ errors.username }}
    </div>
    <input
      key="username"
      v-model.trim="username"
      id="username"
      type="text"
      class="form-control input-lg input-block mb-2"
      autocorrect="off"
      autocapitalize="none"
      autocomplete="username"
      @blur="handleBlur('username')"
    />
    <label for="password"> Master password or {{ authority || 'private' }} key </label>
    <div v-if="dirty.password && !!errors.password" class="error mb-2">
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
      class="form-control input-lg input-block mb-2"
      @blur="handleBlur('password')"
    />
    <label class="mb-2" :class="{ 'mb-4': !error }">
      <input key="storeAccount" v-model="storeAccount" type="checkbox"/> Encrypt your keys
    </label>
    <div v-if="!!error" class="error mb-4">{{ error }}</div>
    <button
      :disabled="nextDisabled || loading"
      class="btn btn-large btn-blue input-block mb-2"
      @click.prevent="submitNext"
    >
      {{ nextText }}
    </button>
    <router-link
      v-if="hasAccounts"
      :to="{ name: 'login', query: $route.query }"
      class="select-account btn btn-large input-block text-center mb-2"
    >
      Select account
    </router-link>
    <button
      class="sign-up btn btn-large input-block text-center mb-2"
      :disabled="loading"
      @click="signUp()"
    >
      Signup
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

  private get nextText(): string {
    return this.storeAccount ? 'Continue' : 'Import account'
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
      this.$emit('error', ERROR_INVALID_CREDENTIALS)
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
