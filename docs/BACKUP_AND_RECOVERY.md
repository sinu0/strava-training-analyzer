# Backup and recovery

[← README](../README.md)

`bash scripts/backup.sh` writes a consistent PostgreSQL dump, the `.env` file (needed e.g. to decrypt tokens) and SHA-256 checksums. Backups have 0600 permissions and are excluded from Git. They contain private data and secrets — never attach them to issues.

Before moving a backup off the host, encrypt it with the recipient's key:

```bash
BACKUP_GPG_RECIPIENT=key-id bash scripts/backup.sh
bash scripts/verify-backup.sh /full/path/backups/strava-....tar.gpg
```

The verifier checks the checksums and restores the dump into a separate container without ports or network. It never overwrites the app database; the temporary container and decrypted files are removed afterwards. It needs the local database image (`docker compose build db`) and, for encrypted backups, the GPG private key. A backup taken before a migration stays valid: Flyway applies newer migrations after restore.

Recommended schedule for a private installation: daily backup, weekly restore test, a backup before migrations. Keep at least 7 daily and 4 weekly backups, plus one encrypted off-host copy. The scripts intentionally never delete old backups; verify that the newest one restores before rotating manually.

A production restore is a separate, deliberate operation: stop the backend, keep an emergency copy of the current database, restore the verified dump into a **new** database/volume, bring back the matching `ENCRYPTION_KEY` from the protected `config.env`, switch the configuration and run `docker compose up -d --build`. Do not remove the previous volume until data and login are verified. `.env` is not loaded by the verifier and must never be blindly executed as a script.
