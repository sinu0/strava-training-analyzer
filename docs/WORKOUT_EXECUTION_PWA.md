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

## Test manualny na urządzeniu

- zainstalować CA i sprawdzić HTTPS bez ostrzeżenia;
- zainstalować PWA na Androidzie i iOS;
- rozpocząć trening, zgasić ekran lub przełączyć aplikację na 2–3 minuty i wrócić;
- odświeżyć stronę i zrestartować telefon, a następnie wznowić ten sam krok i czas;
- odłączyć sieć, wykonać pauzę, LAP i zmianę intensywności, przywrócić sieć i sprawdzić synchronizację;
- potwierdzić dźwięk, wibrację i Wake Lock albo jawny fallback urządzenia;
- pobrać FIT i skopiować go do Garmin/NewFiles, następnie otworzyć trening na fizycznym Garminie.
