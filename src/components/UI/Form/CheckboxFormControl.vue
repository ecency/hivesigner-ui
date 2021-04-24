<template>
  <label class="checkbox-form-control text-lg text-black-500 flex items-center mb-4">
    <input
      :key="name"
      :checked="value"
      type="checkbox"
      @change="(e) => $emit('input', e.target.checked)"
    />
    <span class="checkbox mr-2" :class="classes"></span>
    {{ label }}
  </label>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'

@Component
export default class CheckboxFormControl extends Vue {
  @Prop({
    type: Boolean,
    default: false,
  })
  private value!: boolean

  @Prop({
    type: String,
    default: '',
  })
  private label!: string

  @Prop({
    type: String,
    required: true,
  })
  private name!: string

  private get classes(): Record<string, boolean> {
    return {
      '-checked': this.value
    }
  }
}
</script>
<style lang="scss">
.checkbox-form-control {
  input {
    display: none;
    visibility: hidden;
  }

  .checkbox {
    width: 25px;
    height: 25px;

    @apply border border-gray hover:border-primary duration-300 flex items-center justify-center;

    &::before {
      content: '';
      width: 21px;
      height: 17px;
      background-image: url("data:image/svg+xml,%3Csvg width='21' height='17' viewBox='0 0 21 17' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1.38916 5.07386L8.80485 14.4896L19.6889 0.669678' stroke='white' stroke-width='2'/%3E%3C/svg%3E%0A");

      @apply bg-contain bg-no-repeat duration-300 opacity-0;
    }

    &.-checked {
      @apply bg-primary-200 border-primary-200 hover:border-primary;

      &::before {
        @apply opacity-100;
      }
    }
  }
}
</style>
