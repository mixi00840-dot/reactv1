# 📱 ON-CALL PLAYBOOK - MIXILLO PLATFORM

**Quick Reference Guide for On-Call Engineers**

---

## 🚨 IMMEDIATE ACTIONS (First 5 Minutes)

### When Paged

1. **Acknowledge Alert** (within 5 minutes)
   - Respond in PagerDuty
   - Post in #incidents Slack channel: "Acknowledged, investigating"

2. **Check System Status**
   ```bash
   # Quick health check
   curl https://mixillo-backend-52242135857.europe-west1.run.app/health
   
   # Expected: {"status":"ok","mongodb":{"connected":true}}
   ```

3. **Identify Severity**
   - P0: Service down, data loss, security breach → **Act Now**
   - P1: Degraded performance, high errors → **Act within 1 hour**
   - P2: Minor issues → **Act within 4 hours**

---

## 🔥 P0 INCIDENTS (Critical)

### Service Completely Down

**Symptoms:**
- Health check returns 503 or times out
- All API requests failing
- Users cannot access the platform

**Immediate Actions:**
```bash
# 1. Check Cloud Run status
gcloud run services describe mixillo-backend --region=europe-west1

# 2. Check recent deployments
gcloud run revisions list --service=mixillo-backend --region=europe-west1 --limit=5

# 3. If recent deployment, ROLLBACK IMMEDIATELY
gcloud run services update-traffic mixillo-backend \
  --region=europe-west1 \
  --to-revisions=PREVIOUS_REVISION=100

# 4. If not deployment, check MongoDB
# Go to https://cloud.mongodb.com/v2/PROJECT_ID#/clusters

# 5. If MongoDB down, check status.mongodb.com
```

**Communication:**
```
#incidents: "P0: Service down. Rolling back to previous revision. ETA: 5 minutes"
```

### MongoDB Connection Lost

**Symptoms:**
- Health check shows `"connected": false`
- Errors: "MongoNetworkError"

**Immediate Actions:**
```bash
# 1. Check MongoDB Atlas status
# https://status.mongodb.com

# 2. Verify IP whitelist
# MongoDB Atlas > Network Access
# Ensure 0.0.0.0/0 is allowed

# 3. Test connection
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('OK'))"

# 4. If failed, update connection string
gcloud run services update mixillo-backend \
  --region=europe-west1 \
  --update-env-vars=MONGODB_URI="mongodb+srv://..."
```

**Communication:**
```
#incidents: "P0: MongoDB connection lost. Investigating Atlas. ETA: 10 minutes"
```

### Payment Processing Failed

**Symptoms:**
- Users reporting failed payments
- Stripe webhooks failing
- Orders stuck in pending

**Immediate Actions:**
```bash
# 1. Check Stripe status
# https://status.stripe.com

# 2. Verify webhook endpoint
curl -X POST https://mixillo-backend.../api/payments/mongodb/webhooks/stripe \
  -H "stripe-signature: test" \
  -d '{"type":"ping"}'

# 3. Check recent payment logs
gcloud logging read "jsonPayload.message=~'Payment'" --limit=10

# 4. Process stuck orders manually if needed
# (Contact senior engineer)
```

**Communication:**
```
#incidents: "P0: Payment processing down. Stripe status: [CHECKING]. Do not process manual orders."
```

---

## ⚠️ P1 INCIDENTS (High)

### High Error Rate (> 10%)

**Symptoms:**
- Sentry alerts
- Cloud Monitoring alerts
- Many 500 errors in logs

**Actions:**
```bash
# 1. Check Sentry for error patterns
# https://sentry.io/organizations/mixillo/

# 2. Review recent logs
gcloud logging read "severity>=ERROR" --limit=50

# 3. Identify most common error
# Look for patterns in error messages

# 4. If validation errors, may be attack
# Check request rate and IP addresses

# 5. If database errors, check MongoDB
# Performance Advisor in Atlas
```

**Mitigation:**
```bash
# If under attack:
# 1. Enable rate limiting (if not already)
# 2. Block malicious IPs

# If code issue:
# 1. Identify problematic endpoint
# 2. Disable feature if possible
# 3. Deploy hotfix
```

### Slow Response Times (> 1s p95)

**Symptoms:**
- Users reporting slowness
- Cloud Monitoring alert
- Timeouts

**Actions:**
```bash
# 1. Check current load
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_count"'

# 2. Check instance count
gcloud run services describe mixillo-backend --region=europe-west1 \
  --format="value(status.traffic[0].percent)"

# 3. Scale up temporarily
gcloud run services update mixillo-backend \
  --region=europe-west1 \
  --min-instances=5 \
  --max-instances=20

# 4. Check slow queries in MongoDB Atlas
# Performance Advisor > Query Performance
```

