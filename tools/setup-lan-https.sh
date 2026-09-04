#!/usr/bin/env bash
set -euo pipefail

if [[ ${#} -ne 1 ]]; then
  echo "Użycie: tools/setup-lan-https.sh <adres-IP-lub-nazwa-DNS-komputera>"
  exit 2
fi
if ! command -v mkcert >/dev/null 2>&1; then
  echo "Brak mkcert. Zainstaluj mkcert i uruchom polecenie ponownie."
  exit 1
fi

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
mkdir -p "${project_dir}/certs"
mkcert -install
mkcert -cert-file "${project_dir}/certs/lan.pem" -key-file "${project_dir}/certs/lan-key.pem" localhost 127.0.0.1 ::1 "${1}"

echo "Certyfikat zapisany. Uruchom:"
echo "docker compose -f docker-compose.yml -f docker-compose.https.yml up -d --build"
echo "Na telefonie zaufaj CA zwróconemu przez: mkcert -CAROOT"
