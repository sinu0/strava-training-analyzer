#!/usr/bin/env bash
# A consistent logical database dump plus configuration required to decrypt stored tokens.
set -euo pipefail
umask 077
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"
mkdir -p -- backups
scratch_dir="$(mktemp -d "$project_dir/backups/.backup-XXXXXXXX")"
cleanup() { rm -f -- "$scratch_dir/db.dump" "$scratch_dir/config.env" "$scratch_dir/SHA256SUMS" "$scratch_dir/archive.tmp"; rmdir -- "$scratch_dir"; }
trap cleanup EXIT
docker compose exec -T db sh -c 'exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom' > "$scratch_dir/db.dump"
docker compose exec -T db pg_restore --list < "$scratch_dir/db.dump" > /dev/null
if [[ -f .env ]]; then cp -- .env "$scratch_dir/config.env"; else touch "$scratch_dir/config.env"; fi
(cd "$scratch_dir" && sha256sum db.dump config.env > SHA256SUMS)
archive_name="strava-$(date -u +%Y%m%dT%H%M%SZ)-$$.tar"
if [[ -n "${BACKUP_GPG_RECIPIENT:-}" ]]; then
  tar -C "$scratch_dir" -cf - db.dump config.env SHA256SUMS | gpg --batch --yes --encrypt --recipient "$BACKUP_GPG_RECIPIENT" --output "$scratch_dir/archive.tmp"
  archive_name+=".gpg"
else
  tar -C "$scratch_dir" -cf "$scratch_dir/archive.tmp" db.dump config.env SHA256SUMS
  printf '%s\n' 'UWAGA: lokalny backup zawiera dane prywatne i sekrety; uprawnienia 0600. Do kopii poza hostem ustaw BACKUP_GPG_RECIPIENT.' >&2
fi
mv -- "$scratch_dir/archive.tmp" "$project_dir/backups/$archive_name"
printf '%s\n' "$project_dir/backups/$archive_name"
