<template>
  <div class="form-control mb-4">
    <div class="flex items-center text-lg text-black-500 mb-2">
      <label :for="name" class="flex items-center">
        {{ label }}

       <tooltip class="ml-1" :tooltip="tooltip" />
      </label>
      <span v-if="error" class="mx-1">/</span>
      <div v-if="error" class="text-primary">{{ error }}</div>
    </div>
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import Icon from '../Icons/Icon.vue'
import Tooltip from '../Tooltip.vue'

@Component({
  components: { Tooltip, Icon }
})
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
