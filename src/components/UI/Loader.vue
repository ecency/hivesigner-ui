<template functional>
  <div class="loader flex items-center justify-center z-10" :class="data.staticClass">
    <div class="spin"></div>
  </div>
</template>
<style lang="scss">
.loader {
  &.fixed {
    @apply bg-white bg-opacity-95 top-0 bottom-0 left-0 right-0;
  }

  .spin {
    border-right-color: #2c3e50;
    border-bottom-color: #2c3e50;
    width: 24px;
    height: 24px;

    @apply rounded-full border-2 duration-700 animate-spin;
  }
}
</style>
