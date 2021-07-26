<template>
  <form class="import-auth-key" @submit.prevent.stop="submit">
    <icon
      class="logo text-primary mx-auto mb-16"
      name="logo"
    />
    <password-form-control
      v-model="importKey"
      class="mb-6"
      name="importKey"
      :label="$t('import.private_key')"
    />

    <div v-for="error of errors" :key="error" class="errors text-primary pb-5">
      <div>*{{ error }}</div>
    </div>

    <button :disabled="disabled" class="button button-primary w-full block">
      {{ $t('import.import_private_key') }}
    </button>
  </form>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import Icon from '../UI/Icons/Icon.vue'
import { AccountsModule, AuthModule } from '~/store'
import PasswordFormControl from '../UI/Form/PasswordFormControl.vue'

@Component({
  components: { PasswordFormControl, Icon }
})
export default class ImportAuthKey extends Vue {
  private importKey = ''
  private errors = []

  private get disabled (): boolean {
    return !this.importKey
  }

  private get username (): string {
    return AuthModule.username
  }

  private get keys (): Record<string, string> {
    return AuthModule.keys
  }

  private async submit (): Promise<void> {
    this.errors = []
    const valid = await AccountsModule.isValidCredentials({
      username: this.username,
      password: this.importKey
    })

    if (!valid) {
      this.errors.push(this.$t('import.incorrect_private_key') as string)
      return
    }

    const keys = await AccountsModule.getAuthoritiesKeys({
      username: this.username,
      password: this.importKey
    })

    AccountsModule.saveAccountKeys({
      username: this.username,
      keys: {
        ...this.keys,
        ...keys
      }
    })

    this.$popupMessages.show('auths.successfully_imported', 5000)
    this.$emit('import:success')
  }
}
</script>
<style lang="scss" scoped>
.logo {
  width: 80px;
  height: 98px;
}

@screen sm {
  .logo {
    width: 116px;
    height: 143px;
  }
}
</style>
