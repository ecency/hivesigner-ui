<template>
  <div class="search px-4">
    <span class="iconfont icon-search"/>
    <input
      :value="value"
      :placeholder="placeholder"
      @input="handleInput"
      type="text"
      autocorrect="off"
      autocapitalize="none"
      class="px-4 py-3 border-0 input-lg"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'nuxt-property-decorator'

@Component
export default class Search extends Vue {
  @Prop({
    type: String,
    default: '',
  })
  private value!: string

  @Prop({
    type: String,
    default: '',
  })
  private placeholder!: string

  private handleInput(e: Event): void {
    this.$emit('input', (e.target as HTMLInputElement).value)
  }
}
</script>

<style lang="scss" scoped>
  @import '../assets/scss/vars';

  .search {
    display: flex;
    align-items: center;

    & > .icon-search {
      color: $input-border-color;
      font-size: 20px;
    }

    & > input {
      flex: 1;
    }
  }
</style>
