<template>
  <div>
    <Header title="Developers"/>
    <div class="p-4 after-header">
      <div class="container-sm mx-auto mb-4">
        <p class="mb-4">
          You’ve found the HiveSigner developer documentation! This page dedicated to showing you
          all the ways that you can use HiveSigner to make cool stuff.
        </p>
        <developer-item title="1. Add new app" v-model="currentItem">
          <div class="mb-3">
            <p>
              To create a new app on HiveSigner you need a Hive account for it. If you don't have
              one yet you can create one on
              <a href="https://signup.hive.io" target="_blank">signup.hive.io</a> in with your app
              account and update your profile with "application" as account type.
            </p>
            <router-link to="/profile" class="btn btn-large">
              Enable app
            </router-link>
          </div>
          <p>
            If you would like to use the OAuth 2 API for posting with HiveSigner server you need to
            authorize the Hive account "hivesigner" to post on the behalf of your app account.
            <router-link to="/authorize/hivesigner">Click here</router-link>
            to do this and sign with your app account.
          </p>
        </developer-item>
        <developer-item title="2. Edit app settings" v-model="currentItem">
          <p>You can edit your app settings by updating your app account profile.</p>
          <router-link to="/profile" class="btn btn-large">
            Edit app settings
          </router-link>
        </developer-item>
        <developer-item title="3. Hivesigner JS SDK" v-model="currentItem">
          <p>
            Get started integrating HiveSigner on your website with HiveSigner.js, the official
            JavaScript SDK. Learn how to setup and use
            <a href="https://github.com/ledgerconnect/hivesigner.js#sdk-methods" target="_blank">
              SDK methods
            </a>.
          </p>
          <p>
            <a href="https://github.com/ledgerconnect/hivesigner.js#getting-started"
               target="_blank">
              <span class="iconfont icon-mark-github"/> hivesigner.js
            </a>
          </p>
        </developer-item>
        <developer-item title="4. How OAuth2 works" v-model="currentItem">
          <p>
            OAuth 2 is the industry-standard protocol for authorization. After you have checked
            above steps, You can read more about
            <a
              href="https://github.com/ledgerconnect/hivesigner/wiki/How-OAuth2-Work%3F"
              target="_blank"
            >
              authorization flow in our Wiki page
            </a>
          </p>
        </developer-item>
        <developer-item title="5. Demo app" v-model="currentItem">
          <p class="mt-2">Checkout HiveSigner demo with Vue.js</p>
          <p><a href="https://demo.hivesigner.com" target="_blank" class="mr-2">Try demo</a></p>
          <p>
            <a
              href="https://github.com/ledgerconnect/hivesigner.js/blob/master/docs/index.html"
              target="_blank"
            >
              <span class="iconfont icon-mark-github"/> See on GitHub
            </a>
          </p>
        </developer-item>
        <developer-item title="6. Other use cases" v-model="currentItem">
          <p class="mt-2">Checkout HiveSigner demo with Vue.js</p>
          <p><a href="https://demo.hivesigner.com" target="_blank" class="mr-2">Try demo</a></p>
          <p>
            <a
              href="https://github.com/ledgerconnect/hivesigner.js/blob/master/docs/index.html"
              target="_blank"
            >
              <span class="iconfont icon-mark-github"/> See on GitHub
            </a>
          </p>
        </developer-item>
        <developer-item title="7. Contact us" v-model="currentItem">
          <p>
            If you believe you're experiencing a bug with our API or want to report incorrect
            documentation, open an issue on our issue tracker. For a more real-time avenue of
            communication, check out the official Discord server. There you'll find community
            members who can help answer questions about our API, libraries and other development
            questions.
          </p>
          <p v-if="pkg.bugs">
            <a :href="pkg.bugs.url" target="_blank">
              <span class="iconfont icon-mark-github"/> Report a bug
            </a>
          </p>
          <p>
            <a href="https://hive.hivesigner.com" target="_blank">
              <span class="iconfont icon-bookmark"/> Try interactive Hive API
            </a>
          </p>
          <p>
            <a href="https://discord.gg/pNJn7wh" target="_blank">
              <span class="iconfont icon-discord"/> Join us on Discord
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
@Component({
  components: { DeveloperItem }
})
export default class Developers extends Vue {
  private currentItem: string | null = null

  private get pkg() {
    return PACKAGE
  }
}
</script>
