# Pełny Audyt Aplikacji Strava Training Analyzer

> Audyt architektury, UX, logiki treningowej, duplikacji i spójności produktu.
> **Cel: maksymalizacja efektów treningowych użytkownika, minimalizacja chaosu.**

---

## 1. Executive Summary

### Główne problemy (TL;DR)

Aplikacja cierpi na **syndrom feature creep bez priorytetyzacji**. Zbudowano ogromną ilość funkcji (14+ stron, 27+ kontrolerów REST, 95 DTO, 12 typów predykcji AI, 5 systemów decyzyjno-coachingowych), ale:

1. **BRAK JEDNEGO ŹRÓDŁA PRAWDY TRENINGOWEJ** — użytkownik ma 5 równoległych systemów mówiących mu "co robić dziś" (DailyDecision, AdaptiveCoach, SmartCoach, AiCoachDashboard, DailyCheckIn) i żaden nie jest jednoznacznie nadrzędny.

2. **DASHBOARD JEST PRZECIĄŻONY POZNAWCZO** — 20+ widgetów/panelek w 3 kolumnach. Użytkownik nie wie gdzie patrzeć. To zniechęca.

3. **DUPLIKACJA SYSTEMÓW DECYZYJNYCH** — DailyDecisionEngine i AdaptiveCoachService robią to samo (odpowiadają na pytanie "trenować dziś czy nie?") ale różnymi ścieżkami, z różnymi modelami danych, różnymi endpointami i różnymi UI.

4. **AI JEST ROZPROSZONE** — predykcje V1/V2, activity notes, coach summary, tips carousel, custom prompts, MCP server, Ollama management, knowledge base RAG — wszystko osobno, bez spójnego "coaching experience".

5. **ARCHITEKTURA JEST POPRAWNA, ALE PRZEROSTA** — hexagonal architecture, clean domain models, ports & adapters — wszystko to jest świetne inżynieryjnie, ale nadmiar warstw AI (V1 + V2 + Stream + ActivityNote + CustomPrompt + MCP) tworzy chaos na poziomie produktowym.

### Największe szanse

1. **SKONSOLIDOWAĆ SYSTEMY DECYZYJNE W JEDEN** — DailyDecision + AdaptiveCoach + SmartCoach → jeden "Coach Engine" z jednym endpointem i jednym UI.
2. **ZREDUKOWAĆ DASHBOARD DO 5 KLUCZOWYCH ELEMENTÓW** — decyzja dnia, gotowość, PMC mini, ostatni trening, event countdown. Reszta → osobne strony.
3. **AI JAKO SPÓJNY COACH, NIE ZBIÓR NARZĘDZI** — zamiast 6 kontrolerów AI, jeden spójny system coachingowy (zobacz TrainerRoad AI).
4. **FTP AUTO-DETECTION Z DANYCH MOCY** (jak Intervals.icu i TrainerRoad) — to największa luka treningowa.
5. **USUNĄĆ STRONY, KTÓRE NIE DAJĄ REALNEJ WARTOŚCI** — Route Planner, Admin (dla użytkownika), Weather jako osobna strona.

---

## 2. Największe błędy

### Błędy UX

| Lp. | Problem | Skutek |
|-----|---------|--------|
| 1 | Dashboard z 20+ widgetami w 3 kolumnach | Przeciążenie poznawcze, użytkownik scrolluje zamiast decydować |
| 2 | 5 systemów decyzyjnych obok siebie | Chaos decyzyjny — który komunikat jest właściwy? |
| 3 | 12 pozycji w sidebarze + mobile nav 5 itemów | Za dużo opcji, brak priorytetyzacji nawigacji |
| 4 | Brak onboardingu | Nowy użytkownik widzi pusty dashboard i mnóstwo opcji |
| 5 | AI Tips carousel, Coach Summary, SmartCoach, AiCoach — wszystko obok siebie | AI nie ma jednej twarzy, jest "wszędzie i nigdzie" |
| 6 | TrainingPlanPage z 5 zakładkami | Za dużo funkcji w jednym widoku (Library, Calendar, Builder, Programs, Adaptation) |
| 7 | Brak mobile-first flow decyzyjnego | Mobile ma te same widgety co desktop, tylko węższe |

### Błędy funkcjonalne

| Lp. | Problem | Skutek |
|-----|---------|--------|
| 1 | DailyDecision nie uwzględnia fazy treningowej (base/build/peak) | Decyzja jest zawsze "lokalna", bez kontekstu sezonu |
| 2 | Brak auto-detekcji FTP z danych mocy | Użytkownik musi ręcznie aktualizować FTP |
| 3 | Weight module nie integruje się z treningiem | Waga i trening to osobne światy |
| 4 | Brak integracji treningu siłowego | Aplikacja widzi tylko rower |
| 5 | Weather scoring istnieje, ale nie jest transparentnie używany w decyzjach | Użytkownik nie rozumie dlaczego weather wpływa na decyzję |
| 6 | Programy treningowe nie mają auto-adaptacji do rzeczywistego wykonania | Plan Builder generuje, ale nie adaptuje automatycznie |

### Błędy architektoniczne

