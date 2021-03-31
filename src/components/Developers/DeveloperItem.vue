<template>
  <div>
    <a @click="toggle" class="Box p-3 d-block border rounded-1 overflow-hidden mb-3">
      <h4 class="m-0">{{ title }}</h4>
    </a>
    <div v-if="open" class="mb-4">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'

@Component
export default class DeveloperItem extends Vue {
  @Prop({
    type: String,
    default: '',
  })
  private title!: string

  @Prop({
    default: null
  })
  private value!: string | null

  private get open(): boolean {
    return this.title === this.value
  }

  private toggle(): void {
    this.$emit('input', this.open ? null : this.title)
  }
}
</script>

<style scoped>

</style>
