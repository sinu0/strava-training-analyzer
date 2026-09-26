# Optional LAN access

[← README](../README.md)

The default Compose binds ports to `127.0.0.1` only. Do not switch the backend or database to `0.0.0.0`. Access from other devices is optional and requires HTTPS and a password:

1. Prepare a certificate trusted by your devices, `certs/lan.pem`, and key `certs/lan-key.pem`, matching the host name/IP (`tools/setup-lan-https.sh <ip>` creates them with mkcert). Never publish the private key.
2. Run `bash scripts/setup-lan-auth.sh <user>` and set a strong, unique password. The password is not passed as an argument or stored in plain text; the file contains a bcrypt hash.
3. In `.env` set `APP_FRONTEND_URL=https://host-name-or-ip` (the exact address opened on the device, including a non-standard port) so the backend accepts writes from that origin. Do not use `*`.
4. Only then run `docker compose -f docker-compose.yml -f docker-compose.https.yml up -d --build`.

A missing password file blocks the HTTPS variant from starting. HTTPS protects both the UI and the API. Writes initiated by a foreign site (`Sec-Fetch-Site: cross-site`) are rejected. This is not a multi-user permission system: every logged-in user has access to the same private installation. Do not expose it directly to the Internet; use a trusted network/VPN for access from outside home.

`bash scripts/check-lan-access.sh` verifies 401 without a password, 200 after login and 403 for a cross-site write, on a temporary container with a loopback-only port. It does not enable LAN access in the running app.
