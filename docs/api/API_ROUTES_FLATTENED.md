# API Routes Update: Preferred Flat Paths

Date: 2025-11-14

## Live Streaming Routes (`/api/live`)
- `GET /` - Get live streams (preferred flat route)
- `GET /livestreams` - Get live streams (legacy nested route)
- `POST /start` - Start live stream (auth required)
- `POST /:streamId/join` - Join stream as viewer (auth required)
- `POST /:streamId/gift` - Send gift during stream (auth required)
- `POST /:streamId/end` - End stream (broadcaster auth)

## Coins Routes (`/api/coins`)
- `GET /packages` - List active coin packages (preferred flat route)
- `GET /coins/packages` - List active coin packages (legacy nested route)

## Preferred vs Legacy Paths
- Preferred flat paths are used going forward for consistency:
  - `/api/live` (preferred) vs `/api/live/livestreams` (legacy)
  - `/api/coins/packages` (preferred) vs `/api/coins/coins/packages` (legacy)
- Legacy routes remain active for backward compatibility.

## Notes
- Tests updated to prefer flat paths with fallback to legacy.
- Existing clients can migrate at their own pace.
