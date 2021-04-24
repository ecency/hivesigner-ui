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
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'

@Component
export default class BaseFormControlContainer extends Vue {
  @Prop({
    type: String,
    default: '',
  })
  private name!: string

  @Prop({
    type: String,
    default: '',
  })
  private label!: string

  @Prop({
    type: String,
    default: '',
  })
  private tooltip!: string

  @Prop({
    default: '',
  })
  private error!: string
}
</script>
