"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { getStale, setCache, getCached } from "@/lib/cache";

export function useFetch<T>(fetcher: () => Promise<T>, cacheKey?: string) {
  const stale = cacheKey ? getStale<T>(cacheKey) : null;
  const fresh = cacheKey ? getCached<T>(cacheKey) : null;

  const [data, setData] = useState<T | null>(stale);
  const [loading, setLoading] = useState(!fresh);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    if (!mountedRef.current) return;
    // Only show loading spinner if we have no data at all
    if (!data) setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (!mountedRef.current) return;
      setData(result);
      if (cacheKey) setCache(cacheKey, result);
    } catch (e: unknown) {
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [fetcher, cacheKey]);

  useEffect(() => {
    mountedRef.current = true;
    // If we have fresh cached data, skip fetch
    if (fresh) {
      setData(fresh);
      setLoading(false);
    } else {
      load();
    }
    return () => { mountedRef.current = false; };
  }, [load]);

  return { data, setData, loading, error, refetch: load };
}
