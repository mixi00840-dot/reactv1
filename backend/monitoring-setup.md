# 🔍 MONITORING & OBSERVABILITY SETUP

## Complete Guide to Production Monitoring

---

## 📊 CLOUD MONITORING (GOOGLE CLOUD)

### Step 1: Enable Monitoring API
```bash
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com
gcloud services enable cloudtrace.googleapis.com
```

### Step 2: Create Custom Metrics

**Backend Health Metric:**
```javascript
// Add to backend/src/app.js
const { Monitoring } = require('@google-cloud/monitoring');
const client = new Monitoring.MetricServiceClient();

// Record custom metric
async function recordMetric(metricType, value) {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'mixillo';
  const dataPoint = {
    interval: {
      endTime: {
        seconds: Date.now() / 1000,
      },
    },
    value: {
      doubleValue: value,
    },
  };

  const timeSeriesData = {
    metric: {
      type: `custom.googleapis.com/${metricType}`,
    },
    resource: {
      type: 'generic_task',
      labels: {
        project_id: projectId,
        location: 'europe-west1',
        namespace: 'mixillo-backend',
        task_id: 'backend',
      },
    },
    points: [dataPoint],
  };

  const request = {
    name: client.projectPath(projectId),
    timeSeries: [timeSeriesData],
  };

  await client.createTimeSeries(request);
}

// Usage examples:
// recordMetric('api/request_count', 1);
// recordMetric('api/response_time', 145);
// recordMetric('mongodb/connection_count', 5);
```

### Step 3: Create Alerting Policies

**High Error Rate Alert:**
```bash
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=300s \
  --condition-expression='
    resource.type="cloud_run_revision" AND
    metric.type="run.googleapis.com/request_count" AND
    metric.label.response_code_class="5xx"
  '
```

**High Response Time Alert:**
```bash
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High Response Time" \
  --condition-display-name="Response time > 1s" \
  --condition-threshold-value=1000 \
  --condition-threshold-duration=300s \
  --condition-expression='
    resource.type="cloud_run_revision" AND
    metric.type="run.googleapis.com/request_latencies"
  '
```

**MongoDB Connection Alert:**
```bash
# Create custom metric first, then alert on it
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="MongoDB Connection Lost" \
  --condition-display-name="MongoDB disconnected" \
  --condition-threshold-value=0 \
  --condition-threshold-duration=60s \
  --condition-expression='
    resource.type="generic_task" AND
    metric.type="custom.googleapis.com/mongodb/connection_status"
  '
```

### Step 4: Create Dashboard

```bash
# Create dashboard.json with:
{
  "displayName": "Mixillo Backend Dashboard",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Request Rate",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\" metric.type=\"run.googleapis.com/request_count\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_RATE"
                  }
                }
              }
            }]
          }
        }
      },
      {
        "xPos": 6,
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Response Time (p95)",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\" metric.type=\"run.googleapis.com/request_latencies\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_DELTA",
                    "crossSeriesReducer": "REDUCE_PERCENTILE_95"
                  }
                }
              }
            }]
          }
        }
      },
      {
        "yPos": 4,
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Error Rate",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\" metric.type=\"run.googleapis.com/request_count\" metric.label.response_code_class=\"5xx\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_RATE"
                  }
                }
              }
            }]
          }
        }
      },
      {
        "xPos": 6,
        "yPos": 4,
        "width": 6,
        "height": 4,
        "widget": {
          "title": "MongoDB Connections",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"generic_task\" metric.type=\"custom.googleapis.com/mongodb/connection_count\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_MEAN"
                  }
                }
              }
            }]
          }
        }
      }
    ]
  }
}

# Apply dashboard:
gcloud monitoring dashboards create --config-from-file=dashboard.json
```

---

## 🔔 SENTRY ERROR TRACKING

### Step 1: Install Sentry
```bash
cd backend
npm install @sentry/node @sentry/tracing
```

### Step 2: Initialize Sentry

**backend/src/utils/sentry.js:**
```javascript
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');

function initSentry(app) {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'production',
      tracesSampleRate: 0.1, // 10% of transactions
      
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Tracing.Integrations.Express({ app }),
        new Tracing.Integrations.Mongo({
          useMongoose: true
        }),
      ],

      beforeSend(event, hint) {
        // Don't send 404 errors
        if (event.exception) {
          const error = hint.originalException;
          if (error && error.statusCode === 404) {
            return null;
          }
        }
        return event;
      },
    });

    console.log('✅ Sentry initialized');
  }
}

module.exports = { initSentry, Sentry };
```

### Step 3: Add to Express App

**backend/src/app.js:**
```javascript
const { initSentry, Sentry } = require('./utils/sentry');

// Initialize Sentry FIRST
initSentry(app);

// Request handler (must be first)
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// ... your routes ...

// Error handler (must be last)
app.use(Sentry.Handlers.errorHandler());
```

