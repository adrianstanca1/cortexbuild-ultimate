#!/bin/bash
# Health check script - run via cron every 5 minutes
ALERT_EMAIL="admin@cortexbuild.com"
WEBHOOK_URL=""
LOG_FILE="/var/www/cortexbuild-ultimate/logs/health.log"

check_api() {
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>/dev/null)
    if [ "$response" != "200" ]; then
        echo "[$(date)] API DOWN - HTTP $response" >> $LOG_FILE
        return 1
    fi
    return 0
}

check_db() {
    response=$(docker exec cortexbuild-db pg_isready -U cortexbuild 2>/dev/null)
    if [ $? -ne 0 ]; then
        echo "[$(date)] DB DOWN" >> $LOG_FILE
        return 1
    fi
    return 0
}

if ! check_api; then
    echo "[$(date)] ALERT: API is down on cortexbuildpro.com" | tee -a $LOG_FILE
fi

if ! check_db; then
    echo "[$(date)] ALERT: Database is down" | tee -a $LOG_FILE
fi
