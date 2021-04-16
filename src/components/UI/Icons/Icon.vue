<template>
  <component
    :is="name"
  />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'nuxt-property-decorator'
import Close from './Close.vue'
import Chevron from './Chevron.vue'
import Menu from './Menu.vue'
import Logo from './Logo.vue'

@Component({
  components: {
    Close,
    Chevron,
    Menu,
    Logo,
  }
})
export default class Icon extends Vue {
  @Prop({
    type: String,
    required: true,
  })
  private name!: string
}
</script>
