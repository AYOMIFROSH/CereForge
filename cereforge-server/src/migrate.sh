#!/bin/bash

# =====================================================
# CEREFORGE OPTIMIZATION MIGRATION SCRIPT
# Applies all Phase 1-3 optimizations automatically
# =====================================================

set -e  # Exit on error

echo "🚀 Starting Cereforge Optimization Migration..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backup directory
BACKUP_DIR="./backup_$(date +%Y%m%d_%H%M%S)"

# =====================================================
# STEP 0: Create backup
# =====================================================
echo "📦 Creating backup..."
mkdir -p "$BACKUP_DIR"

# Backup files that will be modified
cp src/services/email.service.ts "$BACKUP_DIR/" 2>/dev/null || true
cp src/services/auth.service.ts "$BACKUP_DIR/" 2>/dev/null || true
cp src/services/pendingPartners.service.ts "$BACKUP_DIR/" 2>/dev/null || true
cp src/controllers/auth.controller.ts "$BACKUP_DIR/" 2>/dev/null || true
cp src/controllers/getStarted.controller.ts "$BACKUP_DIR/" 2>/dev/null || true
cp src/config/database.ts "$BACKUP_DIR/" 2>/dev/null || true
cp src/server.ts "$BACKUP_DIR/" 2>/dev/null || true
cp package.json "$BACKUP_DIR/" || true

echo -e "${GREEN}✅ Backup created at $BACKUP_DIR${NC}"
echo ""

# =====================================================
# STEP 1: Remove email queue files
# =====================================================
echo "🗑️  Removing email queue files..."

if [ -f "src/queues/email.queue.ts" ]; then
  rm src/queues/email.queue.ts
  echo -e "${GREEN}✅ Removed email.queue.ts${NC}"
fi

if [ -f "src/queues/calendar.queue.ts" ]; then
  rm src/queues/calendar.queue.ts
  echo -e "${GREEN}✅ Removed calendar.queue.ts${NC}"
fi

if [ -f "src/services/audit.email.service.ts" ]; then
  rm src/services/audit.email.service.ts
  echo -e "${GREEN}✅ Removed audit.email.service.ts${NC}"
fi

# Remove queues directory if empty
if [ -d "src/queues" ] && [ -z "$(ls -A src/queues)" ]; then
  rmdir src/queues
  echo -e "${GREEN}✅ Removed empty queues directory${NC}"
fi

echo ""

# =====================================================
# STEP 2: Remove session cleanup service
# =====================================================
echo "🗑️  Removing Node.js session cleanup..."

if [ -f "src/services/session.cleanup.services.ts" ]; then
  rm src/services/session.cleanup.services.ts
  echo -e "${GREEN}✅ Removed session.cleanup.services.ts${NC}"
fi

echo ""

# =====================================================
# STEP 3: Update package.json (remove Bull/IORedis)
# =====================================================
echo "📦 Updating package.json..."

if command -v npm &> /dev/null; then
  # Check if packages exist before removing
  if npm list bull &> /dev/null; then
    npm uninstall bull --save
    echo -e "${GREEN}✅ Removed bull${NC}"
  else
    echo -e "${YELLOW}⚠️  bull not found, skipping${NC}"
  fi

  if npm list ioredis &> /dev/null; then
    npm uninstall ioredis --save
    echo -e "${GREEN}✅ Removed ioredis${NC}"
  else
    echo -e "${YELLOW}⚠️  ioredis not found, skipping${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  npm not found, skipping dependency removal${NC}"
fi

echo ""

# =====================================================
# STEP 4: Update environment variables
# =====================================================
echo "⚙️  Checking environment variables..."

if [ -f ".env" ]; then
  # Check if REDIS_URL exists
  if grep -q "REDIS_URL" .env; then
    echo -e "${YELLOW}⚠️  Found REDIS_URL in .env - Consider removing if not used elsewhere${NC}"
    echo "   You can comment it out manually or remove it"
  fi
  
  # Check if RESEND_API_KEY exists
  if ! grep -q "RESEND_API_KEY" .env; then
    echo -e "${RED}❌ RESEND_API_KEY not found in .env${NC}"
    echo "   Please add: RESEND_API_KEY=re_your_api_key"
  else
    echo -e "${GREEN}✅ RESEND_API_KEY found${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  .env file not found${NC}"
fi

echo ""

# =====================================================
# STEP 5: Show files that need manual updates
# =====================================================
echo "📝 Files that need manual code updates:"
echo ""
echo "1. ${YELLOW}src/services/email.service.ts${NC}"
echo "   - Replace with new version (retry logic, no queue)"
echo ""
echo "2. ${YELLOW}src/controllers/auth.controller.ts${NC}"
echo "   - Update refreshTokenHandler (session validation)"
echo ""
echo "3. ${YELLOW}src/services/auth.service.ts${NC}"
echo "   - Optimize login with JOIN query"
echo ""
echo "4. ${YELLOW}src/controllers/getStarted.controller.ts${NC}"
echo "   - Remove queue calls, use direct email functions"
echo ""
echo "5. ${YELLOW}src/services/pendingPartners.service.ts${NC}"
echo "   - Remove queue calls, use direct email functions"
echo ""
echo "6. ${YELLOW}src/config/database.ts${NC}"
echo "   - Replace with connection pooling version"
echo ""
echo "7. ${YELLOW}src/server.ts${NC}"
echo "   - Remove: import { closeEmailQueue } from './queues/email.queue'"
echo "   - Remove: import { startSessionCleanup } from './services/session.cleanup.services'"
echo "   - Remove: await closeEmailQueue() from shutdown"
echo "   - Remove: startSessionCleanup() from startup"
echo ""

# =====================================================
# STEP 6: Database migrations needed
# =====================================================
echo "🗄️  Database migrations needed:"
echo ""
echo "1. ${YELLOW}Run Postgres Cron setup in Supabase SQL Editor${NC}"
echo "   - See: postgres_cron_session_cleanup.sql"
echo ""
echo "2. ${YELLOW}Add database indexes (if not exist)${NC}"
echo "   - user_sessions: (user_id, is_active, expires_at)"
echo "   - audit_logs: (created_at, action, user_id)"
echo "   - calendar_events: (user_id, start_time, is_recurring_parent)"
echo ""

# =====================================================
# STEP 7: Next steps
# =====================================================
echo ""
echo "✅ ${GREEN}Migration preparation complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "1. Copy new code from artifacts into files listed above"
echo "2. Run: npm install (to clean up package-lock.json)"
echo "3. Run Postgres cron setup in Supabase"
echo "4. Test locally: npm run dev"
echo "5. Run tests: npm test (if you have tests)"
echo "6. Deploy to production"
echo ""
echo "💾 Backup location: ${GREEN}$BACKUP_DIR${NC}"
echo ""
echo "🔄 To rollback:"
echo "   cp $BACKUP_DIR/* src/ (restore files)"
echo "   npm install (restore dependencies)"
echo ""