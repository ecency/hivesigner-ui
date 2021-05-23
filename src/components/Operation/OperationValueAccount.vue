<template>
  <a
    :href="'https://hive.blog/@' + value"
    target="_blank"
    class="inline-flex items-center hover:underline"
  >
    <Avatar :username="value" :size="22" class="mr-1" />
    {{ value }}
    <Icon name="Link" class="ml-2" style="width: 16px;height: 16px;" />
  </a>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'nuxt-property-decorator'
import Icon from '../UI/Icons/Icon.vue'
@Component({
  components: { Icon }
})
export default class OperationValueAccount extends Vue {
  @Prop()
  private value!: string
}
</script>
