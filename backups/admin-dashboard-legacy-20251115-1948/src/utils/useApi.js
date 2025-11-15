import { useCallback, useState } from 'react';
import api from './api';

export default function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn(api);
      return result;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { api, loading, error, run };
}