| Lp. | Problem | Skutek |
|-----|---------|--------|
| 1 | Dwa równoległe systemy decyzyjne (DailyDecision + AdaptiveCoach) | Duplikacja logiki, niespójność DTO, 2× development |
| 2 | AI V1 + V2 — V1 powinno być już dawno usunięte | Martwy kod, 2× hooki, 2× typy, 2× endpointy |
| 3 | AdaptiveCoachService sam tworzy engine'y (`new GoalEngine()`) zamiast DI | Trudne do testowania, brak spójności z hexagonal architecture |
| 4 | AnalyticsService jest "god service" — 750+ linii hooków frontowych, mnóstwo odpowiedzialności | Trudny w utrzymaniu, słaba separacja |
| 5 | 95 DTO w jednym pakiecie `application/dto/` | Chaos nazewniczy, trudno znaleźć konkretne DTO |
| 6 | Coach domain models w osobnej paczce `domain/coach/model/` | Niepotrzebna separacja — modele coacha i daily decision mogłyby być jednym bounded contextem |

### Błędy treningowe

| Lp. | Problem | Skutek |
|-----|---------|--------|
| 1 | Brak periodization-aware decyzji | Decyzja "trenuj/odpoczywaj" nie wie, czy jesteś w tygodniu bazowym czy taper |
| 2 | Brak tygodniowego limitu TSS/load | Użytkownik może przekroczyć optymalne obciążenie bez ostrzeżenia |
| 3 | Brak sugestii "co dokładnie robić na treningu" | Decyzja mówi "RIDE" lub "MODIFY", ale nie daje konkretnego workoutu |
| 4 | Brak analizy trendu mocy w kontekście masy ciała | W/kg to kluczowa metryka kolarska — nieobecna |
| 5 | Brak wykrywania plateau | Użytkownik nie wie, czy progres stoi w miejscu |

---

## 3. Największe wygrane (co jest dobre)

### Produkt

1. **DailyDecisionEngine** (`backend/.../domain/model/DailyDecisionEngine.java`) — **ŚWIETNY**. Czysta logika domenowa, zero frameworku, jasna priorytetyzacja (Safety > Adaptation > Plan > Context). To powinien być FUNDAMENT całego systemu decyzyjnego.

2. **PMC + power curve + zone distribution** — klasyczne, niezbędne metryki kolarskie są obecne i poprawne.

3. **Dark theme UI z design tokens** — spójny wizualnie, profesjonalny wygląd.

4. **TanStack Query + cache invalidation** — dobrze zorganizowane, z centralnymi helperami do invalidacji.

5. **Struktura hexagonalna** — domain jest naprawdę czysty. Porty i adaptery są dobrze rozdzielone. To rzadkość w projektach "vibe coding".

6. **Flyway migrations** — pełna historia schematu bazy danych.

7. **Automatyczny sync ze Stravą** — działa, z auto-syncem co 30 min.

### Architektura

1. **16 metric calculators** — dobrze odseparowane, testowalne kalkulatory metryk (NP, IF, TSS, hrTSS, CTL/ATL/TSB, VI, EF, etc.).

2. **Response interceptor z retry** — API client automatycznie retryuje GET na 5xx, emituje notyfikacje błędów.

3. **MapStruct mappery** — czyste mapowanie entity↔domain.

4. **Conditional beans dla AI** — AI module aktywuje się tylko gdy `ai.enabled=true`.

### Kod

1. **Frontend: lazy loading wszystkich stron** — dobra praktyka performance.

2. **ErrorBoundary + ErrorState + EmptyState + LoadingState** — pełna obsługa stanów UI.

3. **PullToRefreshPanel** — mobile-first gesture.

4. **TypeScript strict mode** — bezpieczeństwo typów.

---

## 4. Duplikacje

