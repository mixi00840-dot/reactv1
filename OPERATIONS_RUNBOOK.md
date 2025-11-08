# 📚 OPERATIONS RUNBOOK - MIXILLO PLATFORM

**Version:** 1.0  
**Last Updated:** November 7, 2025  
**Maintainer:** Engineering Team

---

## 🎯 QUICK REFERENCE

### Critical Contacts
- **Engineering Lead:** engineering@mixillo.com
- **DevOps:** devops@mixillo.com
- **On-Call:** oncall@mixillo.com
- **PagerDuty:** https://mixillo.pagerduty.com

### Key URLs
- **Production API:** https://mixillo-backend-52242135857.europe-west1.run.app
- **Admin Dashboard:** https://mixillo-admin.vercel.app
- **Health Check:** https://mixillo-backend-52242135857.europe-west1.run.app/health
- **Cloud Console:** https://console.cloud.google.com/run?project=mixillo
- **MongoDB Atlas:** https://cloud.mongodb.com
- **Sentry:** https://sentry.io/organizations/mixillo
- **Vercel:** https://vercel.com/mixillo

---

## 🚀 DEPLOYMENT PROCEDURES

### Standard Deployment

**1. Pre-Deployment Checklist:**
```
[ ] All tests passing (npm test)
[ ] Code reviewed and approved
[ ] Database migrations tested
[ ] Environment variables verified
[ ] Backup created
[ ] Rollback plan documented
[ ] Team notified
```

**2. Deploy to Production:**
```bash
# Navigate to backend directory
cd backend

# Deploy with gcloud
gcloud run deploy mixillo-backend \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --platform managed \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0 \
  --concurrency 80 \
  --port 8080 \
  --set-env-vars="DATABASE_MODE=dual,MONGODB_URI=$MONGODB_URI"

# Wait for deployment
# Expected time: 8-10 minutes
```

**3. Post-Deployment Verification:**
```bash
# 1. Check health
curl https://mixillo-backend-52242135857.europe-west1.run.app/health

# Expected response:
# {"status":"ok","mongodb":{"connected":true}}

# 2. Test authentication
curl -X POST https://mixillo-backend-52242135857.europe-west1.run.app/api/auth/mongodb/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"Admin@123456"}'

# Expected: 200 OK with JWT token

# 3. Monitor for 10 minutes
# - Check Cloud Run logs
# - Check error rate in Cloud Monitoring
# - Check Sentry for new errors
```

### Rollback Procedure

**If deployment fails or causes issues:**

```bash
# 1. Get previous revision
gcloud run revisions list \
  --service=mixillo-backend \
  --region=europe-west1

# 2. Roll back to previous revision
gcloud run services update-traffic mixillo-backend \
  --region=europe-west1 \
  --to-revisions=PREVIOUS_REVISION=100

# Example:
gcloud run services update-traffic mixillo-backend \
  --region=europe-west1 \
  --to-revisions=mixillo-backend-00075-82j=100

# 3. Verify rollback
curl https://mixillo-backend-52242135857.europe-west1.run.app/health

# 4. Investigate issue
# - Check Cloud Run logs
# - Check Sentry
# - Review recent changes
```

---

## 🔍 MONITORING & ALERTING

### Key Metrics to Monitor

**1. Response Time:**
- Target: < 300ms (p95)
- Alert: > 1000ms for 5 minutes
- Check: Cloud Monitoring Dashboard

**2. Error Rate:**
- Target: < 1%
- Alert: > 5% for 5 minutes
- Check: Cloud Run logs, Sentry

**3. MongoDB Connection:**
- Target: Always connected
- Alert: Disconnected for > 1 minute
- Check: /health endpoint

**4. Request Rate:**
- Normal: 10-100 req/s
- Alert: > 500 req/s (possible DDoS)
- Check: Cloud Monitoring

### Accessing Logs

**Cloud Run Logs:**
```bash
# View recent logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=mixillo-backend" \
  --limit 50 \
  --format json

# View errors only
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit 50

# Stream logs
gcloud logging tail "resource.type=cloud_run_revision"
```

**Sentry:**
1. Go to https://sentry.io
2. Select "mixillo-backend" project
3. View recent errors
4. Set up filters by user, endpoint, or time

---

## 🆘 INCIDENT RESPONSE

### Severity Levels

**P0 - Critical (Immediate Response)**
- Complete service outage
- Data loss or corruption
- Security breach
- Payment processing failure

**P1 - High (Response within 1 hour)**
- Partial service degradation
- High error rate (> 10%)
- Slow response times (> 5s)
- MongoDB connection issues

**P2 - Medium (Response within 4 hours)**
- Minor feature issues
- Non-critical API failures
- UI bugs

