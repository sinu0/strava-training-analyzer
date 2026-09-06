#!/usr/bin/env bash
set -euo pipefail
umask 077
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ $# != 1 || ! "$1" =~ ^[a-zA-Z0-9_.-]{1,64}$ ]]; then printf 'Użycie: %s nazwa-użytkownika\n' "$0" >&2; exit 2; fi
command -v htpasswd > /dev/null || { printf '%s\n' 'Wymagane narzędzie htpasswd (Apache utilities), z obsługą bcrypt.' >&2; exit 1; }
mkdir -p -- "$project_dir/secrets"
chmod 700 -- "$project_dir/secrets"
auth_path="$project_dir/secrets/lan.htpasswd"
if [[ -f "$auth_path" ]]; then htpasswd -B "$auth_path" "$1"; else htpasswd -cB "$auth_path" "$1"; fi
# Nginx workers read this single read-only bind mount. The host directory remains 0700.
chmod 644 -- "$auth_path"
printf '%s\n' 'Zapisano hash bcrypt. Dostęp LAN pozostaje wyłączony do jawnego uruchomienia pliku docker-compose.https.yml.'