| Funkcja A | Funkcja B | Problem | Rekomendacja | Finalne rozwiązanie |
|-----------|-----------|---------|--------------|---------------------|
| **DailyDecisionService** (`/api/daily-decision`) | **AdaptiveCoachService** (`/api/adaptive-coach`) | Dwa systemy decyzyjne — oba odpowiadają "co robić dziś". DailyDecision: RIDE/SKIP/MODIFY/INDOOR. AdaptiveCoach: TRAIN/REST/ACTIVE_RECOVERY/RECOVER. Różne modele, różne DTO, różne UI. | **MERGE** — AdaptiveCoach jest bogatszy (goal setting, scoring, consistency, accountability) ale DailyDecisionEngine ma lepszą architekturę (czysty domain engine). | **Jeden Coach Engine**: zachowaj DailyDecisionEngine jako core, dodaj do niego goal tracking i session scoring z AdaptiveCoach. Jeden endpoint `/api/coach/today`. Jedno UI — karta decyzyjna na dashboard + osobna strona Coach do pogłębionej analizy. |
| **AI V1** (`/api/ai`) | **AI V2** (`/api/v2/ai`) | Dwa równoległe systemy predykcji AI. V1 ma 7 typów, V2 ma 12 typów + persona + model selection + RAG. V1 page redirectuje do V2. Martwy kod: AiPredictionPage, useAi hooks V1, PredictionResultCard (stary). | **REMOVE** V1 całkowicie. | Usuń `AiPredictionController`, `AiPredictionPage`, `useAi.ts` (oprócz `useAiStatus` i `useTodayAiTips`), stare typy `ai.ts`. |
| **SmartCoachWidget** (`/home/SmartCoachWidget`) | **AiCoachDashboardWidget** (`/home/AiCoachDashboardWidget`) | Dwa widgety na dashboardzie linkujące do AI/coacha. Oba są małe, oba prowadzą donikąd (SmartCoach → AdaptiveCoach page, AiCoach → AiV2 page). | **MERGE** — zostaw jeden przycisk "Coach AI" prowadzący do skonsolidowanej strony Coach. | Jeden widget `CoachWidget` na dashboardzie: pokazuje dzisiejszą rekomendację + link do pełnego coacha. |
| **ReasoningPanel** | **AlternativesPanel** (oba na dashboardzie) | Osobne komponenty na dashboardzie obok karty decyzyjnej. | **MERGE** — zintegruj reasoning i alternatives jako expandable sekcje w karcie decyzyjnej. | `DailyDecisionHeroCard` z wbudowanymi sekcjami "Dlaczego?" (reasoning) i "Alternatywy" (alternatives) — rozwijane po kliknięciu. |
| **DailyCheckInWidget** | **ReadinessMiniWidget** | Oba dotyczą gotowości. Readiness pokazuje score, CheckIn pozwala go zmodyfikować subiektywnie. | **MERGE** — jeden widget "Gotowość" z możliwością check-in. | Widget "Gotowość": pokazuje score, trend, pozwala na szybki subiektywny check-in (1-5 gwiazdek). |
| **FatigueWidget** | **EnergyBudgetWidget** | Oba pokazują dane z tego samego endpointu (`useFatigueState`). Są obok siebie w lewej kolumnie. | **MERGE** — jeden widget "Stan regeneracji" pokazujący fatigue + energy budget razem. | Widget "Regeneracja": fatigue level + energy budget (max TSS na dziś) + recovery debt. |
| **BlockMiniWidget** | **ProgressMiniWidget** | Oba mini widgety w lewej kolumnie dashboardu. Block pokazuje block health, Progress pokazuje progression levels. Niski priorytet, rzadko używane. | **MERGE** z PMC mini chart lub **REMOVE** z dashboardu → tylko w Analytics. | Usuń z dashboardu, dane dostępne w Analytics. |
| **WeatherPage** (osobna strona) | **WeatherMiniWidget** (dashboard) | Weather jako osobna strona z mapą, gradientem, scoringiem to overkill dla użytkownika-amatora. | **SIMPLIFY** — weather zostaje jako widget na dashboardzie + kontekst w decyzji dnia. Usuń osobną stronę. | Weather widget w headerze/dashboardzie. Konfiguracja lokalizacji przeniesiona do Profile/Settings. |
| **RoutePlannerPage** | **RouteHeatmap** (komponent) | Route planner z mapą, generowaniem tras, GPX exportem to funkcja "bo można". Nie wspiera treningu. | **REMOVE** — usuń ze strony użytkownika. Zostaw heatmapę jako wizualizację w ActivityDetail i Analytics. | Usuń Route Planner page i endpointy. Heatmapa zostaje. |
| **WeightPage** | **ProfilePage** (częściowo) | Waga mogłaby być częścią profilu/zakładki, a nie osobną stroną z 250+ liniami kodu. | **SIMPLIFY** — integruj wagę w Health page jako dodatkową zakładkę. | Health page z zakładkami: HRV/Sen/Stres + Waga. |
| **AdaptiveCoachPage** | **DashboardPage** (karta decyzyjna) | AdaptiveCoach page to rozbudowana wersja karty decyzyjnej z dashboardu — goal setting, session options, scoring. | **MERGE** — jedna strona Coach (dawniej AdaptiveCoach) jako główna strona decyzyjna. Dashboard pokazuje tylko podsumowanie + link. | Dashboard: karta z dzisiejszą decyzją + "Otwórz pełnego Coacha". Coach page: pełny interfejs decyzyjny. |

---

## 5. Uproszczenia

### Ekrany do usunięcia lub połączenia

Obecnie: **14 stron + 3 przekierowania**

Proponuję: **8 stron + 0 przekierowań**

| # | Obecna strona | Akcja | Nowa struktura |
|---|---------------|-------|----------------|
| 1 | `/` Dashboard | **KEEP** (uproszczony) | Dashboard: decyzja dnia + PMC mini + ostatni trening + event countdown + coach widget |
| 2 | `/activities` + `/activities/:id` | **KEEP** | Aktywności — lista + detal |
| 3 | `/analytics` | **KEEP** | Analityka — PMC, power curve, zones, trends, comparison |
| 4 | `/training` | **SIMPLIFY** | Trening: Calendar + Workout Library. Plan Builder i Programs → do Coacha. |
| 5 | `/health` | **MERGE z weight** | Zdrowie: HRV/Sen/Stres + Waga (jako zakładki) |
| 6 | `/coach` (nowa) | **MERGE: adaptive-coach + ai-v2 + daily-decision** | Coach: decyzja dnia, planowanie celów, AI insights, session options |
| 7 | `/profile` | **KEEP** | Profil: FTP, strefy, podsumowanie, achievements |
| 8 | `/admin` | **KEEP** (tylko admin) | Admin panel |
| — | `/weather` | **REMOVE** (widget na dashboardzie) | — |
| — | `/route-planner` | **REMOVE** | — |
| — | `/weight` | **MERGE → /health** | — |
| — | `/priorities` | **MERGE → /analytics** | — |
| — | `/ai-v2` | **MERGE → /coach** | — |
| — | `/adaptive-coach` | **MERGE → /coach** | — |

