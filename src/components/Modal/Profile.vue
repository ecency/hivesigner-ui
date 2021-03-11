<template>
  <VueModal v-if="open" @close="$emit('close')" :title="username" class="small">
    <div class="default-body">
      <VueLoadingIndicator v-if="isLoading" class="big"/>
      <template v-else>
        <div class="mb-4 text-center" v-if="!failed">
          <div class="mb-4">
            <Avatar :username="username" :size="80" class="mb-2"/>
            <h4 v-if="profile.name" class="m-0">{{ profile.name }}</h4>
            <div v-if="profile.website">{{ profile.website | parseUrl }}</div>
          </div>
          <a
            v-if="profile.website"
            class="btn btn-large mb-4"
            :href="profile.website"
            target="_blank"
          >
            Visit <span class="iconfont icon-link-external"></span>
          </a>
          <div class="text-left">
            <div v-if="profile.about" class="mb-4">
              <p><b>About</b></p>
              <p>{{ profile.about }}</p>
            </div>
            <div v-if="profile.creator" class="mb-4">
              <p><b>Creator</b></p>
              <p>
                <a :href="'https://hive.blog/@' + profile.creator" target="_blank">
                  <Avatar :username="profile.creator" :size="22"/>
                  {{ profile.creator }}
                  <span class="iconfont icon-link-external"></span>
                </a>
              </p>
            </div>
          </div>
        </div>
        <div v-else>
          <div class="flash flash-error mb-4">
            Oops, something went wrong. The username provided is invalid.
          </div>
        </div>
      </template>
    </div>
  </VueModal>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'nuxt-property-decorator'
import { client, isValidUrl } from '~/utils'
import Avatar from '~/components/Avatar.vue'

@Component({
  components: { Avatar }
})
export default class Profile extends Vue {
  @Prop({
    type: Boolean,
    default: false,
  })
  private open!: boolean

  @Prop({
    type: String,
    default: '',
  })
  private username!: string

  private isLoading = false
  private failed = false
  private profile: any = {}

  @Watch('open')
  private reset(): void {
    if (this.open) {
      this.loadProfile()
    }
  }

  private async loadProfile(): Promise<void> {
    this.isLoading = true

    const accounts = await client.database.getAccounts([this.username])
    if (accounts[0]) {
      try {
        this.profile = JSON.parse(accounts[0].json_metadata).profile
        if (!isValidUrl(this.profile.website)) {
          delete this.profile.website
        }
      } catch (e) {
        console.log('Failed to parse app account', e)
      }
    }

    this.failed = !accounts[0]
    this.isLoading = false
  }
}
</script>
