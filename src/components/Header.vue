<template>
  <div class="header border-b fixed top-0 left-0 w-full flex items-center">
    <router-link class="px-6 py-5 block border-r" to="/">
      <Icon name="Logo" style="width: 16px; height: 16px;" />
    </router-link>
    <slot>
      <h5 class="ml-4 text-lg text-black-500">{{ title }}</h5>
    </slot>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'nuxt-property-decorator'
import Icon from './UI/Icons/Icon.vue'
@Component({
  components: { Icon }
})
export default class Header extends Vue {
  @Prop({
    type: String,
    default: '',
  })
  private title!: string
}
</script>
