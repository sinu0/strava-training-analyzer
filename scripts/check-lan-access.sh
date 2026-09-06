#!/usr/bin/env bash
# Disposable HTTPS/auth smoke test, with no production credentials or public ports.
set -euo pipefail
umask 077
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
scratch_dir="$(mktemp -d)"
container_name="strava-lan-check-$$"
container_started=false
cleanup() {
  if [[ "$container_started" == true ]]; then docker stop --time 2 "$container_name" > /dev/null; fi
  rm -f -- "$scratch_dir/lan.pem" "$scratch_dir/lan-key.pem" "$scratch_dir/lan.htpasswd"
  rmdir -- "$scratch_dir"
}
trap cleanup EXIT
openssl req -x509 -newkey rsa:2048 -nodes -keyout "$scratch_dir/lan-key.pem" -out "$scratch_dir/lan.pem" -days 1 -subj /CN=localhost > /dev/null 2>&1
printf '%s\n' 'isolated-test-password' | htpasswd -niB lan-test > "$scratch_dir/lan.htpasswd"
chmod 644 "$scratch_dir/lan.htpasswd"
docker run -d --rm --name "$container_name" -p 127.0.0.1::443 \
  -v "$project_dir/frontend/nginx.conf:/etc/nginx/conf.d/default.conf:ro" \
  -v "$project_dir/frontend/nginx.https.conf:/etc/nginx/conf.d/https.conf:ro" \
  -v "$scratch_dir/lan.pem:/etc/nginx/certs/lan.pem:ro" \
  -v "$scratch_dir/lan-key.pem:/etc/nginx/certs/lan-key.pem:ro" \
  -v "$scratch_dir/lan.htpasswd:/etc/nginx/secrets/lan.htpasswd:ro" \
  "${TEST_FRONTEND_IMAGE:-stravaanalizator-frontend:latest}" > /dev/null
container_started=true
port="$(docker port "$container_name" 443/tcp | cut -d: -f2)"
for attempt in {1..30}; do
  if curl --insecure --silent --output /dev/null "https://127.0.0.1:$port/"; then break; fi
  sleep 1
done
unauthorized="$(curl --insecure --silent --output /dev/null --write-out '%{http_code}' "https://127.0.0.1:$port/")"
authorized="$(curl --insecure --silent --output /dev/null --write-out '%{http_code}' --user lan-test:isolated-test-password "https://127.0.0.1:$port/")"
cross_site="$(curl --insecure --silent --output /dev/null --write-out '%{http_code}' --user lan-test:isolated-test-password -H 'Sec-Fetch-Site: cross-site' -X POST "https://127.0.0.1:$port/api/v2/training/context")"
[[ "$unauthorized" == 401 && "$authorized" == 200 && "$cross_site" == 403 ]]
printf 'LAN HTTPS: bez hasła=%s, po zalogowaniu=%s, zapis cross-site=%s\n' "$unauthorized" "$authorized" "$cross_site"
