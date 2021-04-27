<template>
  <base-form-control-container :name="name" :label="label" :tooltip="tooltip" :error="error">
    <input
      :key="name"
      :value="value"
      :id="name"
      :name="name"
      :type="type"
      class="input-lg block mb-2"
      autocorrect="off"
      autocapitalize="none"
      :autocomplete="autocomplete || name"
      @input="onInput"
      @blur="() => $emit('blur')"
    />
  </base-form-control-container>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from 'nuxt-property-decorator'
import Icon from '../Icons/Icon.vue'
import BaseFormControlContainer from './BaseFormControlContainer.vue'

@Component({
  components: { BaseFormControlContainer, Icon }
})
export default class BaseFormControl extends Vue {
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
    validator: value => ['text', 'password', 'select'].includes(value),
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

  @Emit('input')
  private onInput(event: InputEvent): string {
    return (event.target as HTMLInputElement).value
  }
}
</script>