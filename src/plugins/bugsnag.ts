import Bugsnag from '@bugsnag/js'
import BugsnagPluginVue from '@bugsnag/plugin-vue'

if (process.env.NODE_ENV === 'production' && process.env.BUGSNAG_API_KEY) {
  Bugsnag.start({
    apiKey: process.env.BUGSNAG_API_KEY as string,
    plugins: [new BugsnagPluginVue()]
  })
}
export default Bugsnag
