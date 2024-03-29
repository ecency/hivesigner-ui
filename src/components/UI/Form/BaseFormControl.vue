<template>
  <base-form-control-container :name="name" :label="label" :tooltip="tooltip" :error="error">
    <div class="relative">
      <div v-if="$slots['input-prefix-icon']" class="input-prefix-icon flex items-center justify-center absolute top-0 left-0">
        <slot name="input-prefix-icon" />
      </div>
      <input
        :id="name"
        :key="name"
        :value="value"
        :name="name"
        :type="type"
        :placeholder="placeholder"
        :class="{
          'has-prefix': $slots['input-prefix-icon']
        }"
        class="input-lg block mb-2 px-6"
        autocorrect="off"
        autocapitalize="none"
        :autocomplete="autocomplete || name"
        @input="onInput"
        @blur="() => $emit('blur')"
      >
      <div class="input-suffix-icon flex items-center justify-center absolute top-0 right-0">
        <slot name="input-suffix-icon" />
      </div>
    </div>
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
    validator: value => ['text', 'number', 'password'].includes(value)
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
  private placeholder!: string

  @Prop({
    type: String,
    default: ''
  })
  private tooltip!: string

  @Emit('input')
  private onInput (event: InputEvent): string {
    return (event.target as HTMLInputElement).value
  }
}
</script>

<style scoped>
input.has-prefix {
  padding-left: 42px;
}

.input-suffix-icon {
  width: 72px;
  height: 58px;
}

.input-prefix-icon {
  width: 58px;
  height: 58px;
}
</style>
