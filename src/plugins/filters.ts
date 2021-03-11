import Vue from 'vue'
import { dateHeader, parseURL, pretty } from './filter-functions'

Vue.filter('dateHeader', dateHeader)
Vue.filter('parseUrl', parseURL)
Vue.filter('pretty', pretty)
