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
    @input="onInput"
    @blur="onBlur"
  />
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from 'nuxt-property-decorator'
import CheckboxFormControl from './CheckboxFormControl.vue'
import BaseFormControl from './BaseFormControl.vue'
import SelectFormControl from './SelectFormControl.vue'

@Component({
  components: {
    CheckboxFormControl,
    BaseFormControl,
    SelectFormControl,
  }
})
export default class FormControl extends Vue {
  @Prop()
  private value!: any

  @Prop({
    type: String,
    default: '',
  })
  private label!: string

  @Prop({
    type: String,
    default: '',
  })
  private name!: string

  @Prop({
    type: String,
    default: 'text',
    validator: value => ['text', 'password', 'select', 'checkbox'].includes(value),
  })
  private type!: string

  @Prop({
    default: '',
  })
  private error!: string

  @Prop({
    type: String,
    default: '',
  })
  private autocomplete!: string

  @Prop({
    type: String,
    default: '',
  })
  private tooltip!: string

  @Prop({
    type: Array,
    default: () => [],
  })
  private options!: any[]

  private get controlComponent(): string {
    switch (this.type) {
      case 'checkbox':
        return 'checkbox-form-control'
      case 'select':
        return 'select-form-control'
      default:
        return 'base-form-control'
    }
  }

  @Emit('input')
  private onInput(value: any): string {
    return value
  }

  @Emit('blur')
  private onBlur(): void {
  }
}
</script>