---

## 📊 INVESTIGATION TOOLS

### Cloud Run Logs
```bash
# Stream logs
gcloud logging tail "resource.type=cloud_run_revision"

# Search for errors
gcloud logging read "severity>=ERROR" --limit=50

# Search for specific user
gcloud logging read "jsonPayload.userId='USER_ID'" --limit=20

# Search for slow requests
gcloud logging read "jsonPayload.responseTime>1000" --limit=20
```

### MongoDB Queries
```javascript
// Connect to MongoDB
mongosh "mongodb+srv://..."

// Check recent errors
db.system.profile.find({ millis: { $gt: 100 } }).sort({ ts: -1 }).limit(10)

// Count documents
db.users.countDocuments()
db.content.countDocuments()

// Find specific user
db.users.findOne({ username: "USERNAME" })

// Check indexes
db.content.getIndexes()
```

### Metrics Dashboard
```
Cloud Console: https://console.cloud.google.com/monitoring/dashboards
Sentry: https://sentry.io/organizations/mixillo/
MongoDB Atlas: https://cloud.mongodb.com
```

---

## 🔧 COMMON FIXES

### Restart Service
```bash
gcloud run services update mixillo-backend \
  --region=europe-west1 \
  --update-env-vars=RESTART=$(date +%s)
```

### Scale Service
```bash
# Scale up
gcloud run services update mixillo-backend \
  --region=europe-west1 \
  --min-instances=3 \
  --max-instances=15

# Scale down (after incident)
gcloud run services update mixillo-backend \
  --region=europe-west1 \
  --min-instances=0 \
  --max-instances=10
```

### Clear Cache (if implemented)
```bash
# If using Redis:
redis-cli FLUSHALL

# If using in-memory:
# Restart service (see above)
```

### Reset Admin Password
```bash
cd backend
node scripts/reset-admin-password.js
# New password will be displayed
```

---

## 📞 ESCALATION

### When to Escalate

**Escalate to Senior Engineer if:**
- Can't resolve within 30 minutes
- Need expert knowledge
- Require production database changes
- Unsure of proper fix

**How to Escalate:**
1. Tag @senior-engineer in #incidents
2. Call if P0 and urgent: [PHONE_NUMBER]
3. Provide summary: "Issue: X, Tried: Y, Need: Z"

**Senior Engineer Contact:**
- Primary: [NAME] - [PHONE]
- Secondary: [NAME] - [PHONE]

---

## 📝 INCIDENT DOCUMENTATION

### During Incident
```
Post updates every 15 minutes in #incidents:
"[TIME] Update: [STATUS]. Next: [ACTION]. ETA: [MINUTES]"

Example:
"18:15 Update: Rolled back to rev 075. Service recovering. Next: Verify all endpoints. ETA: 5 mins"
```

### After Resolution
```
Post in #incidents:
"✅ RESOLVED: [SUMMARY]. Root cause: [CAUSE]. Fix: [ACTION]. No further action needed."

Example:
"✅ RESOLVED: Service restored. Root cause: MongoDB connection timeout due to Atlas maintenance. Fix: Updated connection string with retry logic. No further action needed."
```

### Post-Incident
1. Create incident report (within 24 hours)
2. Document timeline
3. Identify action items
4. Schedule post-mortem if P0

---

## ✅ HEALTH CHECK COMMANDS

### Quick System Check
```bash
# 1. API health
curl https://mixillo-backend-52242135857.europe-west1.run.app/health

# 2. Auth working
curl -X POST https://mixillo-backend.../api/auth/mongodb/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"Admin@123456"}' \
  | jq '.success'

# 3. Database query
curl https://mixillo-backend.../api/admin/mongodb/dashboard \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.success'

# If all return true/OK, system is healthy
```

---

## 🆘 EMERGENCY CONTACTS

```
Engineering Manager: [PHONE] [EMAIL]
CTO: [PHONE] [EMAIL]
MongoDB Support: https://support.mongodb.com
Google Cloud Support: https://cloud.google.com/support
Stripe Support: https://support.stripe.com
```

---

## 📚 USEFUL LINKS

- Cloud Console: https://console.cloud.google.com/run?project=mixillo
- MongoDB Atlas: https://cloud.mongodb.com
- Sentry: https://sentry.io/organizations/mixillo/
- Vercel: https://vercel.com/mixillo
- Full Runbook: OPERATIONS_RUNBOOK.md
- Architecture Docs: COMPREHENSIVE_AUDIT_STATUS_FINAL.md

---

**Remember:**
1. ✅ Acknowledge within 5 minutes
2. ✅ Update #incidents every 15 minutes
3. ✅ Document everything
4. ✅ Escalate if unsure
5. ✅ Learn and improve

**You've got this! 💪**


