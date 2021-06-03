<template>
  <base-form-control-container :name="name" :label="label" :tooltip="tooltip" :error="error">
    <custom-select
      :value="value"
      :options="options"
      @select="onInput"
      @blur="onBlur"
    />
  </base-form-control-container>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from 'nuxt-property-decorator'
import Icon from '../Icons/Icon.vue'
import CustomSelect from './Select.vue'
import BaseFormControlContainer from './BaseFormControlContainer.vue'

@Component({
  components: { BaseFormControlContainer, CustomSelect, Icon }
})
export default class BaseFormControl extends Vue {
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
    type: String,
    default: 'text',
    validator: value => ['text', 'password', 'select'].includes(value)
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
    type: Array,
    default: () => []
  })
  private options!: any[]

  @Emit('input')
  private onInput (value: any): any {
    return value
  }

  @Emit('blur')
  private onBlur (): void {
  }
}
</script>
