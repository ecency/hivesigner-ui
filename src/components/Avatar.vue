<template>
  <span
    class="avatar"
    :style="{
      'background-image': `url(https://images.ecency.com/u/${username}/avatar/small`,
      width: `${this.size}px`,
      height: `${this.size}px`,
    }"
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
}
</script>

<style scoped lang="scss">
  @import '../assets/scss/vars';

  .avatar {
    border-radius: 50%;
    background-size: cover;
    background-repeat: no-repeat;
    background-position: 50% 50%;
    background-color: $border-color;

    &.avatar-medium {
      width: 64px;
      height: 64px;
      border-radius: 2px;
    }
  }
</style>
