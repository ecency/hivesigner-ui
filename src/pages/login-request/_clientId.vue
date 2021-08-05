<template>
  <div />
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'

@Component
export default class LoginRequestByClientID extends Vue {
  mounted () {
    this.$router.push({
      path: '/login',
      query: {
        ...this.$route.query,
        clientId: this.$route.params.clientId || this.$route.query.clientId as string ||
      this.$route.query.client_id as string
      }
    })
  }
}
</script>
