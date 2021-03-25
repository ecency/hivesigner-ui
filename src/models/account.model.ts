export interface Account {
  id: number
  name: string
  owner: {
    weight_threshold: number
    account_auths: any[]
    key_auths: [string, number][]
  }
  active: {
    weight_threshold: number
    account_auths: any[]
    key_auths: [string, number][]
  }
  posting: {
    weight_threshold: number
    account_auths: any[]
    key_auths: [string, number][]
  }
  memo_key: string
  json_metadata: string
  posting_json_metadata: string
  proxy: string
  last_owner_update: string // UTC
  last_account_update: string // UTC
  created: string // UTC
  mined: boolean
  recovery_account: string
  last_account_recovery: string // UTC
  reset_account: string
  comment_count: number
  lifetime_vote_count: number
  post_count: number
  can_vote: boolean
  voting_manabar: {
    current_mana: number
    last_update_time: number
  }
  downvote_manabar: {
    current_mana: number
    last_update_time: number
  }
  voting_power: number
  balance: string
  savings_balance: string
  hbd_balance: string
  hbd_seconds: string
  hbd_seconds_last_update: string // UTC
  hbd_last_interest_payment: string
  savings_hbd_balance: string
  savings_hbd_seconds: string
  savings_hbd_seconds_last_update: string // UTC
  savings_hbd_last_interest_payment: string // UTC
  savings_withdraw_requests: number
  reward_hbd_balance: string
  reward_hive_balance: string
  reward_vesting_balance: string
  reward_vesting_hive: string
  vesting_shares: string
  delegated_vesting_shares: string
  received_vesting_shares: string
  vesting_withdraw_rate: string
  post_voting_power: string
  next_vesting_withdrawal: string // UTC
  withdrawn: number
  to_withdraw: number
  withdraw_routes: number
  pending_transfers: number
  curation_rewards: number
  posting_rewards: number
  proxied_vsf_votes: number[]
  witnesses_voted_for: number
  last_post: string // UTC
  last_root_post: string // UTC
  last_vote_time: string // UTC
  post_bandwidth: number
  pending_claimed_accounts: number
  delayed_votes: any[]
  vesting_balance: string
  reputation: number
  transfer_history: any[]
  market_history: any[]
  post_history: any[]
  vote_history: any[]
  other_history: any[]
  witness_votes: any[]
  tags_usage: any[]
  guest_bloggers: any[]
}
