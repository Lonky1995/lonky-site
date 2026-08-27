// 加密货币市场广度看板数据类型
// 来源：VPS 端 market_breadth_dashboard.py 的 build() 输出 (data.json)
// 顶层字段契约相对稳定，深层嵌套字段较易变动，故只做浅层类型约束 + 可选链兜底

export type IntervalKey = "15m" | "1h" | "4h";

export interface StateInfo {
  label: string;
  code: string;
  confidence: number;
}

export interface IntervalMetrics {
  positive: number;
  beat_btc: number;
  up_volume: number;
  taker_buy_share: number;
  volume_expansion: number;
  above_ema20: number;
  above_ema50: number;
  above_ema200: number;
  trend: number;
  relative: number;
  participation: number;
  breadth: number;
  risk: number;
  btc_return: number;
  eth_btc_excess: number;
  dispersion: number;
  positive_count: number;
  positive_sample_count: number;
  beat_btc_count: number;
  beat_btc_sample_count: number;
  time: string;
  dispersion_percentile?: number;
  comparison?: Record<string, number | string>;
}

export interface ThresholdPolicy {
  schema_version?: string;
  version: string;
  status?: string;
  review_cadence: string;
  freeze_between_reviews: boolean;
  applies_to_intervals?: string[];
  effective_from_bjt?: string;
  next_review_bjt?: string;
}

export interface AlertStage {
  code: string;
  label: string;
  rank: number;
  description: string;
}

export interface UniverseInfo {
  source: string;
  rule: string;
  active_count: number;
  alt_count: number;
  binance_covered_count: number;
  okx_covered_count: number;
  dual_exchange_count: number;
}

export interface RotationContext {
  available: boolean;
  global_available: boolean;
  source: string;
  short_term_label: string;
  short_term_code: string;
  eth_btc: number;
  eth_btc_horizons: { window: string; hours: number; change_pct: number }[];
  btc_return_24h_pct: number;
  eth_return_24h_pct?: number;
  headline: string;
  daily_label?: string;
  daily_code?: string;
  btc_dominance_pct: number;
  btc_dominance_change_24h_pp_est?: number;
  total_market_cap_usd?: number;
  total_market_cap_change_24h_pct?: number;
  total3_market_cap_usd?: number;
  total3_btc_ratio?: number;
  total3_btc_change_24h_pct_est?: number;
  summary: string;
  method_note?: string;
}

export interface CapRange {
  group: string;
  count: number;
  min_usd: number;
  max_usd: number;
  median_usd: number;
}

export interface MarketCapGroupRow {
  group: string;
  count: number;
  [metric: string]: number | string;
}

export interface SelloffProfile {
  available: boolean;
  source: string;
  headline: string;
  code: string;
  summary: string;
  change_condition?: string;
  matched_count: number;
  universe_count: number;
  taker_coverage_count?: number;
  latest_open_utc?: string;
  latest_close_utc?: string;
  cap_ranges?: CapRange[];
  market_cap_groups?: MarketCapGroupRow[];
}

export interface HorizonMomentum {
  window: string;
  hours: number;
  current_start_utc?: string;
  current_end_utc?: string;
  previous_start_utc?: string;
  previous_end_utc?: string;
  spot_volume_usdt: number;
  spot_previous_volume_usdt: number;
  spot_change_pct: number;
  futures_volume_usdt: number;
  futures_previous_volume_usdt: number;
  futures_change_pct: number;
  spot_growth_lead_pp?: number;
  futures_spot_ratio?: number;
  ratio_change_pct?: number;
  leader_label?: string;
  leader_code?: string;
}

export interface Derivatives {
  available: boolean;
  coverage: number;
  sample_count: number;
  funding_median_pct: number;
  funding_extreme_share: number;
  funding_positive_extreme_share?: number;
  funding_negative_extreme_share?: number;
  oi_change_1h_median?: number;
  oi_change_4h_median?: number;
  oi_change_24h_median?: number;
  oi_change_3d_median?: number;
  oi_change_7d_median?: number;
  oi_rising_share_1h?: number;
  futures_spot_volume_ratio_7d?: number;
  futures_spot_volume_ratio_previous_7d?: number;
  futures_spot_volume_ratio_prior_30d?: number;
  primary_window?: string;
  spot_volume_3d_usdt?: number;
  futures_volume_3d_usdt?: number;
  horizon_momentum?: HorizonMomentum[];
}

export interface CrowdingBacktestBucket {
  events: number;
  median_forward_pct: number;
  adverse_rate_pct: number;
}

