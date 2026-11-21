# Deployment & Backup Guide

## 1. Server Requirements

- PHP 8.4+ with `pdo_mysql`, `mbstring`, `openssl`, `xml`, `zip`, `bcmath`, `intl`
- MariaDB 10.11+ (or 11.x)
- Node.js 22+ and npm (for building frontend assets)
- Composer 2.x

## 2. Initial Setup & Updates

In `apps/server`:

```bash
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate
# Configure DB_*, APP_URL, MAIL_*, and SESSION_* in .env
php artisan migrate --force
npm ci
npm run build
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

On subsequent deployments:

```bash
git pull
composer install --no-dev --optimize-autoloader
php artisan migrate --force
npm ci
npm run build
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## 3. Scheduler (Cron)

Add a single cron entry running every minute:

```cron
* * * * * cd /path/to/psi-terminal-reporting/apps/server && php artisan schedule:run >> /dev/null 2>&1
```

Scheduled tasks defined in `routes/console.php`:
- `psi:generate-reporting-weeks` — Daily at `00:10` (ensures current and next month's Monday–Sunday weeks exist).
- `psi:send-report-reminders` — Weekly on Mondays at `08:00` (in-app reminders to supervisors with unsubmitted/not-started terminals; no email).

## 4. Database Backups & Restore (MariaDB)

Run a daily compressed backup via `mysqldump` / `mariadb-dump`:

```bash
mariadb-dump --single-transaction --routines --triggers -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_DATABASE" | gzip > "/backups/psi-$(date +%F).sql.gz"
```

To restore from a backup:

```bash
gunzip -c /backups/psi-YYYY-MM-DD.sql.gz | mariadb -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_DATABASE"
```

Keep at least 30 days of daily backups off-server and test a restore periodically on a staging database.

