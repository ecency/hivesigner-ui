<template>
  <div class="modal">
    <transition name="fade">
      <div
        class="duration-300 bg-black opacity-70 fixed top-0 left-0 right-0 bottom-0"
        v-if="open"
        @click="hide"
      ></div>
    </transition>
    <transition name="slide-right">
      <div
        class="modal-content overflow-y-auto w-full fixed h-full top-0 right-0 bg-white duration-300"
        v-if="open"
      >
        <div class="modal-title py-5 pl-6 pr-4 border-b flex items-center justify-between">
          <span class="text-lg text-black-400">{{ title }}</span>
          <a role="button" @click="hide"
             class="cursor-pointer text-black-400 p-2 rounded-full hover:bg-green-100">
            <Icon name="close" style="width: 18px; height: 18px" />
          </a>
        </div>
        <div class="modal-body p-6">
          <slot></slot>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import Icon from './Icons/Icon.vue'
@Component({
  components: { Icon }
})
export default class SideModal extends Vue {
  @Prop({
    type: String,
    default: 'right',
    validator: value => ['center', 'left', 'right'].includes(value),
  })
  private position!: string

  @Prop({
    type: String,
    default: '',
  })
  private title!: string

  private open = false

  public show(): void {
    this.open = true
    document.body.classList.add('overflow-hidden')
  }

  public hide(): void {
    this.open = false
    document.body.classList.remove('overflow-hidden')
  }
}
</script>

<style lang="scss">
.modal {

  .modal-content {
    max-width: 500px;
  }

  .fade-enter, .fade-leave-to {
    @apply opacity-0;
  }

  .slide-right-active, .slide-right-leave-active {
    transform: translateX(0);
  }

  .slide-right-enter, .slide-right-leave-to {
    transform: translateX(100%);
    @apply opacity-0;
  }
}
</style>