**P3 - Low (Response within 1 business day)**
- Cosmetic issues
- Documentation updates
- Nice-to-have features

### P0 Incident Response

**1. Acknowledge:**
```
- Page on-call engineer
- Post in #incidents Slack channel
- Update status page
```

**2. Assess:**
```
- Check Cloud Run status
- Check MongoDB Atlas status
- Review Sentry errors
- Check recent deployments
```

**3. Mitigate:**
```
- Roll back if recent deployment
- Scale up if resource issue
- Disable problematic feature
- Switch to degraded mode if needed
```

**4. Fix:**
```
- Identify root cause
- Apply permanent fix
- Deploy fix
- Verify resolution
```

**5. Post-Mortem:**
```
- Document timeline
- Identify root cause
- List action items
- Schedule follow-up
```

---

## 🔧 COMMON ISSUES & SOLUTIONS

### Issue: MongoDB Connection Failed

**Symptoms:**
- /health returns `{"mongodb":{"connected":false}}`
- 500 errors on all MongoDB routes
- Errors in logs: "MongoNetworkError"

**Resolution:**
```bash
# 1. Check MongoDB Atlas status
# Go to https://cloud.mongodb.com

# 2. Verify connection string
gcloud run services describe mixillo-backend \
  --region=europe-west1 \
  --format="value(spec.template.spec.containers[0].env)"

# 3. Test connection locally
node -e "
const mongoose = require('mongoose');
mongoose.connect('YOUR_MONGODB_URI')
  .then(() => console.log('Connected'))
  .catch(err => console.error('Error:', err));
"

# 4. Update connection string if needed
gcloud run services update mixillo-backend \
  --region=europe-west1 \
  --set-env-vars="MONGODB_URI=NEW_CONNECTION_STRING"

# 5. Restart service
gcloud run services update mixillo-backend \
  --region=europe-west1 \
  --update-env-vars=RESTART_TRIGGER=$(date +%s)
```

### Issue: High Response Time

**Symptoms:**
- p95 response time > 1000ms
- Users reporting slow performance
- Timeout errors

**Resolution:**
```bash
# 1. Check current load
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_count"'

# 2. Check instance count
gcloud run services describe mixillo-backend \
  --region=europe-west1 \
  --format="value(status.traffic[0].latestRevision)"

# 3. Scale up if needed
gcloud run services update mixillo-backend \
  --region=europe-west1 \
  --min-instances=2 \
  --max-instances=20

# 4. Check for slow queries
# Review MongoDB slow query log in Atlas

# 5. Add indexes if needed
# Use MongoDB Atlas UI or mongo shell
```

### Issue: Authentication Failures

**Symptoms:**
- Users unable to login
- "Invalid token" errors
- 401 Unauthorized responses

**Resolution:**
```bash
# 1. Verify JWT secrets
gcloud secrets versions list JWT_SECRET
gcloud secrets versions list JWT_REFRESH_SECRET

# 2. Check secret access
gcloud run services get-iam-policy mixillo-backend \
  --region=europe-west1

# 3. Verify admin user exists
# Connect to MongoDB and check:
db.users.findOne({ username: 'admin' })

# 4. Reset admin password if needed
node backend/scripts/reset-admin-password.js

# 5. Test login manually
curl -X POST https://mixillo-backend.../api/auth/mongodb/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"Admin@123456"}'
```

### Issue: Payment Processing Failed

**Symptoms:**
- Payment intent creation fails
- Webhook not processing
- Orders stuck in "pending"

**Resolution:**
```bash
# 1. Check Stripe status
# Go to https://status.stripe.com

# 2. Verify webhook signature
# Check STRIPE_WEBHOOK_SECRET in env vars

# 3. Check payment logs
gcloud logging read "jsonPayload.message=~'Payment'" \
  --limit 50

# 4. Verify idempotency
# Check for duplicate payments in MongoDB:
db.payments.find({ idempotencyKey: "KEY" })

# 5. Process stuck orders manually
node backend/scripts/process-stuck-orders.js
```

---

## 🔒 SECURITY PROCEDURES

### Security Incident Response

**1. Potential Breach Detected:**
```
- Immediately notify security team
- Isolate affected systems
- Preserve logs and evidence
- Reset all credentials
- Notify affected users (if needed)
- File incident report
```

### Rotating Secrets

**Rotate JWT Secrets:**
```bash
# 1. Generate new secrets
NEW_JWT_SECRET=$(openssl rand -base64 64)
NEW_REFRESH_SECRET=$(openssl rand -base64 64)

# 2. Update Cloud Secrets
echo -n "$NEW_JWT_SECRET" | gcloud secrets versions add JWT_SECRET --data-file=-
echo -n "$NEW_REFRESH_SECRET" | gcloud secrets versions add JWT_REFRESH_SECRET --data-file=-

# 3. Deploy with new secrets
gcloud run deploy mixillo-backend --source . --region europe-west1

# 4. Invalidate all existing tokens
# (Users will need to re-login)
```

