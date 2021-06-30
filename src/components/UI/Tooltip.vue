<template>
  <div v-if="tooltip" class="tooltip flex">
    <transition name="fade">
      <div
        v-if="open"
        class="overlay inset-0 fixed bg-black-400 opacity-40 duration-500"
      />
    </transition>
    <span
      class="inline-block tooltip-popup cursor-pointer hover:text-black relative"
      :class="{ 'z-20': open }"
      :aria-label="tooltip"
      @mouseover="open = true"
      @mouseleave="open = false"
    >
      <icon name="Info" class="input-block" style="width: 20px; height: 20px;" />
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
    default: ''
  })
  private tooltip!: string

  private open = false
}
</script>
<style lang="scss">
.tooltip-popup {
  &::before {
    @apply top-auto absolute right-1/2 border-8 border-transparent text-white -bottom-3
    duration-200 opacity-0;

    content: '';
    border-bottom-color: theme('colors.current') !important;
    border-right-color: theme('colors.current') !important;
    border-width: 6px;
  }

  &::after {
    content: attr(aria-label);
    max-width: 300px;
    transform: translate(-50%, -0.5rem);

    @apply absolute text-black-400 bg-white xl:text-lg text-center top-full mt-5 left-1/2
    right-auto pointer-events-none w-max duration-200 opacity-0 p-6 md:py-8 md:px-9;

    @screen md {
      max-width: 500px;
    }
  }

  &:hover {
    &::before, &::after {
      @apply opacity-100;
    }
  }
}
</style>