### Dashboard — z 20+ widgetów do 5 kluczowych elementów

**Obecny dashboard (lewa kolumna, centrum, prawa kolumna):**
- WeatherMiniWidget
- BlockMiniWidget
- ReadinessMiniWidget
- FatigueWidget
- EnergyBudgetWidget
- EventCountdownWidget
- ProgressMiniWidget
- Quick Links (4 linki)
- DailyDecisionHeroCard
- TrainingStatusBadge
- SmartCoachWidget
- AiCoachDashboardWidget
- DailyCheckInWidget
- ReasoningPanel
- AlternativesPanel
- PMC Mini Chart
- WeeklyBriefPanel
- Latest Activity
- Coach Summary AI
- Previous Activities (3)
- AI Tips Carousel
- FTP Progress

**Proponowany dashboard:**

```
┌─────────────────────────────────────────────────────────┐
│  DECYZJA DNIA                                           │
│  "TRENUJ" — 90 min ENDURANCE, outdoor                   │
│  Gotowość: 72/100 | TSB: -5 | Weather: OK               │
│  [Dlaczego?] [Alternatywy]                              │
├─────────────────────────────────────────────────────────┤
│  PMC MINI                │  OSTATNI TRENING             │
│  CTL: 65 ATL: 72 TSB: -7│  "Morning Ride" 45km 2.5h    │
│  [wykres mini]           │  Score: 85  Benefit: Tempo   │
├─────────────────────────────────────────────────────────┤
│  COACH                   │  EVENT                       │
│  "Cel: FTP +15W"         │  "Tour de Powiat" za 45 dni  │
│  Progress: 60%           │  CTL projection: on track    │
│                           │  [Otwórz pełny plan]        │
└─────────────────────────────────────────────────────────┘
```

### Uproszczenie flow decyzyjnego

**Stan obecny (5 ścieżek):**
1. Dashboard → DailyDecisionHeroCard (RIDE/SKIP/MODIFY/INDOOR)
2. Dashboard → DailyCheckInWidget → wpływa na decyzję
3. Dashboard → SmartCoachWidget → AdaptiveCoachPage
4. Dashboard → AiCoachDashboardWidget → AiV2Page
5. Sidebar → Adaptive Coach → osobna strona

**Stan proponowany (1 ścieżka):**
1. Dashboard → Karta decyzji (pokazuje rekomendację z Coach Engine)
2. Dashboard → Przycisk "Coach" → Coach Page (pełny interfejs: cel, opcje, AI insights, historia)

### Uproszczenie danych treningowych

- **PMC chart** — główny wykres w Analytics, mini-wersja na dashboardzie
- **Power curve** — full w Analytics, auto-detekcja FTP z power curve
- **Zone distribution** — w Analytics, pokaz trend czasowy (nie tylko snapshot)
- **Training status** — wbudowany w dashboard, nie jako osobny widget
- **Weekly brief** — dostępny na żądanie, nie jako osobny panel na dashboardzie

---

## 6. Spójność produktu

### Problem: aplikacja to zbiór funkcji, nie system

Obecnie aplikacja sprawia wrażenie kolekcji narzędzi (weather, weight, route planner, predictions, achievements, coach, priorities...) zamiast **jednego spójnego systemu treningowego**.

### Rozwiązanie: "Coach-First Architecture"

**Zasada nadrzędna:** Każda funkcja musi odpowiadać na jedno z 4 pytań użytkownika:

1. **"Co mam dziś zrobić?"** → Coach (decyzja dnia + workout)
2. **"Jak mi idzie?"** → Dashboard + Analytics (progres, trendy)
3. **"Co już zrobiłem?"** → Activities (historia, szczegóły)
4. **"Kim jestem jako atleta?"** → Profile + Health (FTP, waga, zdrowie)

Wszystko, co nie odpowiada na te pytania → do usunięcia lub ukrycia.

### Spójność danych

| Problem | Rozwiązanie |
|---------|-------------|
| FTP jest w Profile, ale nie aktualizuje się automatycznie | Auto-detekcja FTP z power curve (jak Intervals.icu: eFTP z max efforts) |
| Waga nie wpływa na FTP/w/kg | Połącz weight z profilem — pokazuj FTP w W/kg |
| Readiness score liczony w 2 miejscach (AnalyticsService + AdaptiveCoachService) | Jeden kalkulator readiness, używany wszędzie |
| Training status (CTL/ATL/TSB) rozproszony po wielu endpointach | Jeden endpoint `/api/athlete/status` zwracający pełny snapshot |

### Spójność nazewnictwa

| Obecnie | Proponowane |
|---------|-------------|
| `DailyDecision`, `AdaptiveCoach`, `SmartCoach`, `AiCoach` | **Tylko "Coach"** |
| `TrainingPlanPage` z zakładkami "Biblioteka", "Kalendarz", "Plan Builder", "Programy", "Adaptacja" | **"Training"** z zakładkami "Calendar" i "Workouts" |
| `PrioritiesPage` | **Przeniesione do Analytics** jako "Training Focus" |
| `AiV2Page` | **Przeniesione do Coach** jako "AI Insights" |

