import { Module, VuexModule } from 'nuxt-property-decorator'

@Module({
  stateFactory: true,
  namespaced: true,
  name: 'auth',
})
export default class Auth extends VuexModule {
}
