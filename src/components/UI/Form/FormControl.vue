<template>
  <component
    :is="controlComponent"
    :value="value"
    :label="label"
    :name="name"
    :type="type"
    :error="error"
    :autocomplete="autocomplete"
    :tooltip="tooltip"
    :options="options"
    :placeholder="placeholder"
    @input="onInput"
    @blur="onBlur"
  >
    <template #input-prefix-icon>
      <slot name="input-prefix-icon" />
    </template>
    <template #label-suffix>
      <slot name="label-suffix" />
    </template>
    <slot />
    <template #option="{option}">
      <slot name="option" :option="option" />
    </template>
  </component>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from 'nuxt-property-decorator'
import CheckboxFormControl from './CheckboxFormControl.vue'
import BaseFormControl from './BaseFormControl.vue'
import SelectFormControl from './SelectFormControl.vue'
import TextareaFormControl from './TextareaFormControl.vue'

@Component({
  components: {
    CheckboxFormControl,
    BaseFormControl,
    SelectFormControl,
    TextareaFormControl
  }
})
export default class FormControl extends Vue {
  @Prop()
  private value!: string | string[]

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
    type: String,
    default: 'text',
    validator: value =>
      ['text', 'password', 'select', 'checkbox', 'number', 'textarea'].includes(value)
  })
  private type!: string

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
  private tooltip!: string

  @Prop({
    type: String,
    default: ''
  })
  private placeholder!: string

  @Prop({
    type: Array,
    default: () => []
  })
  private options!: any[]

  private get controlComponent (): string {
    switch (this.type) {
      case 'checkbox':
        return 'checkbox-form-control'
      case 'select':
        return 'select-form-control'
      case 'textarea':
        return 'textarea-form-control'
      default:
        return 'base-form-control'
    }
  }

  @Emit('input')
  private onInput (value: any): string {
    return value
  }

  @Emit('blur')
  private onBlur (): void {
  }
}
</script>