### Spójność UI

- Wszystkie karty decyzyjne używają **tego samego komponentu** `DecisionCard`
- Wszystkie widgety dashboardu używają **tego samego komponentu** `DashboardWidget`
- AI insights mają **jeden styl** prezentacji (nie osobny dla V1, V2, tips, coach summary)
- Kolorystyka jest spójna (dzięki tokenom) — to jest OK

---

## 7. AI Improvements

### Gdzie AI ma największy sens

| Zastosowanie | Priorytet | Opis |
|--------------|-----------|------|
| **FTP auto-detection** | HIGH | AI (prosta regresja) do wykrywania FTP z max efforts. Nie potrzebuje LLM. |
| **Trening dnia — rekomendacja** | HIGH | AI coach podpowiada konkretny workout (strukturę, nie tylko typ) na podstawie goal + fatigue + weather + historii. |
| **Weekly review** | MEDIUM | Raz w tygodniu AI podsumowuje: co poszło dobrze, co gorzej, co poprawić. |
| **Fatigue/overtraining detection** | MEDIUM | AI wykrywa wzorce przetrenowania zanim staną się krytyczne (HRV trend + TSB + sleep + subiektywny). |
| **Race readiness** | LOW | AI ocenia gotowość na event na podstawie CTL trajectory + taper plan. |
| **Nutrition plan** | LOW | AI generuje plan żywieniowy — ale to niski priorytet bez integracji z realnym logowaniem jedzenia. |
| **Custom prompts** | REMOVE | Użytkownik nie potrzebuje ręcznie konfigurować promptów AI. To overengineering. |

### Gdzie AI tylko komplikuje

| Problem | Rozwiązanie |
|---------|-------------|
| 12 typów predykcji AI (V2) — większość nieużywana | Zredukuj do 3-4 realnie użytecznych typów: workout recommendation, weekly review, fatigue alert, race readiness |
| Activity notes AI dla każdej aktywności — batch job, queue, RAG | Zachowaj, ale uprość: jeden przycisk "Przeanalizuj z AI" na stronie Activity |
| Custom prompts — użytkownik nie powinien konfigurować promptów | Usuń |
| MCP server — ciekawy technicznie, ale nie dla użytkownika końcowego | Ukryj za feature flag, nie pokazuj w UI |

### AI jako spójny coach — architektura docelowa

```
Użytkownik → Coach Engine (domain) → LLM (infrastructure)
                  ↑
           Athlete Context (dane treningowe, zdrowotne, goal)
```

**Coach Engine** (domenowy, bez AI):
- Podejmuje decyzję: RIDE / MODIFY / SKIP / RECOVERY
- Wybiera typ sesji: ENDURANCE / TEMPO / THRESHOLD / VO2MAX / RECOVERY
- Ustala parametry: duration, TSS, intensity

**AI Layer** (opcjonalny, nadbudowa):
- Generuje opis werbalny decyzji ("Dlaczego dziś endurance?")
- Sugeruje konkretną strukturę workoutu (interwały, bloki)
- Odpowiada na pytania użytkownika o trening
- Robi weekly review

**Kluczowa zasada:** Coach Engine działa BEZ AI. AI tylko wzbogaca doświadczenie. Użytkownik zawsze dostaje decyzję — AI może ją uzasadnić.

---

## 8. UX Improvements

### Największe ulepszenia UX (uszeregowane)

1. **Jeden system decyzyjny** — karta decyzji dnia jako centralny element UI. Koniec z 5 różnymi komunikatami.

2. **Redukcja dashboardu do 5 elementów** — decyzja, PMC mini, ostatni trening, coach, event. Reszta dostępna po kliknięciu.

3. **Onboarding flow** — po pierwszym syncu: "Witaj! Oto Twoje dane. Ustaw FTP, aby zacząć. Twój pierwszy cel: ..."

4. **Mobile-first decision flow** — na mobile: jedna wielka karta decyzji na cały ekran, swipe down → PMC, swipe down → ostatni trening.

5. **"What's next" po każdym treningu** — po zakończeniu aktywności (sync ze Stravy): notyfikacja "Świetny trening! Jutro: recovery. Twój TSB: -12, odpocznij."

6. **Progres w jednym miejscu** — dashboard pokazuje jeden wskaźnik progresu (FTP trend + weekly TSS trend), nie 5 rozproszonych.

7. **Mniej kliknięć** — zamiast klikać przez 5 stron żeby zrozumieć swój stan, wszystko na dashboardzie + jedna strona "Coach".

8. **Szybkie akcje** — przycisk "Sync teraz" bardziej widoczny. Przycisk "Dodaj wagę" jako FAB na mobile.

### Mikrointerakcje do poprawy

- **Pull-to-refresh** jest OK, ale dodatkowo: auto-refresh po syncu (już jest przez cache invalidation)
- **Loading skeleton** zamiast spinnera — lepiej pokazuje strukturę strony
- **Confirmation toast** po akcjach (zapis check-in, dodanie wagi)
- **Haptic feedback** na mobile po swipe decyzji

### Hierarchia informacji na dashboardzie

```
PRIORYTET 1 (zawsze widoczny):
  → Decyzja dnia: co robić dziś

PRIORYTET 2 (scroll-down):
  → PMC mini: jak wygląda obciążenie

PRIORYTET 3 (scroll-down):
  → Ostatni trening + Event countdown

PRIORYTET 4 (linki):
  → Coach (pełna analiza) | Analytics | Activities
```

