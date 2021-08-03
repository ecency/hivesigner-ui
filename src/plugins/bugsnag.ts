import Bugsnag from '@bugsnag/js'
import BugsnagPluginVue from '@bugsnag/plugin-vue'

export default function () {
  if (process.env.NODE_ENV === 'production') {
    Bugsnag.start({
      apiKey: process.env.BUGSNAG_API_KEY as string,
      plugins: [new BugsnagPluginVue()]
    })
  }
}
