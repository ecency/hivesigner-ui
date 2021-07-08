<template>
  <base-form-control
    :value="value"
    :label="label"
    :name="name"
    :type="type"
    :error="error"
    :autocomplete="autocomplete"
    :placeholder="placeholder"
    :tooltip="tooltip"
    @input="onInput"
  >
    <div slot="input-suffix-icon" class="flex items-center justify-center" @click="onToggleType">
      <Icon
        v-if="type === 'password'"
        name="show-password"
        class="cursor-pointer opacity-75 hover:opacity-100"
        style="height: 22px"
      />
      <Icon
        v-if="type === 'text'"
        name="hide-password"
        class="cursor-pointer opacity-75 hover:opacity-100"
        style="height: 22px"
      />
    </div>
  </base-form-control>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'nuxt-property-decorator'
import BaseFormControl from './BaseFormControl.vue'
import Icon from '../Icons/Icon.vue'

@Component({
  components: { Icon, BaseFormControl }
})
export default class PasswordFormControl extends Vue {
  @Prop()
  private value!: any

  @Prop({
    type: String,
    default: ''
  })
  private label!: string

  @Prop({
    type: String,
    default: ''
  })
  private name!: string

  @Prop({
    default: ''
  })
  private error!: string

  @Prop({
    type: String,
    default: ''
  })
  private autocomplete!: string

  @Prop({
    type: String,
    default: ''
  })
  private placeholder!: string

  @Prop({
    type: String,
    default: ''
  })
  private tooltip!: string

  private type = 'password'

  @Emit('input')
  private onInput(value: string): string {
    return value
  }

  private onToggleType(): void {
    if (this.type === 'password') {
      this.type = 'text'
    } else {
      this.type = 'password'
    }
  }
}
</script>

<style scoped>

</style>
