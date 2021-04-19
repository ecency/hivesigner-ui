<template>
  <div class="footer text-gray-400 mb-4">
    <ul class="flex justify-center flex-wrap my-1">
      <li class="inline mx-2">
        <router-link to="/apps" class="hover:underline">{{ $t('footer.apps') }}</router-link>
      </li>
      <li class="inline mx-2">
        <router-link to="/accounts" class="hover:underline">
          {{ $t('footer.accounts') }}
        </router-link>
      </li>
      <li class="inline mx-2">
        <router-link to="/settings" class="hover:underline">
          {{ $t('footer.settings') }}
        </router-link>
      </li>
      <li class="inline mx-2">
        <router-link to="/developers" class="hover:underline">
          {{ $t('footer.developers') }}
        </router-link>
      </li>
      <li class="inline mx-2">
        <router-link to="/about" class="hover:underline">
          {{ $t('footer.about') }}
        </router-link>
      </li>
    </ul>
  </div>
</template>