**Rotate MongoDB Password:**
```bash
# 1. Create new user in MongoDB Atlas
# Go to Security > Database Access

# 2. Update connection string
NEW_URI="mongodb+srv://new_user:new_password@mixillo..."

# 3. Update Cloud Run
gcloud run services update mixillo-backend \
  --region=europe-west1 \
  --set-env-vars="MONGODB_URI=$NEW_URI"

# 4. Verify connection
curl https://mixillo-backend.../health

# 5. Delete old user in Atlas
```

---

## 📊 PERFORMANCE OPTIMIZATION

### Database Optimization

**Check Slow Queries:**
```javascript
// In MongoDB Atlas UI:
// Performance Advisor > Query Performance
// Or use profiler:
db.setProfilingLevel(1, { slowms: 100 });
db.system.profile.find().sort({ ts: -1 }).limit(10);
```

**Add Missing Indexes:**
```javascript
// Example: Add index for content search
db.content.createIndex({ tags: 1, createdAt: -1 });

// Compound index for feed queries
db.content.createIndex({ userId: 1, status: 1, createdAt: -1 });

// Text index for search
db.content.createIndex({ title: "text", description: "text" });
```

### Application Optimization

**Enable Connection Pooling:**
```javascript
// backend/src/utils/mongodb.js
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 50,
  minPoolSize: 10,
  socketTimeoutMS: 45000,
});
```

**Cache Frequently Accessed Data:**
```javascript
// Use Redis or in-memory cache
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

// Cache trending content
router.get('/trending', async (req, res) => {
  const cached = cache.get('trending');
  if (cached) return res.json(cached);
  
  const trending = await Content.find(...)...;
  cache.set('trending', trending);
  res.json(trending);
});
```

---

## 🔄 BACKUP & RECOVERY

### Manual Backup

**Create On-Demand Backup:**
```bash
# MongoDB Atlas UI:
# Clusters > ... > Create Snapshot

# Or via API:
curl --user "$ATLAS_PUBLIC_KEY:$ATLAS_PRIVATE_KEY" \
  --digest \
  --header "Content-Type: application/json" \
  --request POST \
  "https://cloud.mongodb.com/api/atlas/v1.0/groups/$PROJECT_ID/clusters/mixillo/backup/snapshots" \
  --data '{
    "description": "Pre-deployment backup",
    "retentionInDays": 7
  }'
```

### Restore from Backup

**Restore Entire Database:**
```bash
# 1. Download backup from MongoDB Atlas
# Clusters > Backups > Download

# 2. Restore locally
mongorestore --uri="mongodb+srv://..." --archive=backup.archive

# 3. Verify data
mongo "mongodb+srv://..." --eval "db.users.count()"

# 4. Or restore to new cluster for testing
```

**Restore Specific Collection:**
```bash
# Export from backup
mongoexport --uri="mongodb+srv://..." \
  --collection=users \
  --out=users_backup.json

# Import to production
mongoimport --uri="mongodb+srv://PROD..." \
  --collection=users \
  --file=users_backup.json \
  --mode=upsert
```

---

## 📞 ESCALATION PROCEDURES

### When to Escalate

**Escalate to Senior Engineer if:**
- Issue not resolved within 30 minutes
- Multiple systems affected
- Data integrity concerns
- Customer-impacting for > 1 hour

**Escalate to Engineering Manager if:**
- P0 incident lasting > 2 hours
- Potential security breach
- Need to make business decision
- Require additional resources

**Escalate to CTO if:**
- Company-wide impact
- Legal or compliance issues
- Major security breach
- Press/PR involvement

### Escalation Contact Tree
```
1. On-Call Engineer
   ↓ (30 mins, unresolved)
2. Senior Engineer / Team Lead
   ↓ (1 hour, unresolved)
3. Engineering Manager
   ↓ (2 hours, P0 unresolved)
4. CTO
```

---

## ✅ MAINTENANCE CHECKLIST

### Daily
- [ ] Check Cloud Monitoring dashboard
- [ ] Review Sentry errors
- [ ] Check backup status
- [ ] Review slow query log

### Weekly
- [ ] Review security alerts
- [ ] Check database size and growth
- [ ] Review performance trends
- [ ] Update documentation if needed

### Monthly
- [ ] Rotate secrets
- [ ] Review and optimize indexes
- [ ] Capacity planning review
- [ ] Update dependencies
- [ ] Test backup restoration
- [ ] Review incident post-mortems

---

**Runbook maintained by:** Engineering Team  
**Next Review Date:** December 7, 2025


