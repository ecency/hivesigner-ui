import { GetVestsToSpProperties } from '~/models'

export function getVestsToSP (properties: GetVestsToSpProperties): number {
  return (
    parseFloat(properties.total_vesting_fund_hive) / parseFloat(properties.total_vesting_shares)
  )
}
