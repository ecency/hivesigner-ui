<template>
  <div class="transaction-state flex flex-col justify-center items-center text-center overflow-hidden">
    <icon class="status-image" :name="statusIcon" />
    <div class="text-2xl sm:text-3xl xl:text-4xl mt-4 font-bold pb-9">{{ title }}</div>
    <div class="pb-9 break-all sm:break-normal w-full overflow-y-auto" v-html="message"></div>
    <router-link to="/signs" class="flex items-center">
      <icon name="back-arrow" class="block mr-2 text-gray" />
      {{ $t('sign.back_to_sign') }}
    </router-link>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import Icon from './UI/Icons/Icon.vue'

@Component({
  components: { Icon }
})
export default class TransactionStatus extends Vue {
  @Prop({
    type: String,
    required: true,
  })
  private status!: 'failure' | 'success'

  @Prop({
    type: String,
    default: '',
  })
  private successMessage!: string

  @Prop({
    type: String,
    default: '',
  })
  private failureMessage!: string

  private get statusIcon(): string {
    return `transaction-${this.status}`
  }

  private get title(): any {
    if (this.status === 'success') {
      return this.$t('sign.success_title')
    }
    return this.$t('sign.failure_title')
  }

  private get message(): any {
    if (this.status === 'success') {
      return this.successMessage
    }
    return this.failureMessage
  }
}
</script>

<style lang="scss" scoped>
.status-image {
  width: 121px;
  height: 154px;

  @screen xl {
    width: 179px;
    height: 228px;
  }
}
</style>