export interface CrowdingHorizon {
  window: string;
  hours: number;
  regime: string;
  regime_code: string;
  conclusion: string;
  leverage_heat: number;
  direction_score: number;
  oi_level_rel_30d_pct?: number;
  oi_level_percentile?: number;
  oi_change_pct?: number;
  oi_change_percentile?: number;
  price_return_pct?: number;
  funding_rate_pct?: number;
  funding_signed_score?: number;
  global_long_short_ratio?: number;
  global_signed_score?: number;
  taker_buy_share_pct?: number;
  taker_signed_score?: number;
  premium_pct?: number;
  okx?: Record<string, number>;
  cross_exchange_confirmation_count?: number;
  cross_exchange_confirmation_total?: number;
  backtest?: {
    forward_window: string;
    long_crowded: CrowdingBacktestBucket;
    short_crowded: CrowdingBacktestBucket;
    baseline_median_forward_pct: number;
  };
}

export interface BtcCrowding {
  available: boolean;
  headline: string;
  summary: string;
  backtest_conclusion?: string;
  primary_window: string;
  horizons: CrowdingHorizon[];
  binance_updated_at_utc?: string;
}

export interface OkxInfo {
  available: boolean;
  source: string;
  eligible_count: number;
  covered_count: number;
  coverage: number;
  errors?: string[];
}

export interface CrossExchangeTop20 {
  available: boolean;
  symbol_count: number;
  dual_exchange_count: number;
  binance_only_count: number;
  okx_only_count: number;
  driver_label: string;
  driver_code: string;
  spot_volume_3d_usdt?: number;
}

export interface ConfirmationSignal {
  label: string;
  code: string;
  tone: "positive" | "negative" | "warning" | "neutral" | string;
}

export interface Confirmations {
  capital: ConfirmationSignal;
  leverage: ConfirmationSignal;
  positioning: ConfirmationSignal;
  driver: ConfirmationSignal;
}

export interface Interpretation {
  title: string;
  conclusion: string;
  evidence: string;
  change: string;
}

export interface HistoryPoint {
  t: string;
  breadth: number;
  trend: number;
  relative: number;
  participation: number;
  risk: number;
  positive: number;
  beat_btc: number;
  volume_expansion: number;
}

export interface CohortHorizon {
  median_return: number;
  median_excess_btc: number;
  positive: number;
  beat_btc: number;
  beat_btc_count: number;
  beat_btc_sample_count: number;
  up_volume: number;
  down_volume: number;
}

export interface Cohort {
  name: string;
  count: number;
  horizons: Record<IntervalKey, CohortHorizon>;
  median_return: number;
  median_return_3h?: number;
  median_return_6h?: number;
  median_return_24h?: number;
  positive: number;
  beat_btc: number;
  up_volume: number;
  down_volume: number;
}

export interface SymbolMomentum {
  source: string;
  driver_label: string;
  driver_code: string;
  spot_avg_daily_volume_7d_usdt?: number;
  futures_avg_daily_volume_7d_usdt?: number;
  spot_growth_vs_30d_pct?: number;
  futures_growth_vs_30d_pct?: number;
  ratio_growth_vs_30d_pct?: number;
  spot_volume_3d_usdt?: number;
  futures_volume_3d_usdt?: number;
  horizons?: HorizonMomentum[];
}

export interface Top20Row {
  rank: number;
  symbol: string;
  contract_volume_rank?: number;
  quote_volume_24h_usdt: number;
  binance_quote_volume_24h_usdt?: number;
  okx_quote_volume_24h_usdt?: number;
  exchange_coverage: string;
  change_24h_pct: number;
  change_1h_pct: number;
  excess_btc_1h_pct?: number;
  binance_momentum?: SymbolMomentum;
  okx_momentum?: SymbolMomentum;
  combined_momentum?: Omit<SymbolMomentum, "source" | "driver_label" | "driver_code"> & {
    exchange_count?: number;
    exchange_label?: string;
  };
}

export interface CryptoBreadthPayload {
  generated_at_bjt: string;
  state: StateInfo;
  states: Record<IntervalKey, { label: string; code: string; confidence: number }>;
  state_evolution?: Record<string, unknown>;
  threshold_policy: ThresholdPolicy;
  alert_stage: AlertStage;
  universe: UniverseInfo;
  intervals: Record<IntervalKey, IntervalMetrics>;
  rotation_context: RotationContext;
  selloff_profile: SelloffProfile;
  derivatives: Derivatives;
  btc_crowding: BtcCrowding;
  okx: OkxInfo;
  cross_exchange_top20: CrossExchangeTop20;
  confirmations: Confirmations;
  interpretations: Interpretation[];
  history_1h: HistoryPoint[];
  cohorts: Cohort[];
  top20: Top20Row[];
}
