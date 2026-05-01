# Strava Training Analyzer — Opis funkcjonalny

> Aplikacja typu **self-hosted** do zaawansowanej analizy treningów kolarskich.
> Pobiera dane ze **Stravy** (przez OAuth2) i opcjonalnie z **Garmina**.
> Java/Spring Boot + React/TypeScript, architektura heksagonalna.

---

## 1. Integracje zewnętrzne

| Integracja | Opis |
|---|---|
| **Strava API** | Logowanie OAuth2, automatyczny import aktywności, odświeżanie tokenów, webhooki. |
| **Garmin Connect** | Logowanie na konto Garmin (email/hasło) — synchronizacja danych zdrowotnych: HRV, tętno spoczynkowe, sen (fazy deep/light/REM), Body Battery, stres, kroki. |
| **Pogoda (OpenWeather)** | Pobieranie aktualnej pogody i prognozy dla zapisanych lokalizacji. Cache'owanie i automatyczne odświeżanie. |
| **AI/LLM** | Obsługa wielu modeli: Ollama (lokalnie), OpenAI, Anthropic Claude, Azure OpenAI, Gemini. Obsługa MCP (Model Context Protocol). |
| **Routing (ORS/OSRM)** | Silnik routingu do planowania tras. |

---

## 2. Strony (frontend)

| Ścieżka | Strona | Opis |
|---|---|---|
| `/` | **Home** | Ostatni trening z mapą, zdjęciami i opisem AI. Karuzela osiągnięć. Widgety: pogoda, gotowość, blok treningowy, postęp. Ostatnie aktywności. |
| `/dashboard` | **Centrum danych** | Kompleksowy pulpit: widget pogodowy, widgety focus (Readiness, Obciążenie, Aktywności, Plan, Coach AI), gotowość na dziś, FTP/progres, podsumowanie tygodnia/obciążenia (PMC), strefy mocy (donut), optymalne obciążenie, analiza bloku, ostatnie aktywności + rady AI. |
| `/profile` | **Profil** | Avatar, statystyki (FTP, waga, CTL, dystans, seria tygodni), 4-tygodniowe podsumowanie, galeria zdjęć, tygodniowe wolumeny, trend MMP, odznaki/osiągnięcia. |
| `/activities` | **Lista aktywności** | Tabela z filtrowaniem (sportType, dystans, czas, moc, tętno). Widok listy i widok kart (feed). |
| `/activities/:id` | **Szczegóły aktywności** | Mapa trasy (Leaflet). Zakładki: przegląd, analiza (streamy mocy/HR/kadencji/wysokości z interaktywnym brushowaniem), okrążenia, zaawansowane statystyki, AI Coach. |
| `/analytics` | **Analityka** | 4 zakładki: PMC (CTL/ATL/TSB), krzywa mocy (z porównaniem okresów), obciążenie (dzienne + tygodniowe TSS + strefy mocy), trendy (FTP + EF + porównanie sezonów). |
| `/training` | **Planer treningowy** | 3 zakładki: biblioteka jednostek (workout templates), kalendarz treningowy (z cockpit trenera i generatorem planu), programy treningowe. |
| `/health` | **Zdrowie** | Regeneracja (wskaźnik 0-100), HRV (RMSSD), tętno spoczynkowe, sen (wynik + fazy deep/light/REM/awake), Body Battery, stres. Wykresy 30-dniowe. Alerty regeneracyjne. |
| `/weather` | **Studio pogody** | Mapa klików (wybór punktu), algorytm scoringowy (temperatura, wiatr, opady z konfigurowalnymi wagami), decyzja treningowa, okna jazdy, prognoza dzień/tydzień. |
| `/route-planner` | **Planowanie trasy** | Mapa z waypointami (przeciąganie), generowanie tras z historii przejazdów, alternatywy, profil wysokościowy, eksport GPX. Integracja z pogodą. |
| `/weight` | **Waga** | Aktualna waga, cel wagowy, tempo zmian (kg/tydz.), wykres historii, tabela, dodawanie pomiarów. |
| `/ai-predictions` | **Predykcje AI** | Status modułu AI, 7 typów predykcji (FTP, zmęczenie, rekomendacja treningu, trend wydajności, ryzyko przetrenowania, gotowość startowa, podsumowanie trenera). Historia predykcji. |
| `/admin` | **Ustawienia** | Integracje (Strava + Garmin), sync i dane (pełny/przyrostowy sync, zdjęcia, streamy, odbudowa heatmapy/historii FTP, kasowanie danych), przetwarzanie (cache pogody, batch AI). |

---

## 3. Obliczane metryki treningowe