### Step 4: Manual Error Reporting
```javascript
// In any route or middleware:
try {
  // ... code ...
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      section: 'payments',
      action: 'create-intent'
    },
    extra: {
      userId: req.user?.id,
      amount: req.body.amount
    }
  });
  
  res.status(500).json({ success: false, message: 'Error' });
}
```

---

## 📧 ALERTING SETUP

### Email Notifications

**Create Notification Channel:**
```bash
gcloud alpha monitoring channels create \
  --display-name="Engineering Team Email" \
  --type=email \
  --channel-labels=email_address=engineering@mixillo.com
```

**Get Channel ID:**
```bash
gcloud alpha monitoring channels list
```

### Slack Notifications

1. Create Slack Webhook URL
2. Create notification channel:
```bash
gcloud alpha monitoring channels create \
  --display-name="Engineering Slack" \
  --type=slack \
  --channel-labels=url=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### PagerDuty Integration

```bash
gcloud alpha monitoring channels create \
  --display-name="PagerDuty" \
  --type=pagerduty \
  --channel-labels=service_key=YOUR_PAGERDUTY_SERVICE_KEY
```

---

## 🔍 LOG AGGREGATION

### Cloud Logging Queries

**View All Errors:**
```
resource.type="cloud_run_revision"
severity>=ERROR
```

**View Authentication Failures:**
```
resource.type="cloud_run_revision"
jsonPayload.message=~"authentication.*failed"
```

**View Slow Queries:**
```
resource.type="cloud_run_revision"
jsonPayload.duration>1000
```

**Create Log-Based Metric:**
```bash
gcloud logging metrics create high_error_rate \
  --description="High error rate alert" \
  --log-filter='resource.type="cloud_run_revision" AND severity>=ERROR'
```

---

## 📊 UPTIME MONITORING

### Create Uptime Check

```bash
gcloud monitoring uptime create \
  --display-name="Mixillo API Health Check" \
  --resource-type=uptime-url \
  --host=mixillo-backend-52242135857.europe-west1.run.app \
  --path=/health \
  --port=443 \
  --check-interval=60s \
  --timeout=10s
```

### MongoDB Connection Uptime Check
```bash
gcloud monitoring uptime create \
  --display-name="MongoDB Connection Check" \
  --resource-type=uptime-url \
  --host=mixillo-backend-52242135857.europe-west1.run.app \
  --path=/health \
  --port=443 \
  --check-interval=60s \
  --timeout=10s \
  --content-type=json \
  --custom-content-matcher='$.mongodb.connected == true'
```

---

## 🔄 BACKUP VERIFICATION SCRIPT

**backend/scripts/verify-backups.js:**
```javascript
const mongoose = require('mongoose');
const axios = require('axios');

async function verifyBackups() {
  console.log('🔍 Starting backup verification...\n');

  // 1. Verify MongoDB Atlas Backups
  console.log('1. Checking MongoDB Atlas backups...');
  const atlasApiKey = process.env.ATLAS_API_KEY;
  const atlasApiSecret = process.env.ATLAS_API_SECRET;
  const projectId = process.env.ATLAS_PROJECT_ID;
  const clusterName = 'mixillo';

  try {
    const response = await axios.get(
      `https://cloud.mongodb.com/api/atlas/v1.0/groups/${projectId}/clusters/${clusterName}/backup/snapshots`,
      {
        auth: {
          username: atlasApiKey,
          password: atlasApiSecret
        }
      }
    );

    const backups = response.data.results;
    console.log(`   ✅ Found ${backups.length} backups`);
    console.log(`   ✅ Latest backup: ${backups[0]?.createdDate || 'N/A'}\n`);
  } catch (error) {
    console.error('   ❌ Error checking backups:', error.message, '\n');
  }

  // 2. Verify Database Integrity
  console.log('2. Verifying database integrity...');
  await mongoose.connect(process.env.MONGODB_URI);

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(`   ✅ Found ${collections.length} collections`);

  for (const collection of collections) {
    const count = await mongoose.connection.db.collection(collection.name).countDocuments();
    console.log(`   ✅ ${collection.name}: ${count} documents`);
  }

  await mongoose.disconnect();
  console.log('\n✅ Backup verification complete!');
}

verifyBackups().catch(console.error);
```

**Run daily via cron:**
```bash
# Add to crontab
0 2 * * * cd /app && node scripts/verify-backups.js >> /var/log/backup-verify.log 2>&1
```

---

## ✅ MONITORING CHECKLIST

- [ ] Cloud Monitoring API enabled
- [ ] Custom metrics configured
- [ ] Alert policies created (error rate, response time, MongoDB)
- [ ] Dashboard created and accessible
- [ ] Sentry installed and initialized
- [ ] Error tracking tested
- [ ] Email notifications configured
- [ ] Slack/PagerDuty integrated
- [ ] Uptime checks configured
- [ ] Log aggregation queries saved
- [ ] Backup verification script deployed
- [ ] All team members added to notification channels

---

**Monitoring setup complete! System is now fully observable.** 🔍

