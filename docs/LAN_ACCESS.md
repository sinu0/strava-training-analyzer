# Opcjonalny dostęp LAN

Domyślny Compose wiąże porty tylko z `127.0.0.1`. Nie zmieniaj backendu ani bazy na `0.0.0.0`. Dostęp z innych urządzeń jest opcjonalny i wymaga HTTPS oraz hasła:

1. Przygotuj zaufany na urządzeniach certyfikat `certs/lan.pem` i klucz `certs/lan-key.pem`, pasujące do nazwy/IP hosta. Nie publikuj klucza prywatnego.
2. Uruchom `bash scripts/setup-lan-auth.sh użytkownik` i ustaw silne, unikalne hasło. Hasło nie jest przekazywane w argumentach ani zapisywane jawnie; plik zawiera bcrypt.
3. W `.env` ustaw `APP_FRONTEND_URL=https://nazwa-lub-ip-hosta` (dokładny adres otwierany na urządzeniu, z portem jeśli niestandardowy), aby backend akceptował zapis z tego originu. Nie ustawiaj `*`.
4. Dopiero wtedy uruchom `docker compose -f docker-compose.yml -f docker-compose.https.yml up -d --build`.

Brak pliku hasła blokuje uruchomienie wariantu HTTPS. HTTPS chroni zarówno UI, jak i API. Zapis inicjowany przez obcą witrynę (`Sec-Fetch-Site: cross-site`) jest odrzucany. Nie jest to wieloużytkownikowy system uprawnień: wszyscy zalogowani mają dostęp do tej samej prywatnej instalacji. Nie wystawiaj jej bezpośrednio do Internetu; do dostępu spoza domu użyj zaufanej sieci/VPN.

`bash scripts/check-lan-access.sh` sprawdza 401 bez hasła, 200 po zalogowaniu i 403 dla zapisu cross-site na tymczasowym kontenerze z portem wyłącznie loopback. Nie włącza dostępu LAN w działającej aplikacji.

PWA przechowuje część treningu offline na urządzeniu. Korzystaj z zaufanych urządzeń; przed przekazaniem urządzenia innej osobie wyczyść dane witryny. Hasło HTTP Basic może pozostać w pamięci przeglądarki do zamknięcia sesji.
