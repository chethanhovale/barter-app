/**
 * client/src/hooks/useRecommendations.js
 *
 * Hook for all three recommendation types.
 *
 * Usage:
 *   const { forYou, similar, mutual, loading } = useRecommendations(userId);
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export function useRecommendations(userId) {
  const [forYou,  setForYou]  = useState([]);
  const [mutual,  setMutual]  = useState([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const fetchForYou = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/ai/recommendations/${userId}`);
      setForYou(data.recommendations || []);
      setSummary(data.profile_summary || '');
    } catch (err) {
      setError('Could not load recommendations');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchMutual = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await api.get(`/ai/recommendations/${userId}/mutual`);
      setMutual(data.recommendations || []);
    } catch {}
  }, [userId]);

  const fetchSimilar = useCallback(async (listingId) => {
    if (!userId || !listingId) return [];
    try {
      const { data } = await api.get(
        `/ai/recommendations/${userId}/similar/${listingId}`
      );
      return data.recommendations || [];
    } catch {
      return [];
    }
  }, [userId]);

  useEffect(() => {
    fetchForYou();
    fetchMutual();
  }, [fetchForYou, fetchMutual]);

  return {
    forYou, mutual, summary, loading, error,
    fetchSimilar, refresh: fetchForYou,
  };
}
