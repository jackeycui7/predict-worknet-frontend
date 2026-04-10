import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import {
  useGetFeedStats as _useGetFeedStats,
  useGetFeedLive as _useGetFeedLive,
  useGetCurrentEpoch as _useGetCurrentEpoch,
  useGetActiveMarkets as _useGetActiveMarkets,
  useGetResolvedMarkets as _useGetResolvedMarkets,
  useGetMarketById as _useGetMarketById,
  useGetMarketOrderbook as _useGetMarketOrderbook,
  useGetMarketPriceHistory as _useGetMarketPriceHistory,
  useGetMarketKlines as _useGetMarketKlines,
  useGetMarketPredictions as _useGetMarketPredictions,
  useGetLeaderboard as _useGetLeaderboard,
  useGetLeaderboardLive as _useGetLeaderboardLive,
  useGetLeaderboardPersonas as _useGetLeaderboardPersonas,
  useGetAgentByAddress as _useGetAgentByAddress,
  useGetAgentEquityCurve as _useGetAgentEquityCurve,
  useGetAgentPredictions as _useGetAgentPredictions,
  useGetEpochs as _useGetEpochs,
  useGetEpochById as _useGetEpochById,
  useGetHighlights as _useGetHighlights,
  useHealthCheck as _useHealthCheck,
  getGetFeedStatsQueryKey,
  getGetFeedLiveQueryKey,
  getGetCurrentEpochQueryKey,
  getGetActiveMarketsQueryKey,
  getGetResolvedMarketsQueryKey,
  getGetMarketByIdQueryKey,
  getGetMarketOrderbookQueryKey,
  getGetMarketPriceHistoryQueryKey,
  getGetMarketKlinesQueryKey,
  getGetMarketPredictionsQueryKey,
  getGetLeaderboardQueryKey,
  getGetLeaderboardLiveQueryKey,
  getGetLeaderboardPersonasQueryKey,
  getGetAgentByAddressQueryKey,
  getGetAgentEquityCurveQueryKey,
  getGetAgentPredictionsQueryKey,
  getGetEpochsQueryKey,
  getGetEpochByIdQueryKey,
  getGetHighlightsQueryKey,
  getHealthCheckQueryKey,
} from "@workspace/api-client-react";

import type {
  FeedStats,
  FeedLiveItem,
  CurrentEpoch,
  MarketItem,
  MarketDetail,
  OrderbookDepth,
  PriceHistoryPoint,
  KlinePoint,
  MarketPredictionsResponse,
  LeaderboardResponse,
  LiveLeaderboardEntry,
  PersonaStats,
  AgentProfile,
  AgentEquityCurve,
  AgentPredictionsResponse,
  EpochListResponse,
  EpochDetail,
  HighlightItem,
  ResolvedMarketsResponse,
  HealthStatus,
  GetFeedLiveParams,
  GetResolvedMarketsParams,
  GetMarketPredictionsParams,
  GetLeaderboardParams,
  GetLeaderboardLiveParams,
  GetAgentEquityCurveParams,
  GetAgentPredictionsParams,
  GetEpochsParams,
  GetHighlightsParams,
} from "@workspace/api-client-react";

import {
  mockFeedStats,
  mockFeedLive,
  mockCurrentEpoch,
  mockActiveMarkets,
  mockResolvedMarkets,
  mockMarketDetail,
  mockOrderbook,
  mockPriceHistory,
  mockKlines,
  mockMarketPredictions,
  mockLeaderboard,
  mockLeaderboardLive,
  mockPersonas,
  mockAgentProfile,
  mockAgentEquityCurve,
  mockAgentPredictions,
  mockEpochs,
  mockEpochDetail,
  mockHighlights,
} from "./mock-data";

const USE_MOCK = true;

function useMockQuery<T>(key: readonly unknown[], fn: () => T, interval?: number): UseQueryResult<T> {
  return useQuery({
    queryKey: key,
    queryFn: () => Promise.resolve(fn()),
    refetchInterval: interval,
    staleTime: interval ?? 30000,
  }) as UseQueryResult<T>;
}

export function useHealthCheck(opts?: any) {
  if (USE_MOCK) return useMockQuery(["healthz", "mock"], () => ({ status: "ok" } as HealthStatus));
  return _useHealthCheck(opts);
}

export function useGetFeedStats(opts?: any) {
  if (USE_MOCK) return useMockQuery(getGetFeedStatsQueryKey(), () => mockFeedStats, 30000);
  return _useGetFeedStats(opts);
}

export function useGetFeedLive(params?: GetFeedLiveParams, opts?: any) {
  if (USE_MOCK) return useMockQuery(getGetFeedLiveQueryKey(params), () => mockFeedLive(params?.limit ?? 20), 5000);
  return _useGetFeedLive(params, opts);
}

export function useGetCurrentEpoch(opts?: any) {
  if (USE_MOCK) return useMockQuery(getGetCurrentEpochQueryKey(), () => mockCurrentEpoch, 30000);
  return _useGetCurrentEpoch(opts);
}

export function useGetActiveMarkets(opts?: any) {
  if (USE_MOCK) return useMockQuery(getGetActiveMarketsQueryKey(), () => mockActiveMarkets(), 15000);
  return _useGetActiveMarkets(opts);
}

export function useGetResolvedMarkets(params?: GetResolvedMarketsParams, opts?: any) {
  if (USE_MOCK) return useMockQuery(getGetResolvedMarketsQueryKey(params), () => mockResolvedMarkets(params?.limit ?? 50, params?.offset ?? 0));
  return _useGetResolvedMarkets(params, opts);
}

