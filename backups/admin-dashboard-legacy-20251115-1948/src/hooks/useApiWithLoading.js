import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook for API calls with loading states and error handling
 */
export const useApiWithLoading = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiCall, options = {}) => {
    const {
      showSuccessToast = false,
      successMessage = 'Operation successful',
      showErrorToast = true,
      errorMessage = 'An error occurred',
      onSuccess,
      onError
    } = options;

    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      
      if (showSuccessToast) {
        toast.success(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      console.error('API Error:', err);
      
      const errorMsg = err.response?.data?.message || 
                      err.message || 
                      errorMessage;
      
      setError(errorMsg);
      
      if (showErrorToast) {
        toast.error(errorMsg);
      }
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, execute };
};

/**
 * Hook for data fetching with loading states
 */
export const useFetch = (apiCall, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []);

  useState(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await apiCall();
        setData(result);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.response?.data?.message || err.message || 'Error fetching data');
        toast.error('Error loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [...dependencies, refetchTrigger]);

  return { data, loading, error, refetch };
};

export default useApiWithLoading;

