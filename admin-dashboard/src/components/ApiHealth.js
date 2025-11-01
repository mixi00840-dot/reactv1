import React, { useEffect, useState } from 'react';
import { Tooltip, Chip } from '@mui/material';
import api from '../utils/api';

const statusColor = (ok) => (ok ? 'success' : 'error');

export default function ApiHealth() {
  const [health, setHealth] = useState({ api: null, db: null });

  useEffect(() => {
    let cancelled = false;
    const fetchHealth = async () => {
      try {
        const [apiOk, dbRes] = await Promise.all([
          api.get('/health').then(() => true).catch(() => false),
          api.get('/api/health/db').catch(() => ({ status: 'error' })),
        ]);
        if (!cancelled) setHealth({ api: apiOk, db: dbRes?.status === 'ok' });
      } catch (_) {
        if (!cancelled) setHealth({ api: false, db: false });
      }
    };
    fetchHealth();
    const t = setInterval(fetchHealth, 30000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const label = health.api === null ? 'Checking API…' : `API:${health.api ? 'OK' : 'DOWN'} · DB:${health.db ? 'OK' : 'ISSUE'}`;
  const color = health.api && health.db ? 'success' : 'warning';

  return (
    <Tooltip title={label}>
      <Chip size="small" label={health.api && health.db ? 'Live' : 'Degraded'} color={color} />
    </Tooltip>
  );
}