export function useGetMarketById(id: string, opts?: any) {
  if (USE_MOCK) return useMockQuery(getGetMarketByIdQueryKey(id), () => mockMarketDetail(id), 10000);
  return _useGetMarketById(id, opts);
}

export function useGetMarketOrderbook(id: string, opts?: any) {
  if (USE_MOCK) return useMockQuery(getGetMarketOrderbookQueryKey(id), () => mockOrderbook(id), 5000);
  return _useGetMarketOrderbook(id, opts);
}

export function useGetMarketPriceHistory(id: string, opts?: any) {
  if (USE_MOCK) return useMockQuery(getGetMarketPriceHistoryQueryKey(id), () => mockPriceHistory(id), 10000);
  return _useGetMarketPriceHistory(id, opts);
}

export function useGetMarketKlines(id: string, opts?: any) {
  if (USE_MOCK) return useMockQuery(getGetMarketKlinesQueryKey(id), () => mockKlines(id));
  return _useGetMarketKlines(id, opts);
}

export function useGetMarketPredictions(id: string, params?: GetMarketPredictionsParams, opts?: any) {
  if (USE_MOCK) return useMockQuery(getGetMarketPredictionsQueryKey(id, params), () => mockMarketPredictions(params?.limit ?? 50, params?.offset ?? 0));
  return _useGetMarketPredictions(id, params, opts);
}

export function useGetLeaderboard(params?: GetLeaderboardParams, opts?: any) {
  if (USE_MOCK) return useMockQuery(getGetLeaderboardQueryKey(params), () => mockLeaderboard(params?.limit ?? 50, params?.offset ?? 0), 60000);
  return _useGetLeaderboard(params, opts);
}

export function useGetLeaderboardLive(params?: GetLeaderboardLiveParams, opts?: any) {
  if (USE_MOCK) return useMockQuery(getGetLeaderboardLiveQueryKey(params), () => mockLeaderboardLive(params?.limit ?? 50), 15000);
  return _useGetLeaderboardLive(params, opts);
}

export function useGetLeaderboardPersonas(opts?: any) {
  if (USE_MOCK) return useMockQuery(getGetLeaderboardPersonasQueryKey(), () => mockPersonas(), 60000);
  return _useGetLeaderboardPersonas(opts);
}

export function useGetAgentByAddress(address: string, opts?: any) {
  if (USE_MOCK) return useMockQuery(getGetAgentByAddressQueryKey(address), () => mockAgentProfile(address));
  return _useGetAgentByAddress(address, opts);
}

export function useGetAgentEquityCurve(address: string, params?: GetAgentEquityCurveParams, opts?: any) {
  if (USE_MOCK) return useMockQuery(getGetAgentEquityCurveQueryKey(address, params), () => mockAgentEquityCurve(address));
  return _useGetAgentEquityCurve(address, params, opts);
}

export function useGetAgentPredictions(address: string, params?: GetAgentPredictionsParams, opts?: any) {
  if (USE_MOCK) return useMockQuery(getGetAgentPredictionsQueryKey(address, params), () => mockAgentPredictions(params?.limit ?? 50, params?.offset ?? 0));
  return _useGetAgentPredictions(address, params, opts);
}

export function useGetEpochs(params?: GetEpochsParams, opts?: any) {
  if (USE_MOCK) return useMockQuery(getGetEpochsQueryKey(params), () => mockEpochs(params?.limit ?? 20, params?.offset ?? 0));
  return _useGetEpochs(params, opts);
}

export function useGetEpochById(id: number, opts?: any) {
  if (USE_MOCK) return useMockQuery(getGetEpochByIdQueryKey(id), () => mockEpochDetail(id));
  return _useGetEpochById(id, opts);
}

export function useGetHighlights(params?: GetHighlightsParams, opts?: any) {
  if (USE_MOCK) return useMockQuery(getGetHighlightsQueryKey(params), () => mockHighlights(), 60000);
  return _useGetHighlights(params, opts);
}

export {
  getGetFeedStatsQueryKey,
  getGetFeedLiveQueryKey,
  getGetCurrentEpochQueryKey,
  getGetActiveMarketsQueryKey,
  getGetResolvedMarketsQueryKey,
  getGetMarketByIdQueryKey,
  getGetMarketOrderbookQueryKey,
  getGetMarketPriceHistoryQueryKey,
  getGetMarketKlinesQueryKey,
  getGetMarketPredictionsQueryKey,
  getGetLeaderboardQueryKey,
  getGetLeaderboardLiveQueryKey,
  getGetLeaderboardPersonasQueryKey,
  getGetAgentByAddressQueryKey,
  getGetAgentEquityCurveQueryKey,
  getGetAgentPredictionsQueryKey,
  getGetEpochsQueryKey,
  getGetEpochByIdQueryKey,
  getGetHighlightsQueryKey,
  getHealthCheckQueryKey,
};

export type {
  FeedStats,
  FeedLiveItem,
  CurrentEpoch,
  MarketItem,
  MarketDetail,
  OrderbookDepth,
  PriceHistoryPoint,
  KlinePoint,
  MarketPredictionsResponse,
  LeaderboardResponse,
  LiveLeaderboardEntry,
  PersonaStats,
  AgentProfile,
  AgentEquityCurve,
  AgentPredictionsResponse,
  EpochListResponse,
  EpochDetail,
  HighlightItem,
  ResolvedMarketsResponse,
  HealthStatus,
  PredictionItem,
  LeaderboardEntry,
  AgentPredictionItem,
  EpochSummary,
} from "@workspace/api-client-react";
