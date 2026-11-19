# Local demo accounts

Run from `apps/server` after migrations:

```powershell
php artisan db:seed --class=DemoUserSeeder
```

This optional seeder runs only in `local` or `testing`. It loads master data,
adds non-admin demo accounts, and links each supervisor to their terminals.
It does not change existing accounts, passwords, assignments, or the admin.
It is deliberately excluded from the default database seeder.

All newly created demo accounts use password **`PsiDemo2026!`** and can open
the dashboard immediately. These credentials are for local development only.

| Role | Email |
| --- | --- |
| CEO | `ceo@psi.test` |
| General Manager | `general.manager@psi.test` |
| COO | `coo@psi.test` |
| Supervisor | `wilfredo.permejo@psi.test` |
| Supervisor | `sherome.gameda@psi.test` |
| Supervisor | `eleonor.dimalaluan@psi.test` |
| Supervisor | `rhoda.maquiling@psi.test` |
| Supervisor | `pablito.ricio@psi.test` |
| Supervisor | `edith.beltran@psi.test` |
| Supervisor | `mark.christian.estares@psi.test` |
| Supervisor | `art.lomiabo@psi.test` |

Existing linked supervisors are skipped. Other active, unlinked supervisors
also receive an account using their name separated by dots at `psi.test`.

Open http://localhost:8081/login for the current local setup. Management can
view all terminals; supervisors can encode reports only for assigned terminals.
