<template>
  <div>
    <a @click="toggle" class="p-4 block border rounded overflow-hidden mb-3 cursor-pointer hover:underline">
      <h4 class="text-xl text-black-500 font-bold">{{ title }}</h4>
    </a>
    <div v-if="open" class="mb-6 text-black-400 text-lg">
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
