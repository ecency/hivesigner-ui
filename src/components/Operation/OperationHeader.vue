<template>
  <div class="p-4">
    <h4 class="text-xl font-bold text-black-500">
      {{ model.name || operation }}
    </h4>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'nuxt-property-decorator'
import { OPERATIONS } from '~/consts'

@Component
export default class OperationHeader extends Vue {
  @Prop()
  private operation!: any

  private model: any = OPERATIONS[this.operation] || {}
}
</script>
