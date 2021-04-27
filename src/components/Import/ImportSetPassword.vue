<template>
  <div>
    <form-control
      v-model="importKey"
      name="key"
      :label="$t('import.hs_password')"
      :error="dirty.key && errors.key"
      :tooltip="$t(TOOLTIP_IMPORT_ENCRYPTION_KEY)"
      type="password"
      autocomplete="new-password"
      @blur="handleBlur('key')"
    />

    <form-control
      v-model="keyConfirmation"
      name="keyConfirmation"
      :label="$t('import.confirm_password')"
      :error="dirty.keyConfirmation && errors.keyConfirmation"
      type="password"
      autocomplete="new-password"
      @blur="handleBlur('keyConfirmation')"
    />

    <legend class="mb-6 block text-gray-600 text-lg">
      {{ $t('import.require_hs_password') }}
      {{ $t(TOOLTIP_IMPORT_ENCRYPTION_KEY) }}
    </legend>
    <button
      :disabled="submitDisabled || loading"
      type="submit"
      class="button-primary w-full mb-2"
    >
      {{ $t('common.continue') }}
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import { TOOLTIP_IMPORT_ENCRYPTION_KEY } from '~/consts'
import { PersistentFormsModule } from '~/store'
import Icon from '../UI/Icons/Icon.vue'
import FormControl from '../UI/Form/FormControl.vue'
@Component({
  components: { FormControl, Icon }
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
