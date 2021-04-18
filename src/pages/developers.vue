<template>
  <div class="font-old">
    <Header title="Developers"/>
    <div class="p-6">
      <div class="container-sm mx-auto mb-4">
        <p class="mb-6 text-black-400 text-lg">
          You’ve found the HiveSigner developer documentation! This page dedicated to showing you
          all the ways that you can use HiveSigner to make cool stuff.
        </p>
        <developer-item title="1. Add new app" v-model="currentItem">
          <div class="mb-4">
            <p class="mb-2">
              To create a new app on HiveSigner you need a Hive account for it. If you don't have
              one yet you can create one on
              <a href="https://signup.hive.io" class="text-black hover:underline" target="_blank">
                signup.hive.io
              </a> in with your app
              account and update your profile with "application" as account type.
            </p>
            <router-link to="/profile" class="button inline-flex text-base">
              Enable app
            </router-link>
          </div>
          <p class="mb-2">
            If you would like to use the OAuth 2 API for posting with HiveSigner server you need to
            authorize the Hive account "hivesigner" to post on the behalf of your app account.
            <router-link to="/authorize/hivesigner">Click here</router-link>
            to do this and sign with your app account.
          </p>
        </developer-item>
        <developer-item title="2. Edit app settings" v-model="currentItem">
          <p class="mb-2">You can edit your app settings by updating your app account profile.</p>
          <router-link to="/profile" class="button inline-flex text-base">
            Edit app settings
          </router-link>
        </developer-item>
        <developer-item title="3. Hivesigner JS SDK" v-model="currentItem">
          <p class="mb-2">
            Get started integrating HiveSigner on your website with HiveSigner.js, the official
            JavaScript SDK. Learn how to setup and use
            <a href="https://github.com/ledgerconnect/hivesigner.js#sdk-methods" target="_blank"
               class="text-black hover:underline">
              SDK methods
            </a>.
          </p>
          <p class="mb-2">
            <a href="https://github.com/ledgerconnect/hivesigner.js#getting-started"
               target="_blank" class="text-black hover:underline flex items-center">
              <Icon name="Github" class="mr-1" />
              hivesigner.js
            </a>
          </p>
        </developer-item>
        <developer-item title="4. How OAuth2 works" v-model="currentItem">
          <p class="mb-2">
            OAuth 2 is the industry-standard protocol for authorization. After you have checked
            above steps, You can read more about
            <a
              href="https://github.com/ledgerconnect/hivesigner/wiki/How-OAuth2-Work%3F"
              target="_blank"
              class="text-black hover:underline"
            >
              authorization flow in our Wiki page
            </a>.
          </p>
        </developer-item>
        <developer-item title="5. Demo app" v-model="currentItem">
          <p class="mt-2">Checkout HiveSigner demo with Vue.js</p>
          <p class="mb-2">
            <a
              href="https://demo.hivesigner.com"
              target="_blank"
              class="text-black hover:underline mb-2"
            >Try demo</a>
          </p>
          <p>
            <a
              href="https://github.com/ledgerconnect/hivesigner.js/blob/master/docs/index.html"
              target="_blank"
              class="text-black hover:underline flex items-center"
            >
              <Icon name="github" class="mr-1" />
              See on GitHub
            </a>
          </p>
        </developer-item>
        <developer-item title="6. Other use cases" v-model="currentItem">
          <p class="my-2">
            Hivesigner auth tokens can be used in other ways to secure your apps. Imagehoster
            instances use it for verifying image uploads by user. You can use same method to secure
            your backends or you can also authenticate with Hivesigner for off-chain applications.
          </p>
          <p class="mb-2">
            <a
              href="https://github.com/ledgerconnect/hivesigner/wiki/What-other-ways-to-use-Hivesigner-auth%3F"
              target="_blank"
              class="text-black hover:underline"
            >Read more about it on our Wiki page</a>
          </p>
        </developer-item>
        <developer-item title="7. Contact us" v-model="currentItem">
          <p class="mb-2">
            If you believe you're experiencing a bug with our API or want to report incorrect
            documentation, open an issue on our issue tracker. For a more real-time avenue of
            communication, check out the official Discord server. There you'll find community
            members who can help answer questions about our API, libraries and other development
            questions.
          </p>
          <p v-if="pkg.bugs" class="mb-2">
            <a
              class="text-black hover:underline flex items-center"
              :href="pkg.bugs.url"
              target="_blank"
            >
              <Icon name="github" class="mr-1" />
              Report a bug
            </a>
          </p>
          <p class="mb-2">
            <a
              class="text-black hover:underline flex items-center"
              href="https://hive.hivesigner.com"
              target="_blank"
            >
              <Icon name="bookmark" class="mr-1" />
              Try interactive Hive API
            </a>
          </p>
          <p class="mb-2">
            <a
              class="text-black hover:underline flex items-center"
              href="https://discord.gg/pNJn7wh"
              target="_blank"
            >
              <Icon name="discord" class="mr-1" />
              Join us on Discord
            </a>
          </p>
        </developer-item>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import { PACKAGE } from '../consts'
import DeveloperItem from '../components/Developers/DeveloperItem.vue'
import Icon from '../components/UI/Icons/Icon.vue'

@Component({
  components: { Icon, DeveloperItem },
  layout: 'page',
})
export default class Developers extends Vue {
  private currentItem: string | null = null

  private get pkg() {
    return PACKAGE
  }
}
</script>
