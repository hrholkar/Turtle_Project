import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { turtleService } from '../services/turtle.service';
import { dashboardService, sightingService, pendingService } from '../services/index';

// ── Query Keys ────────────────────────────────────────────────────────────────
export const QueryKeys = {
  dashboard: ['dashboard'] as const,
  speciesBreakdown: ['speciesBreakdown'] as const,
  turtles: (params?: object) => ['turtles', params] as const,
  turtle: (id: string) => ['turtle', id] as const,
  turtleSightings: (id: string) => ['turtleSightings', id] as const,
  sightings: (page?: number) => ['sightings', page] as const,
  recentSightings: ['recentSightings'] as const,
  pending: (status?: string) => ['pending', status] as const,
  pendingItem: (id: string) => ['pendingItem', id] as const,
};

// ── Dashboard Hooks ───────────────────────────────────────────────────────────
export function useDashboardStats() {
  return useQuery({
    queryKey: QueryKeys.dashboard,
    queryFn: dashboardService.getStats,
    staleTime: 30_000,
  });
}

export function useSpeciesBreakdown() {
  return useQuery({
    queryKey: QueryKeys.speciesBreakdown,
    queryFn: dashboardService.getSpeciesBreakdown,
    staleTime: 60_000,
  });
}

// ── Turtle Hooks ──────────────────────────────────────────────────────────────
export function useTurtles(params?: Parameters<typeof turtleService.getAll>[0]) {
  return useQuery({
    queryKey: QueryKeys.turtles(params),
    queryFn: () => turtleService.getAll(params),
  });
}

export function useTurtle(id: string) {
  return useQuery({
    queryKey: QueryKeys.turtle(id),
    queryFn: () => turtleService.getById(id),
    enabled: Boolean(id),
  });
}

export function useTurtleSightings(turtleId: string) {
  return useQuery({
    queryKey: QueryKeys.turtleSightings(turtleId),
    queryFn: () => turtleService.getSightings(turtleId),
    enabled: Boolean(turtleId),
  });
}

export function useDeleteTurtle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: turtleService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turtles'] });
      queryClient.invalidateQueries({ queryKey: QueryKeys.dashboard });
    },
  });
}

// ── Sighting Hooks ────────────────────────────────────────────────────────────
export function useRecentSightings(limit = 10) {
  return useQuery({
    queryKey: QueryKeys.recentSightings,
    queryFn: () => sightingService.getRecent(limit),
    staleTime: 15_000,
  });
}

export function useSightings(page = 1) {
  return useQuery({
    queryKey: QueryKeys.sightings(page),
    queryFn: () => sightingService.getAll(page),
  });
}

// ── Pending Hooks ─────────────────────────────────────────────────────────────
export function usePendingVerifications(status?: string) {
  return useQuery({
    queryKey: QueryKeys.pending(status),
    queryFn: () => pendingService.getAll(status),
    refetchInterval: 30_000,
  });
}

export function usePendingItem(id: string) {
  return useQuery({
    queryKey: QueryKeys.pendingItem(id),
    queryFn: () => pendingService.getById(id),
    enabled: Boolean(id),
  });
}

export function useApprovePending() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof pendingService.approve>[1] }) =>
      pendingService.approve(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending'] });
      queryClient.invalidateQueries({ queryKey: ['turtles'] });
      queryClient.invalidateQueries({ queryKey: QueryKeys.dashboard });
    },
  });
}

export function useRejectPending() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pendingService.reject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending'] });
      queryClient.invalidateQueries({ queryKey: QueryKeys.dashboard });
    },
  });
}
