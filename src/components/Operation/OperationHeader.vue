<template>
  <div class="Box-row">
    <h4 class="mb-0">{{ model.name || operation }}</h4>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'nuxt-property-decorator'
import { OPERATIONS } from '~/consts'

@Component
export default class OperationHeader extends Vue {
  @Prop()
  private operation!: any

  private get model(): any {
    return OPERATIONS[this.operation] || {}
  }
}
</script>
