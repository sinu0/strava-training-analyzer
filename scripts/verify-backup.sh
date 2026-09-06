#!/usr/bin/env bash
# Restores ONLY into an isolated disposable container, never the running application database.
set -euo pipefail
umask 077
if [[ $# != 1 || ! -f "$1" ]]; then printf 'Użycie: %s /pełna/ścieżka/backup.tar[.gpg]\n' "$0" >&2; exit 2; fi
archive_path="$(realpath -- "$1")"
scratch_dir="$(mktemp -d)"
container_name="strava-restore-check-$$"
container_started=false
cleanup() {
  if [[ "$container_started" == true ]]; then docker stop --time 2 "$container_name" > /dev/null; fi
  rm -f -- "$scratch_dir/archive.tar" "$scratch_dir/db.dump" "$scratch_dir/config.env" "$scratch_dir/SHA256SUMS"
  rmdir -- "$scratch_dir"
}
trap cleanup EXIT
if [[ "$archive_path" == *.gpg ]]; then
  gpg --decrypt --output "$scratch_dir/archive.tar" "$archive_path"
  archive_path="$scratch_dir/archive.tar"
fi
# Extract only known filenames as streams; never trust archive paths or permissions.
for backup_member in db.dump config.env SHA256SUMS; do
  tar -xOf "$archive_path" "$backup_member" > "$scratch_dir/$backup_member"
done
# Rebuild expected hashes rather than allowing a manifest to reference arbitrary paths.
expected_hashes="$(cd "$scratch_dir" && sha256sum db.dump config.env)"
[[ "$(< "$scratch_dir/SHA256SUMS")" == "$expected_hashes" ]] || { printf '%s\n' 'Błędna suma kontrolna backupu.' >&2; exit 1; }
docker run -d --rm --name "$container_name" --network none \
  -e POSTGRES_PASSWORD=isolated-restore-only -e POSTGRES_DB=restore_check \
  "${TEST_DATABASE_IMAGE:-stravaanalizator-db:latest}" > /dev/null
container_started=true
for attempt in {1..60}; do
  if docker exec "$container_name" pg_isready -h 127.0.0.1 -U postgres -d restore_check > /dev/null 2>&1; then break; fi
  sleep 1
done
docker exec -i "$container_name" pg_restore --exit-on-error --clean --if-exists --no-owner --no-acl -U postgres -d restore_check < "$scratch_dir/db.dump"
docker exec "$container_name" psql -U postgres -d restore_check -v ON_ERROR_STOP=1 -c \
  "SELECT (SELECT count(*) FROM activities) AS activities, (SELECT count(*) FROM training_plans) AS plans, (SELECT count(*) FROM flyway_schema_history WHERE success) AS migrations;"
printf '%s\n' 'Odtworzenie i kontrola backupu zakończone. Baza aplikacji nie była modyfikowana.'
