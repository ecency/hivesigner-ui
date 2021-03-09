<template>
  <span>{{ formatValue(value) }}</span>
</template>

<script lang="ts">
import { formatNumber, getVestsToSP } from '~/utils'
import { Component, Vue, Prop } from 'nuxt-property-decorator'
import { SettingsModule } from '~/store'
import { VESTS_REGEX } from '~/consts'

@Component
export default class OperationValueAmount extends Vue {
  @Prop({
    type: String,
    required: true,
  })
  private value!: any

  private get vestToSP(): number {
    return getVestsToSP(SettingsModule.properties)
  }

  private formatValue(value: string): any {
    if (VESTS_REGEX.test(value)) {
      return `${formatNumber(parseFloat(value) * this.vestToSP)} HP`
    }
    return value
  }
}
</script>
