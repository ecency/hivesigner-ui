<template>
  <div class="select text-lg relative text-black-500 z-10" :class="{ '-opened': open }">
    <transition name="fade">
      <div
        v-if="open"
        class="overlay inset-0 fixed bg-black-400 opacity-40 duration-500"
        @click="hide"
      />
    </transition>
    <div
      class="input cursor-pointer flex justify-between items-center relative bg-white"
      :class="{ 'border border-black-500 z-10': open }"
      @click="toggle"
    >
      <span>{{ value }}</span>
      <icon class="arrow duration-200 text-black-400" name="select-arrow" />
    </div>
    <transition>
      <div
        v-if="open"
        class="select-options border border-black-500 rounded-md mt-4 absolute z-10 w-full bg-white overflow-hidden"
      >
        <div
          v-for="(option, index) of options"
          :key="index"
          class="select-option cursor-pointer py-4 px-5 hover:bg-primary-100"
          :class="{ 'bg-gray-200': value === option }"
          @click="onOptionSelect(option)"
        >
          {{ option.label || option }}
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit, Watch } from 'nuxt-property-decorator'
import Icon from '../Icons/Icon.vue'

@Component({
  components: { Icon }
})
export default class Select extends Vue {
  @Prop({
    default: ''
  })
  private value!: any

  @Prop({
    type: Array,
    default: () => []
  })
  private options!: any[]

  private open = false

  public show (): void {
    this.open = true
  }

  public hide (): void {
    this.open = false
  }

  private toggle (): void {
    this.open = !this.open
  }

  @Emit('select')
  private onOptionSelect (option: any): any {
    this.hide()
    return option.value || option
  }

  @Watch('open')
  private openChanged (): void {
    if (!this.open) {
      this.onBlur()
    }
  }

  @Emit('blur')
  private onBlur (): void {
  }
}
</script>
<style lang="scss">
.select {
  &.-opened {
    .arrow {
      transform: matrix(1, 0, 0, -1, 0, 0);
    }
  }
}
</style>
