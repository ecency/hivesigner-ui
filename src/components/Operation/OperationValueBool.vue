<template>
  <span v-text="value" />
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'nuxt-property-decorator'

@Component
export default class OperationValueBool extends Vue {
  @Prop()
  private value!: any
}
</script>
