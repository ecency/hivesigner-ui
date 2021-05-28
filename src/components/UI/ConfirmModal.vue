<template>
  <Modal ref="modal">
    <div class="flex flex-col items-center text-center">
      <div class="mb-10 text-black-400 text-lg" v-html="$t(message)"></div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 w-full">
        <a
          role="button"
          class="p-4 hover:bg-primary hover:text-white text-primary bg-gray-100 duration-300"
          @click="positive"
        >
          {{ $t(positiveLabel) }}
        </a><a
        role="button"
        class="p-4 hover:bg-gray-300 duration-300 text-black-400 bg-gray-100"
        @click="negative"
      >
        {{ $t(negativeLabel) }}
      </a>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import { Component, Emit, Prop, Ref, Vue } from 'nuxt-property-decorator'
import Modal from './Modal.vue'

@Component({
  components: { Modal }
})
export default class ConfirmModal extends Vue {
  @Prop({
    type: String,
    default: 'common.yes',
  })
  private positiveLabel!: string

  @Prop({
    type: String,
    default: 'common.no',
  })
  private negativeLabel!: string

  @Prop({
    type: String,
    default: '',
  })
  private message!: string

  @Ref('modal')
  private modalRef!: Modal

  @Emit('positive')
  private positive(): void {
    this.modalRef.hide()
  }

  @Emit('negative')
  private negative(): void {
    this.modalRef.hide()
  }

  public show(): void {
    this.modalRef.show()
  }
}
</script>
