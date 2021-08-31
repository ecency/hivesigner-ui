<template>
  <div class="auths-actions flex justify-end sm:justify-start items-center">
    <a
      v-if="value.Key.type === 'account'"
      role="button"
      :class="classes"
      :data-e2e="value.Type + '-revoke'"
      @click="() => $router.push(revokeLink)"
    >{{ $t('revoke.revoke') }}</a>
    <a
      v-if="value.Key.type !== 'account'"
      role="button"
      :data-e2e="value.Type + '-copy'"
      :class="classes"
      @click="copy"
    >{{ $t('auths.copy') }}</a>
    <a
      v-if="value.Key.type !== 'account'"
      role="button"
      :data-e2e="value.Type + '-reveal-or-import'"
      :class="classes"
      @click="revealOrImport"
    >{{ revealOrImportLabel }}</a>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import { Account } from '@hiveio/dhive'
import { AccountsModule } from '~/store'

@Component
export default class AuthsActions extends Vue {
  @Prop()
  private account: Account

  @Prop()
  private value: any

  @Prop({
    type: Boolean,
    default: false
  })
  private isPrivateKey!: boolean

  @Prop({
    type: String,
    default: 'cursor-pointer p-4 block w-full'
  })
  private classes!: string

  private get revokeLink (): string {
    const key = this.value.Key.public
    const authority = this.value.Type
    return authority !== 'posting' ? `/revoke/${key}?authority=${authority}` : `/revoke/${key}`
  }

  private get hasPrivateKey (): boolean {
    return AccountsModule.hasAuthorityPrivateKey(this.account.name, this.value.Type)
  }

  private get revealOrImportLabel (): any {
    if (!this.hasPrivateKey) {
      return this.$t('auths.import_private_key')
    }
    return this.isPrivateKey ? this.$t('auths.reveal_pub_key') : this.$t('auths.reveal_private_key')
  }

  private async copy (): Promise<void> {
    const clipboard = this.isPrivateKey ? this.value.Key.private : this.value.Key.public
    await navigator.clipboard.writeText(clipboard)
    this.$popupMessages.show('auths.successfully_copied', 5000)
  }

  private revealOrImport (): void {
    if (this.hasPrivateKey) {
      this.$emit('private:show', !this.isPrivateKey)
    } else {
      this.$emit('import:show')
    }
  }
}
</script>

<style scoped>

</style>
