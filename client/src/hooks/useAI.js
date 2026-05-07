/**
 * client/src/hooks/useAI.js
 *
 * React hook wrapping all AI service endpoints.
 *
 * Usage:
 *   const { semanticSearch, enhanceListing, estimateTrade, loading, error } = useAI();
 */

import { useState, useCallback } from 'react';
import api from '../services/api';   // your existing axios instance

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const call = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'AI request failed';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Semantic search ─────────────────────────────────────────
  // Returns: { query, results: [{ id, title, relevance_score, ... }], total }
  const semanticSearch = useCallback((query, options = {}) =>
    call(() => api.post('/ai/search', {
      query,
      top_k:    options.topK    || 8,
      category: options.category || null,
    }).then(r => r.data)),
  [call]);

  // ── Listing enhancer ─────────────────────────────────────────
  // Returns: { enhanced_title, enhanced_description, suggested_tags, suggested_category }
  const enhanceListing = useCallback((title, description, options = {}) =>
    call(() => api.post('/ai/listings/enhance', {
      title,
      description,
      category:  options.category  || null,
      condition: options.condition || null,
    }).then(r => r.data)),
  [call]);

  // ── Trade fairness estimator ──────────────────────────────────
  // Returns: { verdict, confidence, explanation, suggested_adjustment, similar_trades }
  const estimateTrade = useCallback((offered, requested) =>
    call(() => api.post('/ai/trades/estimate', {
      offered_title:       offered.title,
      offered_description: offered.description,
      offered_value:       offered.estimatedValue || null,
      requested_title:       requested.title,
      requested_description: requested.description,
      requested_value:       requested.estimatedValue || null,
    }).then(r => r.data)),
  [call]);

  return { semanticSearch, enhanceListing, estimateTrade, loading, error };
}
