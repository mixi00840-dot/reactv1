import React, { useEffect, useState } from 'react';
import { Tooltip, Chip } from '@mui/material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://mixillo-backend-52242135857.europe-west1.run.app/api';

export default function ApiHealth() {
  const [health, setHealth] = useState({ api: null, db: null });

  useEffect(() => {
    let cancelled = false;
    const fetchHealth = async () => {
      try {
        // Check backend health endpoint (without /api prefix since it's in baseURL)
        const response = await axios.get(API_BASE_URL.replace('/api', '/health'));
        
        if (!cancelled && response.data) {
          const isApiOk = response.data.status === 'ok';
          const isDbOk = response.data.mongodb?.connected === true;
          setHealth({ api: isApiOk, db: isDbOk });
        }
      } catch (_) {
        if (!cancelled) setHealth({ api: false, db: false });
      }
    };
    fetchHealth();
    const t = setInterval(fetchHealth, 30000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const label = health.api === null ? 'Checking API…' : `API:${health.api ? 'OK' : 'DOWN'} · MongoDB:${health.db ? 'OK' : 'ISSUE'}`;
  const color = health.api && health.db ? 'success' : 'warning';

  return (
    <Tooltip title={label}>
      <Chip size="small" label={health.api && health.db ? 'Live' : 'Degraded'} color={color} />
    </Tooltip>
  );
}
