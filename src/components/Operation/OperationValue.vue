<template>
  <span
    class="operation-value inline-block text-gray-600"
    :class="{ 'responsive-short overflow-hidden w-full': responsiveShort && !schema.type }"
    :responsive-key-start="value && value.length > 8 && value.slice(0, 3)"
    :responsive-key-end="value && value.length > 8 && value.slice(value.length - 4, value.length - 1)"
  >
    <template v-if="value && Array.isArray(value)">
      <em v-if="value.length === 0">{{ $t('operations.empty') }}</em>
      <OperationValue v-for="(v, key) in value" v-else :key="key" :value="v" />
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
        <em v-else>{{ $t('operations.you') }}</em>
      </template>
      <template v-else-if="!value && schema.type !== 'bool'">
        <em>{{ $t('operations.empty') }}</em>
      </template>
      <template v-else>
        <OperationValueAccount v-if="schema.type === 'account'" :value="value" />
        <OperationValueAmount v-else-if="schema.type === 'amount'" :value="value" />
        <OperationValueJson v-else-if="schema.type === 'json'" :value="value" />
        <OperationValueBool v-else-if="schema.type === 'bool'" :value="value" />
        <template v-else-if="schema.type === 'time'">{{ value | dateHeader }}</template>
        <span v-else-if="schema.type">{{ value }}</span>
        <template v-else-if="!schema.type && responsiveShort">
          <span class="block xl:hidden" />
          <span class="hidden xl:block">{{ value }}</span>
        </template>
        <span v-else>{{ value }}</span>
      </template>
    </template>
  </span>
</template>

<script lang="ts">
import { Vue, Prop, Component } from 'nuxt-property-decorator'
import { Operation } from '../../models'
import { AuthModule } from '~/store'
import { OPERATIONS } from '~/consts'

@Component
export default class OperationValue extends Vue {
  @Prop()
  private value!: any

  @Prop()
  private path!: string

  @Prop()
  private schemaKey!: string

  @Prop({
    type: Boolean,
    default: false
  })
  private responsiveShort!: boolean

  private get username (): string {
    return AuthModule.username
  }

  private get schema (): Operation['schema'][0]['key'] {
    return OPERATIONS[this.path]?.schema[this.schemaKey] || {}
  }
}
</script>
<style lang="scss">
.operation-value {
  &.responsive-short {
    @apply flex justify-between items-end;

    @screen xl {
      @apply block;
    }

    span {
      @apply border-dotted border-b-2 border-gray-600 w-full mb-1.5;

      @screen xl {
        @apply border-0;
      }
    }

    &::before, &::after {
      @apply block;

      @screen xl {
        @apply hidden;
      }
    }

    &::before {
      content: attr(responsive-key-start);
    }

    &::after {
      content: attr(responsive-key-end);
    }
  }
}
</style>
