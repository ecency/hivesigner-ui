<template>
  <span
    class="avatar inline-block rounded-full bg-cover bg-no-repeat bg-center bg-gray-300"
    :style="styles"
  />
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'nuxt-property-decorator'

@Component
export default class Avatar extends Vue {
  @Prop({
    type: String,
    required: true,
  })
  private username!: string

  @Prop({
    type: Number,
    default: 32,
  })
  private size!: number

  private get styles(): Record<string, string> {
    return {
      'background-image': `url(https://images.ecency.com/u/${this.username}/avatar/small`,
      width: `${this.size}px`,
      height: `${this.size}px`,
    }
  }
}
</script>

<style scoped lang="scss">
.avatar {
  &.avatar-medium {
    width: 64px;
    height: 64px;
    border-radius: 2px;
  }
}
</style>
