<template>
  <div class="Box operation mb-4">
    <OperationHeader :operation="operation[0]" />
    <div class="Box-row">
      <div v-for="(value, key) in operation[1]" :key="key">
        <p>
          <b class="form-label v-align-top">{{ schema[key].name || key }}</b>
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

  private get schema(): any {
    return OPERATIONS[this.operation[0]]?.schema || {}
  }
}
</script>
