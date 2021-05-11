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
import Keychain from './Keychain.vue'
import Trash from './Trash.vue'
import Link from './Link.vue'
import Info from './Info.vue'
import Github from './Github.vue'
import Discord from './Discord.vue'
import Bookmark from './Bookmark.vue'
import Search from './Search.vue'
import SelectArrow from './SelectArrow.vue'
import Options from './Options.vue'
import Check from './Check.vue'
import TransactionSuccess from './TransactionSuccess.vue'
import TransactionFailure from './TransactionFailure.vue'
import BackArrow from './BackArrow.vue'

@Component({
  components: {
    Close,
    Chevron,
    Menu,
    Logo,
    Keychain,
    Trash,
    Link,
    Info,
    Github,
    Discord,
    Bookmark,
    Search,
    SelectArrow,
    Options,
    Check,
    TransactionSuccess,
    TransactionFailure,
    BackArrow,
  },
})
export default class Icon extends Vue {
  @Prop({
    type: String,
    required: true,
  })
  private name!: string
}
</script>
