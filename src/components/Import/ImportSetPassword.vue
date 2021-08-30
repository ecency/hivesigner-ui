<template>
  <div>
    <form-control
      v-if="hasEncryptedAccount"
      v-model="useSameEncryptionKey"
      :label="hasMultipleEncryptedAccounts ? $t('import.same_encryption_key_account') : $t('import.same_encryption_key')"
      class="mb-7"
      autocomplete="current-password"
      name="storeAccount"
      type="checkbox"
      data-e2e="import-set-password-account"
    >
      <template slot="label-suffix">
        <dropdown
          v-if="hasMultipleEncryptedAccounts"
          ref="dropdown"
          with-chevron
          trigger-class="text-black-light hover:text-primary ml-1 font-bold"
        >
          <template slot="trigger">
            <span class="text-lg">{{ currentSelectedAccount }}</span>
          </template>
          <a
            v-for="account of accountsList"
            :key="account"
            role="button"
            class="cursor-pointer py-1 hover:text-primary"
            @click="onAccountSelect(account)"
          >
            {{ account }}
          </a>
        </dropdown>
      </template>
    </form-control>

    <password-form-control
      v-if="!useSameEncryptionKey"
      v-model="importKey"
      name="key"
      :label="$t('import.hs_password')"
      :error="dirty.key && errors.key"
      :tooltip="tooltipText"
      type="password"
      autocomplete="new-password"
      data-e2e="import-set-password-field"
      @blur="handleBlur('key')"
    />

    <form-control
      v-model="keyConfirmation"
      name="keyConfirmation"
      :label="$t('import.confirm_password')"
      :error="dirty.keyConfirmation && errors.keyConfirmation"
      type="password"
      autocomplete="new-password"
      data-e2e="import-set-password-new-field"
      @blur="handleBlur('keyConfirmation')"
    />
    <button
      :disabled="submitDisabled || loading"
      type="submit"
      class="button-primary w-full mb-2 mt-5"
      data-e2e="import-set-password-continue"
    >
      {{ $t('common.continue') }}
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'nuxt-property-decorator'
import Icon from '../UI/Icons/Icon.vue'
import FormControl from '../UI/Form/FormControl.vue'
import Dropdown from '../UI/Dropdown.vue'
import PasswordFormControl from '../UI/Form/PasswordFormControl.vue'
import { TOOLTIP_IMPORT_ENCRYPTION_KEY } from '~/consts'
import { AccountsModule, PersistentFormsModule } from '~/store'

@Component({
  components: { PasswordFormControl, Dropdown, FormControl, Icon }
})
export default class ImportSetPassword extends Vue {
  @Prop({
    type: Object,
    default: () => ({})
  })
  private errors!: Record<string, string>

  @Prop({
    type: Boolean,
    default: false
  })
  private loading!: boolean

  @Ref('dropdown')
  private dropdownRef!: Dropdown

  private TOOLTIP_IMPORT_ENCRYPTION_KEY = TOOLTIP_IMPORT_ENCRYPTION_KEY
  private dirty = {
    key: false,
    keyConfirmation: false
  }

  public get hasEncryptedAccount (): boolean {
    return AccountsModule.hasEncryptedAccount
  }

  public get hasMultipleEncryptedAccounts (): boolean {
    return AccountsModule.hasMultipleEncryptedAccounts
  }

  public get accountsList (): string[] {
    return AccountsModule.encryptedAccountsList
  }

  private get importKey (): string {
    return PersistentFormsModule.import.key
  }

  private set importKey (value: string) {
    return PersistentFormsModule.saveImportKey(value)
  }

  private get keyConfirmation (): string {
    return PersistentFormsModule.import.keyConfirmation
  }

  private set keyConfirmation (value: string) {
    return PersistentFormsModule.saveImportKeyConfirmation(value)
  }

  private get useSameEncryptionKey (): boolean {
    return PersistentFormsModule.import.useSameEncryptionKey
  }

  private set useSameEncryptionKey (value: boolean) {
    return PersistentFormsModule.saveUseSameEncryptionKey(value)
  }

  private get currentSelectedAccount (): string {
    return PersistentFormsModule.import.currentSelectedAccount
  }

  private get submitDisabled (): boolean {
    return !!this.errors.key || !!this.errors.keyConfirmation
  }

  private get tooltipText (): string {
    return `${this.$t(TOOLTIP_IMPORT_ENCRYPTION_KEY)}\n${this.$t('import.require_hs_password')}`
  }

  private mounted (): void {
    PersistentFormsModule.saveCurrentSelectedAccount(this.accountsList[0])
  }

  public reset (): void {
    this.dirty = {
      key: false,
      keyConfirmation: false
    }
  }

  private handleBlur (fieldName: string): void {
    this.dirty[fieldName] = true
  }

  private onAccountSelect (account: string) {
    this.dropdownRef.hide()
    PersistentFormsModule.saveCurrentSelectedAccount(account)
  }
}
</script>
