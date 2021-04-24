<template>
  <div class="form-control mb-4">
    <div class="flex items-center text-lg text-black-500 mb-2">
      <label :for="name" class="flex items-center">
        {{ label }}

        <span
          v-if="tooltip"
          class="inline-block tooltip ml-1 cursor-pointer hover:text-black"
          :aria-label="tooltip"
        >
        <Icon name="Info" class="input-block" style="width: 20px; height: 20px;" />
      </span>
      </label>
      <span v-if="error" class="mx-1">/</span>
      <div v-if="error" class="text-primary">{{ error }}</div>
    </div>
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
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from 'nuxt-property-decorator'
import Icon from '../Icons/Icon.vue'

@Component({
  components: { Icon }
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
    type: String,
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