| Metryka | Opis |
|---|---|
| **NP** (Normalized Power) | Wyrównana moc — 30s średnia krocząca, 4. potęga, średnia, 4. pierwiastek |
| **TSS** (Training Stress Score) | Obciążenie treningowe wg NP, IF i czasu |
| **hrTSS** | TSS na podstawie tętna (gdy brak pomiaru mocy) |
| **IF** (Intensity Factor) | NP / FTP |
| **EF** (Efficiency Factor) | NP / średnie HR |
| **Aerobic Decoupling** | Różnica stosunku NP:HR między 1. a 2. połową (>5% = słaba wytrzymałość) |
| **Power Fade** | Spadek mocy między pierwszą a ostatnią ćwiartką aktywności |
| **Power Curve** | Najlepsze średnie moce: 1s, 5s, 10s, 30s, 1min, 2min, 5min, 10min, 20min, 30min, 60min, 90min, 120min |
| **Time in Zones** | Czas w strefach mocy/tętna |
| **CTL** (Chronic Training Load) | Fitness — średnia ważona TSS z ~42 dni |
| **ATL** (Acute Training Load) | Zmęczenie — średnia ważona TSS z ~7 dni |
| **TSB** (Training Stress Balance) | Forma = CTL - ATL |
| **Training Monotony** | Średnia TSS / odchylenie standardowe TSS (ryzyko > 2.0) |
| **Training Strain** | Suma TSS × monotonia (ryzyko > 400) |
| **TRIMP** | Training Impulse — obciążenie na podstawie tętna |
| **Variability Index** | Zmienność mocy |
| **W' Balance** | Balans energii beztlenowej w czasie |
| **Power Fade** | Spadek mocy w czasie wysiłku |
| **Grade-Adjusted Pace** | Tempo skorygowane o nachylenie |
| **Peak Efforts** | Najlepsze wysiłki dla zadanego czasu |

---

## 4. System planowania treningowego

- **Workout Templates** — biblioteka gotowych jednostek z krokami (moc, czas, kategoria, IF, TSS)
- **Eksport jednostek** — ZWO (Zwift), FIT (Garmin)
- **Training Calendar** — widok tygodnia z planem i wykonanymi aktywnościami
- **Training Programs** — programy z celami, priorytetami i planami tygodniowymi
- **Plan Generator** — automatyczne generowanie planu z programu
- **Training Session Role Resolver** — klasyfikuje jednostki na role: LONG_ENDURANCE, THRESHOLD_QUALITY, VO2_QUALITY, RECOVERY, ENDURANCE
- **Training Day Environment** — łączy pogodę z dniem treningowym (outdoor score, okno)
- **Block Health** — ocena czy blok dowozi właściwy bodziec
- **Progression Levels** — poziom progresji z target load i rekomendacją
- **Adjustment Feedback** — feedback od korekt planu
- **Readiness** — poranny check-in (sen, świeżość, motywacja, bolesność) + quality windows + session variants
- **Durability Insights** — ocena odporności na zmęczenie (decoupling + power fade)

---

## 5. System osiągnięć (grywalizacja)

Typy: **DISTANCE**, **STREAK**, **FTP**, **ELEVATION**, **CONSISTENCY**.
Automatyczna ewaluacja i przyznawanie.

---

## 6. AI / Coach

- **7 typów predykcji**: FTP, fatigue, rekomendacja treningu, trend wydajności, ryzyko przetrenowania, gotowość startowa, podsumowanie trenera
- **AI Activity Notes** — automatyczne generowanie opisów aktywności przez LLM
- **Batch Processing** — masowe generowanie predykcji
- **Today Tips** — dzienne porady AI
- **Tool Calling / MCP** — model może odpytwać bazę danych
- **RAG** — wyszukiwanie semantyczne w embeddingach
- **Custom Prompts** — własne szablony promptów
- **Weryfikacja predykcji** — porównanie z rzeczywistymi danymi

---

## 7. System pogodowy

- Zapisane lokalizacje z możliwością aktywacji
- Cache OpenWeather z schedulowanym odświeżaniem
- **Studio pogody**: mapa klików, konfigurowalny scoring (temperatura, wiatr, opady, wagi)
- Decyzja treningowa indoor/outdoor
- Najlepsze okno dziś i jutro
- Widok dnia i tygodnia

---

## 8. System zdrowia (Garmin)

- Import z Garmin Connect: HRV, tętno spoczynkowe, sen (deep/light/REM/awake), Body Battery, stres, kroki
- Wskaźnik regeneracji (0-100) z alertami
- Trendy 30-dniowe dla każdej metryki

---

## 9. Heatmapa tras

Renderowana na serwerze (Java) z:
- Regulowaną szerokością linii wg zoom
- Gaussian blur (łączenie bliskich segmentów)
- Koloryzacją density (niebieski → cyjan → żółty → czerwony)
- Normalizacją per-tile

---

## 10. Zarządzanie wagą

- Pomiar wagi z datą i notatkami
- Cel wagowy (target + data)
- Tempo zmian (kg/tydzień)
- Wykres + tabela historii

---

## 11. Readiness / Gotowość

- **Check-in**: jakość snu, świeżość nóg, motywacja, bolesność mięśni
- **Health Signals**: korekta score wg danych z Garmina (HRV, tętno spoczynkowe)
- **Day Type Classification**: HARD_TRAINING, ENDURANCE, RECOVERY, RACE, REST
- **Quality Windows**: 3 okna (dziś/jutro/pojutrze) z prognozą score i focusem
- **Session Variants**: sugerowane typy sesji na dziś
- **Tomorrow Hint**: podpowiedź na jutro

---

## 12. Inne

- **Dark mode UI** z spójnym systemem tokenów
- **Mobile-first**: swipeable content, pull-to-refresh, dolna nawigacja
- **Self-hosted**: pełen stack w Dockerze
- **Automatyczne przeliczanie** metryk po syncu (MetricRegistry + 17 kalkulatorów)
- **Odbudowa historii FTP** z wszystkich aktywności
- **Porównanie sezonów** i dowolnych okresów
- **Heatmapa tras** (własny renderer w Javie)
- **Studio pogody** z konfigurowalnym scoringiem
