<template>
  <div class="header border-bottom">
    <router-link class="px-4 py-3 border-right" to="/">
      <span class="iconfont icon-hivesigner primary-color"></span>
    </router-link>
    <slot>
      <h5>{{ title }}</h5>
    </slot>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'nuxt-property-decorator'

@Component
export default class Header extends Vue {
  @Prop({
    type: String,
    default: '',
  })
  private title!: string
}
</script>

<style lang="scss" scoped>
  @import "../assets/scss/vars";
  @import "../assets/scss/mixins";

  .header {
    position: fixed;
    z-index: 100;
    top: 0;
    width: 100%;
    height: $header-height;
    background-color: $header-bg;
    display: flex;
    align-items: center;
    transition: width 0.3s;

    @include bpSmall {
      position: relative;
    }

    & > button {
      line-height: 22px;
      background: none;
      border: none;
      outline: none;

      @include bpSmall {
        display: none;
      }

      & > .iconfont {
        color: $border-color !important;
        font-size: 20px;
      }
    }

    & > h5 {
      margin: 0 0 0 16px;
    }
  }
</style>
