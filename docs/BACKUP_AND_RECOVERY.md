# Backup i odtwarzanie

`bash scripts/backup.sh` zapisuje spójny zrzut PostgreSQL, plik `.env` potrzebny m.in. do odszyfrowania tokenów oraz sumy SHA-256. Kopie mają uprawnienia 0600 i są wykluczone z Git. Zawierają prywatne dane i sekrety — nie załączaj ich do zgłoszeń.

Przed wyniesieniem kopii poza host zaszyfruj ją kluczem odbiorcy:

```bash
BACKUP_GPG_RECIPIENT=identyfikator-klucza bash scripts/backup.sh
bash scripts/verify-backup.sh /pełna/ścieżka/backups/strava-....tar.gpg
```

Weryfikator sprawdza sumy i odtwarza zrzut do osobnego kontenera bez portów i sieci. Nie nadpisuje bazy aplikacji; tymczasowy kontener i odszyfrowane pliki usuwa po zakończeniu. Wymaga lokalnego obrazu bazy (`docker compose build db`) i, przy szyfrowaniu, klucza prywatnego GPG. Kopia sprzed migracji pozostaje poprawna: Flyway uzupełni nowsze migracje po odtworzeniu.

Harmonogram zalecany dla instalacji prywatnej: codzienna kopia, cotygodniowa próba odtworzenia, kopia przed migracjami. Zachowuj co najmniej 7 kopii dziennych i 4 tygodniowe, jedną zaszyfrowaną kopię poza hostem. Skrypty celowo nie usuwają starych kopii automatycznie; przed ręczną rotacją sprawdź odtworzenie najnowszej.

Odtworzenie produkcyjne jest osobną, świadomą operacją: zatrzymaj backend, zachowaj awaryjną kopię obecnej bazy, odtwórz zweryfikowany zrzut do **nowej** bazy/wolumenu, przywróć odpowiadający mu `ENCRYPTION_KEY` z chronionego `config.env`, przełącz konfigurację i uruchom `docker compose up -d --build`. Nie usuwaj poprzedniego wolumenu do czasu sprawdzenia danych i logowania. `.env` nie jest ładowany przez weryfikator i nie może być bezrefleksyjnie wykonywany jako skrypt.
