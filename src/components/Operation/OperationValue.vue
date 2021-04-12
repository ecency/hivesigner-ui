<template>
  <span>
    <template v-if="value && Array.isArray(value)">
      <em v-if="value.length === 0">empty</em>
      <OperationValue v-else v-for="(v, key) in value" :key="key" :value="v" :schema-key="key" />
    </template>
    <template v-else-if="value && typeof value === 'object'">
      <div v-for="(v, key) in value" :key="key" class="mt-2">
        <p>
          <span class="form-label">- {{ key }}</span>
          <OperationValue :value="v" />
        </p>
      </div>
    </template>
    <template v-else>
      <template v-if="value === '__signer'">
        <template v-if="username">
          <OperationValueAccount :value="username" />
        </template>
        <em v-else>you</em>
      </template>
      <template v-else-if="!value && schema.type !== 'bool'">
        <em>empty</em>
      </template>
      <template v-else>
        <OperationValueAccount v-if="schema.type === 'account'" :value="value" />
        <OperationValueAmount v-else-if="schema.type === 'amount'" :value="value" />
        <OperationValueJson v-else-if="schema.type === 'json'" :value="value" />
        <OperationValueBool v-else-if="schema.type === 'bool'" :value="value" />
        <template v-else-if="schema.type === 'time'">{{ value | dateHeader }}</template>
        <template v-else>{{ value }}</template>
      </template>
    </template>
  </span>
</template>

<script lang="ts">
import { Vue, Prop, Component } from 'nuxt-property-decorator'
import { AuthModule } from '~/store'
import { OPERATIONS } from '~/consts'

@Component
export default class OperationValue extends Vue {
  @Prop()
  private value!: any

  @Prop()
  private path!: any

  @Prop()
  private schemaKey!: string

  private get username(): string {
    return AuthModule.username
  }

  private get schema(): any {
    return OPERATIONS[this.path]?.schema[this.schemaKey] || {}
  }
}
</script>
