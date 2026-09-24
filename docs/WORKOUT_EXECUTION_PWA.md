# Wykonywanie treningów i PWA

## Bezpieczny dostęp z telefonu w LAN

Service Worker, instalacja PWA i Screen Wake Lock wymagają bezpiecznego originu. localhost
jest wyjątkiem tylko na tym samym urządzeniu; adres http://192.168.x.x nie jest gotowym
środowiskiem PWA.

1. Utwórz lokalny, zaufany certyfikat:

       tools/setup-lan-https.sh 192.168.1.20

2. Zainstaluj lokalny certyfikat CA z polecenia mkcert -CAROOT jako zaufany na telefonie.
3. Uruchom wariant HTTPS:

       docker compose -f docker-compose.yml -f docker-compose.https.yml up -d --build

4. Otwórz https://192.168.1.20, potwierdź kłódkę bez ostrzeżenia i zainstaluj aplikację.

Interfejs pokazuje jawne ostrzeżenie, gdy origin nie zapewnia PWA/offline. Bazowy Compose
pozostaje przypięty do loopbacka; rozszerzenie HTTPS świadomie wystawia wyłącznie port 443.

## Model offline

Snapshot aktywnego wykonania trafia do IndexedDB, z odzyskiwalną kopią w localStorage.
Pauza, wznowienie, krok, LAP i intensywność są natychmiast stosowane lokalnie. Przy utracie
sieci idempotentne zmiany trafiają do uporządkowanej kolejki i są wysyłane po zdarzeniu
online. Timer odtwarza stan z timestampów; interwał UI służy wyłącznie do odświeżania.

Service Worker cachuje minimalny app shell i odwiedzane zasoby statyczne. Nowy worker nie
wywołuje skipWaiting, gdy zapisany jest aktywny trening, więc aktualizacja nie przeładowuje
odtwarzacza w trakcie sesji.

## Garmin i eksport

FIT jest kodowany oficjalnym com.garmin:fit SDK. File ID ma losowy unikalny serial,
komunikaty są zapisywane jako File ID → Workout → Workout Step, a powtórzenia, otwarte
kroki i cele procentowe FTP korzystają z aktualnego profilu FIT. Eksport zaplanowanego
treningu zawsze używa snapshotu i FTP zapisanych w planie.

Automatyczny Garmin Connect upload nie jest implementowany. Capability GARMIN pozostaje
UNAVAILABLE, dopóki aplikacja nie uzyska dostępu do Garmin Connect Developer Program
i nie wdroży oficjalnego OAuth 2.0. Pobranie FIT/ZWO oraz kopiowanie FIT przez USB do
Garmin/NewFiles są obsługiwanym fallbackiem.

## Tryb trenażera (Bluetooth)

Odtwarzacz `/workout/:id` jest kokpitem trenażera: moc (3 s), kadencja i tętno na żywo,
bieżący krok z odliczaniem i strefą, plan interwałów, profil z przejechaną mocą oraz
sterowanie ERG / opór / wolna jazda. Skróty klawiszowe: spacja pauza, ↑/↓ intensywność ±1%,
→ pomiń krok, ← powtórz krok.

Urządzenia łączą się przez Web Bluetooth:

- trenażer — Fitness Machine Service (FTMS 0x1826), np. Elite Suito: dane z Indoor Bike Data,
  sterowanie przez Control Point (ERG, opór); fallback Cycling Power (0x1818) tylko do odczytu;
- pasek tętna — Heart Rate Service (0x180D), np. Garmin HRM-Dual / HRM-Pro / HRM 600
  (starsze paski tylko ANT+ nie są widoczne w przeglądarce).

Po zerwaniu połączenia aplikacja łączy się ponownie z backoffem (1 → 30 s) i przywraca cel ERG.
Pauza i koniec treningu zwalniają opór trenażera.

Wymagania przeglądarki: Chrome/Edge na komputerze (Linux z BlueZ; jeśli wybór urządzenia się
nie otwiera, włącz `chrome://flags/#enable-web-bluetooth`) albo Chrome na Androidzie przez HTTPS
(patrz sekcja o LAN). Safari/iOS nie obsługuje Web Bluetooth.

Tryb demo bez sprzętu: dodaj `?devices=sim` do adresu odtwarzacza — trenażer i pasek są
symulowane deterministycznie (ten sam tryb wykorzystują testy e2e).

### Nagrywanie w aplikacji (opcjonalne)

Przełącznik „Nagrywaj przejazd w aplikacji” w panelu urządzeń zapisuje próbki 1 Hz (moc, tętno,
kadencja, prędkość) w IndexedDB w paczkach po 60 s. Po treningu paczki są wysyłane idempotentnie
(`POST /api/v2/workouts/executions/{id}/samples`), a podsumowanie oferuje plik FIT
(`GET /api/v2/workouts/executions/{id}/export/activity.fit`, oficjalny Garmin FIT SDK: rekordy,
okrążenie na każdy krok, sesja indoor cycling). Wyłączone: przejazd nagrywa Garmin, ocena
przychodzi po synchronizacji ze Stravą. Jeśli Garmin nagrywa równolegle, pozwól mu tylko
odczytywać dane z Suito — trenażer słucha jednej aplikacji sterującej.

## Test manualny na urządzeniu

- zainstalować CA i sprawdzić HTTPS bez ostrzeżenia;
- zainstalować PWA na Androidzie i iOS;
- rozpocząć trening, zgasić ekran lub przełączyć aplikację na 2–3 minuty i wrócić;
- odświeżyć stronę i zrestartować telefon, a następnie wznowić ten sam krok i czas;
- odłączyć sieć, wykonać pauzę, LAP i zmianę intensywności, przywrócić sieć i sprawdzić synchronizację;
- potwierdzić dźwięk, wibrację i Wake Lock albo jawny fallback urządzenia;
- pobrać FIT i skopiować go do Garmin/NewFiles, następnie otworzyć trening na fizycznym Garminie.

### Trenażer i pasek (Elite Suito + Garmin HRM)

- Chrome na Linuksie i Android: połączyć Suito i pasek z panelu „Urządzenia”, sprawdzić nazwę, baterię i możliwości (ERG, opór);
- w ERG zmienić krok i intensywność ±5% — opór trenażera ma się zmienić w ciągu ~1 s;
- przełączyć na „Opór” i przesunąć suwak, potem „Wolna” — trenażer ma przestać sterować;
- pauza zwalnia opór, wznowienie przywraca cel;
- zdjąć pasek / wyłączyć trenażer na ~10 s — status „utracono — ponawiam…”, potem samoczynny powrót;
- włączyć nagrywanie, przejechać kilka minut, zakończyć, pobrać FIT i otworzyć go w Garmin Connect lub wgrać do Stravy.
