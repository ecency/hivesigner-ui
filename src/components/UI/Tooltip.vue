<template>
  <div class="tooltip flex" v-if="tooltip">
    <transition name="fade">
      <div
        class="overlay inset-0 fixed bg-black-400 opacity-40 duration-500"
        v-if="open"
      ></div>
    </transition>
    <span
      class="inline-block tooltip-popup cursor-pointer hover:text-black"
      :aria-label="tooltip"
      @mouseover="open = true"
      @mouseleave="open = false"
    >
      <icon name="Info" class="input-block" style="width: 20px; height: 20px;"/>
     </span>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import Icon from './Icons/Icon.vue'

@Component({
  components: { Icon }
})
export default class Tooltip extends Vue {
  @Prop({
    type: String,
    default: '',
  })
  private tooltip!: string

  private open = false
}
</script>
<style lang="scss">
.tooltip-popup {
  position: relative;

  &::before {
    @apply top-auto absolute right-1/2 border-8 -mr-1.5 border-transparent text-white -bottom-2
    duration-200 opacity-0 z-20;

    content: '';
    border-bottom-color: theme('colors.current') !important;
    border-right-color: theme('colors.current') !important;
    border-width: 6px;
  }

  &::after {
    content: attr(aria-label);
    max-width: 300px;
    transform: translate(-50%, -0.5rem);

    @apply absolute text-black-400 bg-white xl:text-lg text-center top-full mt-4
    left-1/2 right-auto pointer-events-none w-max duration-200 opacity-0 z-20 p-6;
  }

  &:hover {
    &::before, &::after {
      @apply opacity-100;
    }
  }
}
</style>
