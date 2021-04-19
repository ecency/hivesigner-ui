<template>
  <div class="overflow-x-auto w-full">
    <table class="w-full text-black-400 text-lg">
      <thead>
      <tr>
        <th v-for="col of columns" :key="col">{{ col }}</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(value, i) of values" :key="i">
        <td v-for="cell of columns" :key="cell">
          <slot :name="cell" :cell-data="value[cell]">{{ value[cell] }}</slot>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'

@Component
export default class Table extends Vue {
  @Prop()
  private columns!: string[]

  @Prop()
  private values!: Record<string, any>[]
}
</script>
