<template>
  <div class="search px-6">
    <Icon name="search" class="text-gray-400" />
    <input
      :value="value"
      :placeholder="placeholder"
      @input="handleInput"
      type="text"
      autocorrect="off"
      autocapitalize="none"
      class="border-none"
      style="height: 56px"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'nuxt-property-decorator'
import Icon from './UI/Icons/Icon.vue'
@Component({
  components: { Icon }
})
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
