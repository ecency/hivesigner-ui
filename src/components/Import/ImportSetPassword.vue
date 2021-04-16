<template>
  <div>
    <label for="key">
      Hivesigner password
      <span
        class="tooltipped tooltipped-n tooltipped-multiline"
        :aria-label="TOOLTIP_IMPORT_ENCRYPTION_KEY"
      >
        <span class="iconfont icon-info"></span>
      </span>
    </label>
    <div v-if="dirty.key && !!errors.key" class="text-primary mb-2">
      {{ errors.key }}
    </div>
    <input
      key="key"
      id="key"
      v-model.trim="importKey"
      type="password"
      autocorrect="off"
      autocapitalize="none"
      autocomplete="new-password"
      class="input-lg block mb-2"
      @blur="handleBlur('key')"
    />
    <label for="key-confirmation">Confirm password</label>
    <div v-if="dirty.keyConfirmation && !!errors.keyConfirmation" class="text-primary mb-2">
      {{ errors.keyConfirmation }}
    </div>
    <input
      key="keyConfirmation"
      id="key-confirmation"
      v-model.trim="keyConfirmation"
      type="password"
      autocorrect="off"
      autocapitalize="none"
      autocomplete="new-password"
      class="input-lg block mb-2"
      @blur="handleBlur('keyConfirmation')"
    />
    <legend class="mb-6 block text-gray-600">
      The hivesigner password will be required to unlock your account for usage.
      {{ TOOLTIP_IMPORT_ENCRYPTION_KEY }}
    </legend>
    <button
      :disabled="submitDisabled || loading"
      type="submit"
      class="button-primary mb-2"
    >
      Import account
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import { TOOLTIP_IMPORT_ENCRYPTION_KEY } from '~/consts'
import { PersistentFormsModule } from '~/store'

@Component
export default class ImportSetPassword extends Vue {
  @Prop({
    type: Object,
    default: () => ({}),
  })
  private errors!: Record<string, string>

  @Prop({
    type: Boolean,
    default: false,
  })
  private loading!: boolean

  private TOOLTIP_IMPORT_ENCRYPTION_KEY = TOOLTIP_IMPORT_ENCRYPTION_KEY
  private dirty = {
    key: false,
    keyConfirmation: false,
  }

  private get importKey(): string {
    return PersistentFormsModule.import.key
  }

  private set importKey(value: string) {
    return PersistentFormsModule.saveImportKey(value)
  }

  private get keyConfirmation(): string {
    return PersistentFormsModule.import.keyConfirmation
  }

  private set keyConfirmation(value: string) {
    return PersistentFormsModule.saveImportKeyConfirmation(value)
  }

  private get submitDisabled(): boolean {
    return !!this.errors.key || !!this.errors.keyConfirmation
  }

  public reset(): void {
    this.dirty = {
      key: false,
      keyConfirmation: false,
    }
  }

  private handleBlur(fieldName: string): void {
    this.dirty[fieldName] = true
  }
}
</script>
