<template>
  <div class="apps-details">
    <Loader v-if="isLoading" />
    <template v-else>
      <div v-if="!failed" class="mb-6 text-center">
        <div class="mb-6">
          <Avatar :username="username" :size="80" class="mb-2" />
          <h4 v-if="profile.name" class="text-xl font-bold text-black-500">
            {{ profile.name }}
          </h4>
          <div v-if="profile.website" class="text-black-400 text-lg">
            {{ profile.website | parseUrl }}
          </div>
        </div>
        <a
          v-if="profile.website"
          class="button button-sm mb-6 inline-flex items-center text-lg"
          :href="profile.website"
          target="_blank"
        >
          <span class="font-medium">{{ $t('apps.visit') }}</span>
          <Icon name="Link" style="width: 12px;height: 12px" class="ml-2" />
        </a>
        <div class="text-left">
          <div v-if="profile.about" class="mb-6">
            <p class="font-medium mb-2 text-black-400 text-lg">
              {{ $t('apps.about') }}
            </p>
            <p class="mb-2">
              {{ profile.about }}
            </p>
          </div>
          <div v-if="profile.creator" class="mb-6">
            <p class="font-medium mb-2 text-black-400 text-lg">
              {{ $t('apps.creator') }}
            </p>
            <p class="mb-2">
              <a
                :href="'https://ecency.com/@' + profile.creator"
                target="_blank"
                class="text-black hover:underline items-center flex"
              >
                <Avatar :username="profile.creator" :size="22" class="mr-2" />
                {{ profile.creator }}
                <Icon name="Link" style="width: 12px;height: 12px" class="ml-2" />
              </a>
            </p>
          </div>
        </div>
      </div>
      <div v-else>
        <div class="alert alert-error mb-6">
          {{ $t('errors.unknown') }}
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'nuxt-property-decorator'
import Icon from '../UI/Icons/Icon.vue'
import Loader from '../UI/Loader.vue'
import { client, isValidUrl } from '~/utils'

@Component({
  components: { Loader, Icon }
})
export default class AppDetails extends Vue {
  @Prop({
    type: String,
    default: ''
  })
  private username!: string

  private isLoading = false
  private failed = false
  private profile: Record<string, string> = {}

  private async mounted (): Promise<void> {
    await this.loadProfile()
  }

  private async loadProfile (): Promise<void> {
    this.isLoading = true

    const accounts = await client.database.getAccounts([this.username])
    if (accounts[0]) {
      try {
        this.profile = JSON.parse(accounts[0].posting_json_metadata).profile
        if (!isValidUrl(this.profile.website)) {
          delete this.profile.website
        }
      } catch (e) {
        console.error('Failed to parse app account', e)
      }
    }

    this.failed = !accounts[0]
    this.isLoading = false
  }
}
</script>
