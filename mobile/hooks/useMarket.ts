/**
 * Hooks PetMarket — produse + comenzi (flux cumpărător și vânzător).
 * TanStack Query v5: queries + mutations + invalidare cache.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { queries } from '../lib/supabase/queries';
import type {
  MarketFilters,
  MarketProductInput,
  MarketOrderInput,
  MarketOrderStatus,
  MarketProductStatus,
} from '@pawfectpair/shared';
import { useAuthStore } from '../store/auth.store';

export const MARKET_PRODUCTS_KEY = ['market', 'products'] as const;
export const MY_PRODUCTS_KEY = (uid: string) => ['market', 'my-products', uid] as const;
export const MY_ORDERS_KEY = (uid: string) => ['market', 'my-orders', uid] as const;
export const SELLER_ITEMS_KEY = (uid: string) => ['market', 'seller-items', uid] as const;

/** Produse active publice (filtre DB; text se filtrează local). */
export function useMarketProducts(filters: MarketFilters) {
  return useQuery({
    queryKey: [MARKET_PRODUCTS_KEY, filters.category ?? null, filters.condition ?? null],
    queryFn: () => queries.fetchMarketProducts(filters),
  });
}

/** Anunțurile mele (inclusiv vândute). */
export function useMyProducts() {
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useQuery({
    queryKey: MY_PRODUCTS_KEY(uid),
    queryFn: () => queries.fetchMyProducts(uid),
    enabled: !!uid,
  });
}

/** Comenzile mele ca cumpărător. */
export function useMyOrders() {
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useQuery({
    queryKey: MY_ORDERS_KEY(uid),
    queryFn: () => queries.fetchMyOrders(uid),
    enabled: !!uid,
  });
}

/** Liniile de comandă primite pe produsele mele (ca vânzător). */
export function useSellerOrderItems() {
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useQuery({
    queryKey: SELLER_ITEMS_KEY(uid),
    queryFn: () => queries.fetchSellerOrderItems(uid),
    enabled: !!uid,
  });
}

/** Reîmprospătează produsele/comenzile la revenirea pe ecran. */
export function useMarketRefreshOnFocus() {
  const qc = useQueryClient();
  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: ['market'] });
    }, [qc])
  );
}

export function useCreateProduct() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useMutation({
    mutationFn: (input: MarketProductInput) => {
      if (!uid) throw new Error('Nu ești autentificat');
      return queries.createMarketProduct(uid, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market'] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MarketProductInput }) =>
      queries.updateMarketProduct(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market'] }),
  });
}

export function useSetProductStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MarketProductStatus }) =>
      queries.setMarketProductStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market'] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => queries.deleteMarketProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market'] }),
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const uid = user?.id ?? '';
  return useMutation({
    mutationFn: (input: MarketOrderInput) => {
      if (!uid) throw new Error('Nu ești autentificat');
      return queries.createMarketOrder(uid, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market'] }),
  });
}

export function useSetOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MarketOrderStatus }) =>
      queries.setMarketOrderStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market'] }),
  });
}
