<template>
  <div class="hero height-full">
    <Center>
      <div class="width-full p-4 mb-4">
        <div v-if="username" class="text-center">
          <div class="mb-3">
            <Avatar :username="username" :size="80"/>
            <h4>{{ username }}</h4>
          </div>
          <p>Your account is unlocked, ready to sign transaction(s).</p>
          <p>
            <router-link to="/login">
              Switch account
            </router-link>
          </p>
        </div>
      </div>
      <Footer/>
    </Center>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import { AuthModule } from '~/store'

@Component
export default class Dashobard extends Vue {
  private get username(): string {
    return AuthModule.username
  }
}
</script>
