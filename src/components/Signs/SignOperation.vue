<template>
  <accordion :title="operation.details.name">
    <form @submit.prevent.stop="submit">
      <form-control
        v-for="schema of schemas"
        :key="schema.name"
        :label="schema.name"
        :value="form[schema.name]"
        @input="onInput(schema.name, $event)"
      />
      <button
        class="button button-primary mb-12"
        style="min-width: 120px"
      >
        {{ $t('signs.sign') }}
      </button>
    </form>
  </accordion>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import Accordion from '../UI/Accordion.vue'
import { Operation } from '~/models'
import FormControl from '../UI/Form/FormControl.vue'
import { encodeOp } from 'hive-uri'

@Component({
  components: { FormControl, Accordion },
  middleware: ['auth']
})
export default class SignOperation extends Vue {
  @Prop({
    required: true,
  })
  private operation!: { name: string, details: Operation }

  private form = {}

  private get schemas(): any[] {
    return Object.keys(this.operation.details.schema).map(name => {
      this.form[name] = this.operation.details.schema[name].defaultValue
      return { name, type: this.operation.details.schema[name].type }
    })
  }

  private onInput(name: string, value: string): void {
    Vue.set(this.form, name, value)
  }

  private submit(): void {
    this.$router.push(encodeOp([
      this.operation.name,
      this.form,
    ] as any).replace('hive://', '/'))
  }
}
</script>

<style scoped>

</style>
