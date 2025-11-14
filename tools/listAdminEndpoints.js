const fs = require('fs');
const path = require('path');
const glob = require('glob');

const BACKEND_ROUTE_GLOB = 'backend/src/**/*.js';

function collectDashboardEndpoints() {
  const baseDir = path.join(process.cwd(), 'admin-dashboard', 'src');
  const files = glob.sync('**/*.{js,jsx}', { cwd: baseDir, absolute: true });

  const endpointUsage = new Map();

  const methodRegex = /api\.(get|post|put|patch|delete)\(\s*`?['"]([^'"`]+)['"]`?/g;

  files.forEach((file) => {
    const relPath = path.relative(baseDir, file);
    const content = fs.readFileSync(file, 'utf8');

    let match;
    while ((match = methodRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const rawUrl = match[2];

      // Skip template literals that we can't statically resolve
      if (rawUrl.includes('${')) {
        continue;
      }

      const key = `${method} ${rawUrl}`;
      if (!endpointUsage.has(key)) {
        endpointUsage.set(key, { count: 0, files: new Set() });
      }

      const entry = endpointUsage.get(key);
      entry.count += 1;
      entry.files.add(relPath);
    }
  });

  return Array.from(endpointUsage.entries())
    .map(([key, { count, files }]) => ({
      endpoint: key,
      count,
      files: Array.from(files).sort(),
    }))
    .sort((a, b) => a.endpoint.localeCompare(b.endpoint));
}

function collectBackendRoutes() {
  const baseDir = path.join(process.cwd(), 'backend', 'src');
  const files = glob.sync(BACKEND_ROUTE_GLOB, { absolute: true });

  const routeRegex = /router\.(get|post|put|patch|delete)\(\s*['"]([^'"`]+)['"]/g;
  const routeArrayRegex = /router\.(get|post|put|patch|delete)\(\s*\[([^\]]+)\]/g;
  const appRouteRegex = /app\.(get|post|put|patch|delete)\(\s*['"]([^'"`]+)['"]/g;
  const appRouteArrayRegex = /app\.(get|post|put|patch|delete)\(\s*\[([^\]]+)\]/g;

  const routes = [];

  const registerRoute = (method, pathValue, file, scope = 'router') => {
    routes.push({
      method: method.toUpperCase(),
      path: pathValue,
      file,
      scope,
    });
  };

  const extractArrayPaths = (arrayContent) => {
    const matches = arrayContent.match(/['"]([^'"`]+)['"]/g);
    if (!matches) return [];
    return matches.map((entry) => entry.slice(1, -1));
  };

  files.forEach((file) => {
    const relPath = path.relative(baseDir, file);
    const content = fs.readFileSync(file, 'utf8');

    let match;
    while ((match = routeRegex.exec(content)) !== null) {
      registerRoute(match[1], match[2], relPath);
    }

    while ((match = routeArrayRegex.exec(content)) !== null) {
      const method = match[1];
      const paths = extractArrayPaths(match[2]);
      paths.forEach((pathValue) => registerRoute(method, pathValue, relPath));
    }

    while ((match = appRouteRegex.exec(content)) !== null) {
      registerRoute(match[1], match[2], relPath, 'app');
    }

    while ((match = appRouteArrayRegex.exec(content)) !== null) {
      const method = match[1];
      const paths = extractArrayPaths(match[2]);
      paths.forEach((pathValue) => registerRoute(method, pathValue, relPath, 'app'));
    }
  });

  return routes;
}

function normalisePath(pathStr) {
  return pathStr.replace(/\?.*$/, '');
}

function candidatePaths(fullPath) {
  const candidates = new Set();
  const clean = normalisePath(fullPath);
  candidates.add(clean);

  if (clean.startsWith('/api')) {
    const withoutApi = clean.replace('/api', '') || '/';
    candidates.add(withoutApi);

    const parts = withoutApi.split('/').filter(Boolean);
    if (parts.length > 1) {
      const withoutFirstSegment = '/' + parts.slice(1).join('/');
      candidates.add(withoutFirstSegment);
    } else if (parts.length === 1) {
      candidates.add('/');
      candidates.add('/' + parts[0]);
    }
  }

  const parts = clean.split('/').filter(Boolean);
  if (parts.length > 1) {
    candidates.add('/' + parts.slice(1).join('/'));
    candidates.add('/' + parts[parts.length - 1]);
  } else if (parts.length === 1) {
    candidates.add('/');
    candidates.add('/' + parts[0]);
  }

  return Array.from(candidates);
}

function crossCheck(endpoints, backendRoutes) {
  const results = endpoints.map(({ endpoint, count, files }) => {
    const [method, fullPath] = endpoint.split(' ');
    const candidates = candidatePaths(fullPath);

    const matches = backendRoutes.filter((route) => {
      if (route.method !== method) return false;
      return candidates.includes(route.path);
    });

    return {
      endpoint,
      usageCount: count,
      files,
      backendMatches: matches.map(({ file, path: routePath, scope }) => ({
        file,
        routePath,
        scope: scope || 'router',
      })),
      found: matches.length > 0,
      candidates,
    };
  });

  return results;
}

if (require.main === module) {
  const endpoints = collectDashboardEndpoints();
  const backendRoutes = collectBackendRoutes();
  const results = crossCheck(endpoints, backendRoutes);
  console.log(JSON.stringify(results, null, 2));
}

module.exports = {
  collectDashboardEndpoints,
  collectBackendRoutes,
  crossCheck,
};