---

## 9. Treningowe Improvements

### Co dodać, aby realnie wspierać trening

1. **FTP Auto-Detection**
   - Algorytm: najlepsza 20-minutowa moc * 0.95 (klasyczny), lub model Monod-Scherrer (CP/W')
   - Aktualizacja FTP co tydzień (lub po każdym nowym max effort)
   - Notyfikacja: "Nowy szacowany FTP: 285W (+5W)"
   - **To jest najważniejsza brakująca funkcja treningowa.**

2. **Weekly TSS Budget**
   - Coach Engine wylicza optymalny tygodniowy TSS na podstawie: aktualnego CTL, ramp rate (max 5-8 TSS/dzień), event proximity
   - Dashboard pokazuje: "Tydzień: 450/520 TSS (86%)" — zielony/pomarańczowy/czerwony
   - Zapobiega overtrainigowi i undertrainingowi

3. **W/kg jako kluczowa metryka**
   - FTP / waga = W/kg — najważniejszy wskaźnik w kolarstwie
   - Pokazuj na dashboardzie obok FTP: "3.8 W/kg (↑ 0.2)"
   - Integracja weight ↔ FTP

4. **Konkretne workouty, nie tylko typy**
   - Zamiast "ENDURANCE 90 min" → "2h Z2 ze stopniowym narastaniem. 15 min warmup → 90 min Z2 → 15 min cooldown. Cel: 120 TSS"
   - Workout Library powinna być zintegrowana z decyzją dnia

5. **Strength training placeholder**
   - Możliwość dodania treningu siłowego jako "cross-training"
   - Wpływa na fatigue score (siłownia = zmęczenie nerwowo-mięśniowe)
   - Nie musi być pełny moduł — wystarczy manualny entry "Siłownia: 45 min, intensywność 7/10"

6. **Recovery quality tracking**
   - Po dniu odpoczynku: subiektywna ocena "Jak się czujesz po rest day? 1-5"
   - Pokazuje, czy odpoczynek działa

7. **Periodization phases**
   - Użytkownik ustawia cel (event) → system automatycznie określa fazy: Base → Build → Peak → Taper
   - Decyzje dnia uwzględniają fazę (Base = więcej endurance, Build = więcej intensity, Taper = mniej volume)
   - To odróżnia "smart coacha" od "głupiego algorytmu"

### Co usunąć/ukryć

- Route Planner — nie pomaga w treningu
- Gamification jako osobna strona — może być jako subtle elementy na dashboardzie
- Custom AI Prompts — overengineering
- Admin page dla zwykłego użytkownika — dostępne tylko przez URL (może być)

---

## 10. Priorytety

### HIGH IMPACT / LOW EFFORT (zrób najpierw, maksymalny efekt)

| # | Zadanie | Effort | Impact |
|---|---------|--------|--------|
| 1 | **Usuń V1 AI** — zostaw tylko V2, usuń stare kontrolery, hooki, typy, strony | 2h | Redukcja chaosu, mniej kodu do utrzymania |
| 2 | **Połącz Fatigue + EnergyBudget widgety** w jeden "Regeneracja" | 1h | Mniej widgetów, lepsza czytelność |
| 3 | **Usuń zbędne widgety z dashboardu**: BlockMini, ProgressMini | 30min | Mniej scrollowania |
| 4 | **Połącz Reasoning + Alternatives w expandable sekcje karty decyzyjnej** | 2h | Czystrzejszy dashboard |
| 5 | **Połącz DailyCheckIn z ReadinessMini** w jeden widget | 1h | Eliminacja duplikacji |
| 6 | **Usuń SmartCoachWidget + AiCoachDashboardWidget** → jeden CoachWidget | 1h | Mniej zamieszania |
| 7 | **Ukryj RoutePlanner** z nawigacji (usuń z sidebar) | 15min | Mniej opcji w menu |
| 8 | **Dodaj W/kg do dashboardu** obok FTP | 1h | Kluczowa metryka |
| 9 | **FTP auto-detection — pierwsza wersja** (best 20min * 0.95) | 4h | Natychmiastowa wartość treningowa |

### HIGH IMPACT / HIGH EFFORT (kluczowe, ale wymagają więcej pracy)

| # | Zadanie | Effort | Impact |
|---|---------|--------|--------|
| 1 | **Skonsoliduj DailyDecision + AdaptiveCoach w jeden Coach Engine** | 2-3 dni | Fundament produktu |
| 2 | **Coach Page jako nowa strona główna** — scala dashboard decyzyjny + adaptive coach + AI insights | 3-4 dni | Nowy UX |
| 3 | **Uprość dashboard do 5 elementów** (przeprojektuj layout) | 2 dni | Ogromna poprawa UX |
| 4 | **Dodaj periodization phases** (Base/Build/Peak/Taper) do Coach Engine | 2-3 dni | Inteligentny coaching |
| 5 | **Weekly TSS budget** — limity, ostrzeżenia, progress bar | 1-2 dni | Zapobieganie overtrainigowi |
| 6 | **Merge Weight page w Health page** jako zakładkę | 1 dzień | Mniej stron |
| 7 | **Usuń Weather page**, zostaw widget + konfigurację w Profile | 1 dzień | Mniej stron |
| 8 | **Onboarding flow** po pierwszym syncu | 1-2 dni | Retention |

### LOW IMPACT (zrób później lub nie rób)

| # | Zadanie |
|---|---------|
| 1 | MCP server UI |
| 2 | Custom AI prompts |
| 3 | Batch AI predictions |
| 4 | Ollama model management UI |
| 5 | Route planner rozbudowa |
| 6 | Nowe typy predykcji AI (nutrition, injury risk, pacing) |
| 7 | Gamification rozbudowa |
| 8 | Admin panel rozbudowa |

---

## 11. Roadmapa

### Quick Wins (1-2 dni)

```
✓ Usunięcie V1 AI (kod + UI)
✓ Połączenie widgetów dashboardu (Fatigue+Energy, Readiness+CheckIn)
✓ Usunięcie zbędnych widgetów (BlockMini, ProgressMini)
✓ Jeden CoachWidget zamiast SmartCoach + AiCoach
✓ Ukrycie Route Planner z nawigacji
✓ W/kg obok FTP na dashboardzie
```

### Średni termin (1-2 tygodnie)

```
→ FTP auto-detection v1 (best 20min * 0.95)
→ Konsolidacja Coach Engine (DailyDecision + AdaptiveCoach)
→ Dashboard uproszczony do 5 elementów
→ Coach Page (scala decyzję + AI + cel)
→ Merge Weight w Health
→ Usunięcie Weather page
```

### Długoterminowa wizja (1-2 miesiące)

```
→ Periodization phases (Base/Build/Peak/Taper)
→ Weekly TSS budget z ostrzeżeniami
→ Konkretne workout rekomendacje (struktura, nie tylko typ)
→ Recovery quality tracking
→ Strength training placeholder
→ Onboarding flow
→ AI weekly review (automatyczne podsumowanie tygodnia)
→ Mobile app-like experience (PWA)
```

---

## 12. Idealna architektura produktu

### Strony (8)

```
/                     Dashboard       — decyzja dnia + PMC mini + ostatni trening + coach link
/coach                Coach           — pełny interfejs coachingowy (decyzja, cel, AI, historia)
/activities           Activities      — lista + filtr
/activities/:id       Activity Detail — pełny podgląd + AI analiza
/analytics            Analytics       — PMC, power curve, zones, comparison, priorities
/training             Training        — calendar + workout library
/health               Health          — HRV/sleep/stress + weight (zakładki)
/profile              Profile         — FTP, strefy, dane, achievements
/admin                Admin           — (tylko admin)
```

### Backend — kluczowe endpointy (zredukowane z 27+ kontrolerów)

```
/api/coach/today        GET     — dzisiejsza decyzja (z Coach Engine)
/api/coach/goal         GET/PUT — cel treningowy
/api/coach/feedback     POST    — feedback po sesji
/api/activities/*       CRUD    — (bez zmian)
/api/analytics/*        GET     — PMC, power curve, zones, trends, comparison
/api/athlete/status     GET     — pełny snapshot: CTL/ATL/TSB, FTP, waga, readiness
/api/training/calendar  GET     — kalendarz
/api/training/workouts  CRUD    — biblioteka workoutów
/api/health/*           GET/PUT — HRV, sleep, stress, body battery
/api/weight/*           CRUD    — waga
/api/weather/current    GET     — weather dla dashboardu
/api/sync/*             POST    — sync ze Stravą
/api/ai/insight         POST    — AI analiza (1 endpoint zamiast 6+)
/api/admin/*            CRUD    — (tylko admin)
/api/profile            GET/PUT — profil atlety
```

### Coach Engine — architektura

```java
// JEDEN domain engine
public class CoachEngine {
    public CoachDecision evaluate(AthleteContext ctx, Goal goal) {
        // 1. Safety check (TSB, HRV, readiness, monotony, outcomes)
        // 2. Periodization phase (base/build/peak/taper)
        // 3. Weekly budget (ile TSS zostało)
        // 4. Session selection (ENDURANCE/TEMPO/THRESHOLD/VO2MAX/RECOVERY)
        // 5. Session structure (duration, TSS, intervals)
        // 6. Alternatives (harder/easier/shorter/indoor)
        // 7. AI reasoning (opcjonalne — LLM generuje uzasadnienie)
    }
}
```

---

## 13. Idealny flow użytkownika

### Poranny check (30 sekund)

1. Otwieram aplikację na telefonie
2. **Widzę jedną kartę**: "Dziś: TRENUJ. 90 min ENDURANCE, outdoor. Gotowość: 72/100"
3. Rozwijam → widzę dlaczego (TSB -5, dobry sen, pogoda OK)
4. Klikam "Pokaż workout" → struktura treningu
5. Gotowe. Zamykam aplikację.

### Po treningu (15 sekund)

1. Trening automatycznie syncuje się ze Stravy
2. Dostaję notyfikację: "Trening zakończony. Jutro: RECOVERY. TSS dziś: 85"
3. Opcjonalnie: oceniam trening subiektywnie (1-5 gwiazdek)
4. Opcjonalnie: "Przeanalizuj z AI" → dostaję insights

### Weekly review (2 minuty, raz w tygodniu)

1. Otwieram Coach page → zakładka "Przegląd tygodnia"
2. Widzę: TSS wykonany vs planowany, trend CTL, quality wykonania
3. AI podsumowanie: "Dobry tydzień. FTP trend +2W. Zwiększ objętość Z2 o 15%."
4. Akceptuję lub modyfikuję plan na następny tydzień

---

## 14. Idealny dashboard główny

```
┌─────────────────────────────────────────────────────────┐
│  PONIEDZIAŁEK, 19 MAJA                                  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  TRENUJ                                           │   │
│  │  Endurance — 90 min — outdoor                     │   │
│  │  Gotowość 72/100  ·  TSB -5  ·  Pogoda OK        │   │
│  │  [▶ Dlaczego?]  [▶ Alternatywy]                   │   │
│  │  [Rozpocznij trening →]                           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────────┐ ┌────────────────────────┐   │
│  │ PMC (30 dni)          │ │ OSTATNIO                │   │
│  │ CTL 65 ATL 72 TSB -7  │ │ "Morning Ride"          │   │
│  │ [▬▬▬▬▬▬mini chart▬▬] │ │ 45 km · 2.5h · 85 TSS  │   │
│  └──────────────────────┘ └────────────────────────┘   │
│                                                         │
│  ┌──────────────────────┐ ┌────────────────────────┐   │
│  │ COACH                 │ │ EVENT                   │   │
│  │ Cel: FTP +15W (285W)  │ │ Tour de Powiat          │   │
│  │ Progress: 60% ▬▬▬     │ │ za 45 dni · on track    │   │
│  │ [Otwórz Coacha →]     │ │ [Plan taper →]          │   │
│  └──────────────────────┘ └────────────────────────┘   │
│                                                         │
│  FTP: 270W · 3.8 W/kg (+0.2)                            │
│  Waga: 72kg ↓ 0.5kg/tydz                               │
└─────────────────────────────────────────────────────────┘
```

---

## 15. Idealny system AI coacha

```
COACH ENGINE (domain, bez AI)
├── Safety Check: TSB > -40, HRV trend OK, readiness > 25
├── Phase Context: Base → more Z2 volume, Build → more intensity
├── Weekly Budget: 520 TSS planned, 450 done → 70 left
├── Session Selector: ENDURANCE (score 0.85 vs TEMPO 0.62)
└── Session Builder: 90 min, 2x20 min Z2 blocks, 75 TSS

AI LAYER (opcjonalny, na żądanie)
├── "Dlaczego dziś endurance?" → LLM generuje wyjaśnienie
├── "Zaproponuj strukturę interwałów" → LLM tworzy workout
├── "Weekly review" → LLM podsumowuje tydzień
└── "Zadaj pytanie" → LLM chat z kontekstem danych treningowych
```

**Kluczowe:** Coach Engine działa zawsze. AI jest dodatkiem, nie wymaganiem.

---

## 16. Idealny model analizy treningu

### Co użytkownik widzi w Analytics

1. **PMC (Performance Management Chart)** — główny wykres. CTL, ATL, TSB. Z zaznaczonymi eventami. Z fazami (base/build/peak).
2. **Power Curve** — z auto-detekcją FTP. Porównanie sezon-do-sezonu.
3. **Zone Distribution** — jak zmienia się w czasie (trend, nie tylko snapshot).
4. **Training Priorities** — co jest słabym punktem (CP/W', durability, VO2max).
5. **Season Comparison** — rok do roku.

### Co NIE powinno być w Analytics (przenieść gdzie indziej)

- Weather → tylko na dashboardzie
- Weight → w Health
- Readiness → na dashboardzie
- Events → w Coach
- Sync status → w headerze

---

## 17. Idealny poziom prostoty

Aplikacja powinna przejść **"test jednego ekranu"**:

> Po otwarciu aplikacji użytkownik w ciągu 5 sekund wie, co ma dziś zrobić.

Jeśli potrzebuje więcej informacji — klika dalej. Ale odpowiedź na najważniejsze pytanie ("co robić?") jest natychmiastowa i jednoznaczna.

**Zasady prostoty:**
1. Jeden system decyzyjny (Coach)
2. Jeden dashboard (5 elementów)
3. Jedno źródło prawdy o stanie atlety (AthleteStatus)
4. Jedna strona na jeden temat (nie 5 zakładek w jednej)
5. AI jest asystentem, nie zamiennikiem logiki

---

## Podsumowanie

| Metryka | Obecnie | Docelowo |
|---------|---------|----------|
| Liczba stron | 14 + 3 redirecty | 8 |
| Systemy decyzyjne | 5 (DailyDecision, AdaptiveCoach, SmartCoach, AiCoach, DailyCheckIn) | 1 (Coach Engine) |
| Widgety na dashboardzie | 20+ | 5 |
| Kontrolery REST | 27+ | ~15 |
| Typy predykcji AI | 12 | 3-4 |
| Czas do decyzji | ~30-60s (scrollowanie, czytanie) | ~5s (jedna karta) |
| FTP — źródło | Ręczny wpis | Auto-detekcja + ręczny override |

**Najważniejsza rekomendacja na już:** Skonsoliduj systemy decyzyjne. To pojedyncza zmiana, która rozwiązuje najwięcej problemów UX, architektonicznych i treningowych jednocześnie.
