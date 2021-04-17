<template>
  <div>
    <label for="key" class="flex items-center">
      Hivesigner password
      <span
        class="inline-block tooltip ml-1"
        :aria-label="TOOLTIP_IMPORT_ENCRYPTION_KEY"
      >
        <Icon name="Info" style="width: 14px; height: 22px;" />
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
      class="button-primary w-full mb-2"
    >
      Import account
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import { TOOLTIP_IMPORT_ENCRYPTION_KEY } from '~/consts'
import { PersistentFormsModule } from '~/store'
import Icon from '../UI/Icons/Icon.vue'
@Component({
  components: { Icon }
})
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
