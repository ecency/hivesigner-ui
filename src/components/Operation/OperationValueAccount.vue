<template>
  <a :href="'https://hive.blog/@' + value" target="_blank">
    <Avatar :username="value" :size="22" />
    {{ value }}
    <span class="iconfont icon-link-external"></span>
  </a>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'nuxt-property-decorator'

@Component
export default class OperationValueAccount extends Vue {
  @Prop()
  private value!: any
}
</script>
