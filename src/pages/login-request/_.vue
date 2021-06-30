<template>
  <div />
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'

@Component
export default class LoginRequest extends Vue {
  mounted () {
    this.$router.push({
      path: '/login',
      query: this.$route.query
    })
  }
}
</script>
