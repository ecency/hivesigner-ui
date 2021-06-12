<template>
  <div class="border-2 rounded-md mb-6">
    <OperationHeader :operation="operation[0]" />
    <div class="border-t p-4">
      <div v-for="(value, key) in operation[1]" :key="key">
        <p class="mb-2 text-lg block">
          <span
            class="align-top inline-block text-black-400 font-bold"
            style="min-width: 160px;"
          >
            {{ schema[key].name || key }}
          </span>
          <OperationValue :value="value" :path="operation[0]" :schema-key="key" />
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'nuxt-property-decorator'
import { OPERATIONS } from '~/consts'

@Component
export default class Operation extends Vue {
  @Prop({
    type: Array,
    default: () => [],
  })
  private operation!: any[]

  private get schema (): any {
    return OPERATIONS[this.operation[0]]?.schema || {}
  }
}
</script>
