# Analiza funkcjonalna Strava Training Analyzer
## Spójność, głębokość featureów i rekomendacje rozwojowe

Data: 2026-05-06

---

## 1. Mapa zależności (Frontend)

### 1.1 Warstwy architektoniczne

```
App.tsx (Router)
  └─ AppLayout (Sidebar + TopBar + MobileBottomNav)
       └─ Pages (16, lazy-loaded)
            ├─ DashboardPage ────── hooks: useDailyDecision, useReadiness, usePmc, useFtpProgress, useAi*, useBlockHealth
            ├─ AnalyticsPage ────── hooks: usePmc, usePowerCurve, useZoneDistribution, useTrends, useOptimalLoad
            ├─ TrainingPlanPage ─── hooks: useWorkoutTemplates, useCalendarView, useTrainingPlans, usePrograms, useOptimizePlan
            ├─ HealthPage ───────── hooks: useHealthOverview, useHealthTimeline, useRecoveryStatus
            ├─ AdaptiveCoachPage ── hooks: useAdaptiveCoachToday, useReadiness, useProfile
            ├─ PrioritiesPage ───── hooks: useTrainingPriorities
            ├─ PerformancePredictionPage ─ hooks: usePerformancePrediction
            ├─ ActivityDetailPage ─ hooks: useActivity, useActivityMap, useAiNote, useWPrimeBalance
            ├─ ActivitiesPage ───── hooks: useActivities, useInfiniteActivities, useActivityFilters
            ├─ WeatherPage ──────── hooks: useWeather*, useWeatherLocations
            ├─ WeightPage ───────── hooks: useWeight*
            ├─ RoutePlannerPage ─── hooks: useRoutes, useRoutePlanner (z reducerem stanu)
            ├─ ProfilePage ──────── hooks: useProfile, useAchievements
            ├─ AiPredictionPage ─── hooks: useAiPredict, useLatestAiPrediction, useAiHistory
            └─ AdminPage ────────── hooks: useSync*, useStravaConfig, useGarmin*
```

### 1.2 Przepływ danych

```
Strava API → SyncService → PostgreSQL → (metric calculators) → MetricResult
    ↓
REST Controllers (27) → Application Services → Domain Engines
    ↓
/api/* endpoints
    ↓
apiClient.ts (Axios + retry + error notifications)
    ↓
TanStack Query Hooks (25 hooks, ~70 queries, ~45 mutations)
    ↓
React Components (~125) → Pages (16)
    ↓
Użytkownik (dark theme, mobile-first, Polish UI)
```

### 1.3 Kluczowe silniki domenowe (backend)

| Silnik | Plik | Odpowiedzialność |
|--------|------|-----------------|
| **DailyDecisionEngine** | `domain/model/DailyDecisionEngine.java` | Decyzja RIDE/MODIFY/SKIP/INDOOR na dziś. Priorytet: SAFETY → ADAPTATION → PLAN → CONTEXT |
| **AdaptiveScoringEngine** | `domain/coach/engine/` | Punktuje typy sesji (RECOVERY...ANAEROBIC) wg wpływu na fitness/fatigue dla podanego celu |
| **FatigueModel / FatigueDebtEngine** | `domain/coach/engine/` | Model długu zmęczeniowego, budżet zmęczenia, ryzyko przetrenowania |
| **RiskModel** | `domain/coach/engine/` | Ocena ryzyka kontuzji i przetrenowania |
| **ConsistencyModel / AccountabilityEngine** | `domain/coach/engine/` | Regularność treningu, compliance do planu |
| **GoalEngine** | `domain/coach/engine/` | Postęp celu, analiza luki |
| **SessionImpactModel** | `domain/coach/engine/` | Prognozuje wpływ fizjologiczny sesji |
| **TrainingPlanService** | `application/` | Auto-generacja planu (periodyzacja 3:1, taper) |
| **TrainingPrioritiesService** | `application/` | CP/W', interwały, profile zmęczenia, fenotyp |
| **PerformancePredictionService** | `application/` | Przewidywanie formy: PEAK/BUILDING/FATIGUED/DETRAINED |
| **WorkoutEvaluationService** | `application/` | Ewaluacja wykonania treningu vs plan (POWER/INTERVAL/ZONE/HR/DRIFT) |

---

## 2. Analiza głębokości featureów

### 2.1 Feature'y głębokie (actionable intelligence)

| Feature | Warstwa | Dlaczego głęboki |
|---------|---------|-----------------|
| **Daily Decision** | Silnik + Dashboard | Ocenia bezpieczeństwo, adaptację, plan, pogodę i daje konkretną decyzję: jedź/modyfikuj/odpuść/indoor. Z alternatywami i uzasadnieniem. |
| **Adaptive Coach** | Silnik + Strona | Scoring 9 typów sesji dla podanego celu, model zmęczenia, analiza ryzyka, consistency, accountability, pętla feedbacku |
| **Training Plan Generator** | Service + UI | Auto-generacja planu periodyzowanego (3:1), taper przed eventem, hard/easy alternation, environment-aware template selection |
| **Training Priorities** | Service + Strona | 5-punktowa analiza: CP/W', interwały, fatigue decomposition, durability profile, power phenotype. Każdy z konkretną rekomendacją |
| **Performance Prediction** | Service + Strona | Przewiduje stan formy, peak window, estymuje przyszłe FTP, daje rekomendacje kontekstowe |
| **Readiness** | Service + Komponent | Score 0-100 z session variantami, quality window, health signals, daily check-in wpływający na decyzję |
| **Health Timeline** | Service + Strona | HRV, HR spoczynkowe, sen (z fazami), Body Battery, stres - z trendami i alertami |
| **PMC** | Service + Wykres | CTL/ATL/TSB z deltami, fundamentalne narzędzie treningowe |
| **Workout Evaluation** | Service + Component | Analiza compliance mocy, interwałów, czasu w strefach, HR response, fatigue drift, execution stability |

### 2.2 Feature'y średnie (użyteczne, ale reaktywne)

| Feature | Komentarz |
|---------|-----------|
| **Weight Tracking** | Ma cel z BMR/TDEE i deficytem kalorycznym, ale nie integruje się z planem treningowym |
| **Route Planner** | Map-based z elevation profile, ale nie łączy się z rekomendacjami treningowymi |
| **Weather** | Gradient pogodowy z scoringiem, ale nie wpływa automatycznie na daily decision (jest osobny) |
| **Achievements** | 30+ osiągnięć rowerowych, ale brak progresji/poziomów |
| **AI Predictions** | LLM-based, ale zależne od zewnętrznego serwisu, opcjonalne |
| **Workout Library** | Biblioteka template'ów z eksportem .zwo/.fit |
| **FTP Progress** | Śledzenie FTP z wykresem trendu |

### 2.3 Feature'y płytkie (głównie wizualizacja danych)

| Feature | Komentarz |
|---------|-----------|
| **Activity List** | CRUD + filtrowanie (querybuilder), paginacja - standard |
| **Activity Detail** | Overview/Analiza/Laps/Advanced/AI - głównie wykresy i statystyki, brak aktywnej informacji zwrotnej |
| **Activity Calendar** | Kalendarz aktywności |
| **Profile Page** | Podsumowanie statystyk, galeria, achievements |
| **Season Comparison** | Porównanie dwóch okresów |
| **Efficiency Trend** | Wykres EF w czasie |
| **Power Curve** | Krzywa mocy z porównaniem okresów |

---

## 3. Kluczowe braki - Garmin-like post-workout scoring

Model Garmin po każdym treningu daje **natychmiastową informację zwrotną**:

| Co Garmin daje | Co ma nasz system | Luka |
|---------------|-------------------|------|
| **Training Effect (Aerobic)** 0.0-5.0 | Brak | ❌ System nie klasyfikuje efektu aerobowego treningu |
| **Training Effect (Anaerobic)** 0.0-5.0 | Brak | ❌ System nie klasyfikuje efektu anaerobowego treningu |
| **Primary Benefit** (Recovery/Base/Tempo/Threshold/VO2max/Anaerobic) | WorkoutEvaluation (manualny, nieautomatyczny) | ❌ Brak automatycznej klasyfikacji typu treningu PO wykonaniu |
| **Recovery Time** (zalecane godziny) | Brak | ❌ Brak rekomendacji czasu odpoczynku po treningu |
| **Training Load** (TSS) | ✅ Jest liczone | OK |
| **Training Status** (Productive/Maintaining/Overreaching) | PerformancePrediction (PEAK/BUILDING/FATIGUED/DETRAINED) | ⚠️ Jest podobny koncept, ale nie w kontekście pojedynczego treningu |
| **Load Focus** (Anaerobic/High Aerobic/Low Aerobic balance) | Brak | ❌ Brak wizualizacji balansu obciążeń |

### 3.1 Problem z WorkoutEvaluation

`WorkoutEvaluationService` **istnieje**, ale:
- Jest **manualny** - wymaga wysłania POST z pełnym kontekstem (planned vs executed workout)
- **Nie jest automatycznie wyzwalany** po synchronizacji nowego treningu
- **Nie jest widoczny** w ActivityDetailPage - nie ma zakładki "Ocena treningu"
- Nie produkuje **training score** przypisanego do aktywności w bazie
- Nie podaje **recovery time**

---

## 4. Zarządzanie energią i zmęczeniem - analiza luki

### 4.1 Co już jest

| Element | Implementacja | Stan |
|---------|---------------|------|
| CTL/ATL/TSB (PMC) | `AnalyticsService`, PMChart | ✅ Działa |
| Fatigue Debt Engine | `domain/coach/engine/FatigueDebtEngine` | ✅ Silnik istnieje |
| Fatigue Model | `domain/coach/engine/FatigueModel` | ✅ Silnik istnieje |
| Fatigue Decomposition | `TrainingPrioritiesService` (ATL/muscular/metabolic/ANS) | ✅ Istnieje w Priorities |
| Recovery Score | `HealthService` | ✅ Istnieje |
| Daily Check-in | `DailyCheckInWidget` | ✅ Istnieje |
| Readiness Score | `ReadinessDto` z session variantami | ✅ Istnieje |
| Body Battery / Stress / HRV | `HealthService` z Garmin | ✅ Istnieje |
| Resting HR trend | `HealthService` | ✅ Istnieje |
| Progression Levels | `AnalyticsService` | ✅ Istnieje |

### 4.2 Czego brakuje

| Element | Problem | Priorytet |
|---------|---------|-----------|
| **Automatyczny Training Score po treningu** | Każdy trening powinien dostać score (0-100) i typ (Recovery/Base/Tempo/Threshold/VO2max/Anaerobic/Sprint) automatycznie po sync | **WYSOKI** |
| **Recovery Time po treningu** | System nie mówi "odpocznij 36h przed następnym ciężkim treningiem" | **WYSOKI** |
| **Training Load Focus / Balance** | Brak wizualizacji: ile czasu w każdej strefie intensywności vs optymalny rozkład | **WYSOKI** |
| **Energy Budget na dziś** | Body Battery jest pokazywane, ale nie integruje się z rekomendacją "masz X energii, możesz zrobić Y" | **ŚREDNI** |
| **Zmęczenie per subsystem** | FatigueFactors są liczone tylko w Priorities, nie są widoczne na Dashboard | **ŚREDNI** |
| **Trend zmęczenia (7d/28d)** | Brak prostej wizualizacji "twoje zmęczenie rośnie/maleje od tygodnia" | **ŚREDNI** |
| **Historia regeneracji** | Brak wykresu "jak szybko regenerujesz się po różnych typach treningów" | **NISKI** |
| **Tygodniowy budżet stresu** | Brak porównania "planowany TSS tydzień vs wykonany vs bezpieczny limit" na dashboardzie | **ŚREDNI** |
| **Adaptive deload suggestion** | System nie proponuje tygodnia rozładowującego gdy fatigue debt jest wysoki | **ŚREDNI** |

---

## 5. Planowanie i przygotowanie treningowe - analiza luki

### 5.1 Co już jest

| Element | Implementacja | Stan |
|---------|---------------|------|
| Periodized plan generation | `TrainingPlanService.generatePlan()` (3:1, taper) | ✅ |
| Calendar view z projekcjami | `TrainingCalendar` + `CalendarDayDto` | ✅ |
| Weekly coach cockpit | `WeeklyCoachCockpit` - podsumowanie tygodnia | ✅ |
| Workout library | `WorkoutLibrary` z template'ami | ✅ |
| Adaptive coach | `AdaptiveCoachService` - scoring 9 typów sesji | ✅ |
| Daily decision | `DailyDecisionEngine` - RIDE/MODIFY/SKIP | ✅ |
| Performance prediction | `PerformancePredictionService` | ✅ |
| Training priorities | `TrainingPrioritiesService` | ✅ |
| FTP tracking | `FtpProgress` | ✅ |
| Goal setting | Program goal (FTP/ENDURANCE/RACE_PEAK/WEIGHT_LOSS/GENERAL) | ✅ |

### 5.2 Czego brakuje

| Element | Problem | Priorytet |
|---------|---------|-----------|
| **Race/event countdown** | Brak widżetu "do Twojego eventu zostało X dni, readiness projection: Y" | **WYSOKI** |
| **Tydzień w skali RPE/TSS** | Brak wizualizacji "ten tydzień był łatwy/średni/ciężki" z porównaniem do planu | **ŚREDNI** |
| **Progresja obciążenia** | Brak wizualizacji ramp rate (tempa wzrostu CTL) z ostrzeżeniem gdy >8 TSS/d | **ŚREDNI** |
| **Forecast "co jeśli"** | Brak symulacji "jeśli zrobisz te treningi, twój CTL wyniesie X za 4 tygodnie" | **ŚREDNI** |
| **Training phase auto-detection** | Brak automatycznego wykrywania w jakiej fazie (Base/Build/Peak/Taper) jest zawodnik | **NISKI** |
| **Event-specific plan tailoring** | Plan generuje się ogólnie, nie pod konkretny typ eventu (TT vs gran fondo vs crit) | **NISKI** |
| **Multi-sport support** | Cały system zakłada tylko kolarstwo, brak biegania/pływania | **NISKI** |

---

## 6. Priorytety implementacyjne

### 🔴 Krytyczne (podstawa Garmin-like experience)

**1. Automatyczny Training Score + Training Effect po każdym treningu**

Co zrobić:
- Rozszerzyć `DailySummary` lub stworzyć nową encję `ActivityTrainingEffect`
- Po sync nowego treningu automatycznie liczyć:
  - **Training Score (0-100)**: wypadkowa intensity, duration, compliance do normy
  - **Aerobic Training Effect (0.0-5.0)**: z czasu w strefach tlenowych (Z1-Z3), HR, czasu trwania
  - **Anaerobic Training Effect (0.0-5.0)**: z czasu w strefach beztlenowych (Z5-Z7), power peaks
  - **Primary Benefit**: klasyfikacja Recovery/Base/Tempo/Threshold/VO2max/Anaerobic/Sprint
  - **Recovery Time (godziny)**: estymacja na podstawie TSS, intensywności, fatigue stanu
- Wyświetlić na ActivityDetailPage jako **pierwszą rzecz po otwarciu** (hero section)
- Dodać do ActivityListView jako kolorowy chip/score

**2. Recovery Time recommendation**

Co zrobić:
- Silnik w domenie: `RecoveryTimeCalculator`
- Uwzględnia: TSS treningu, IF, duration, aktualny stan CTL/ATL/TSB, HRV trend, sleep score
- Wyświetlać w 3 miejscach:
  - ActivityDetailPage (po treningu)
  - Dashboard (jeśli ostatni trening <48h temu)
  - DailyDecision (jako dodatkowy sygnał)
- Format: "Zalecany odpoczynek: 36h (kolejny ciężki trening od: jutro 18:00)"

### 🟡 Wysokie (znacząca poprawa UX)

**3. Training Load Focus / Balance**

Co zrobić:
- Nowa strona/sekcja pokazująca trójkąt/wykres słupkowy:
  - Low Aerobic (< Z2): co było vs co powinno być
  - High Aerobic (Z2-Z4): co było vs co powinno być
  - Anaerobic (>Z4): co było vs co powinno być
- Targety: Low Aerobic ~45%, High Aerobic ~35%, Anaerobic ~20% (adaptowalne do fazy)
- Ostrzeżenia gdy balans jest zaburzony ("Za mało podstawy, za dużo intensywności")

**4. Energy Budget Dashboard Widget**

Co zrobić:
- Nowy widżet "Dziś masz X% baterii - możesz zrobić trening o TSS do Y"
- Integruje: Body Battery, sleep score, HRV, resting HR, fatigue debt
- Daje konkretną rekomendację: "Max TSS dziś: 85 (spokojna jazda)" vs "Max TSS dziś: 150 (możesz cisnąć)"

**5. Event Countdown + Readiness Projection**

Co zrobić:
- Widżet na Dashboard: "Event: XYZ za 45 dni. Projekcja gotowości: 78/100"
- Do `PerformancePredictionService` dodać projekcję na konkretną datę eventu
- Weekly coach pokazuje "tygodnie do eventu" i co powinno się dziać

### 🟢 Średnie (dopełnienie experience)

**6. Fatigue Dashboard Widget**

Co zrobić:
- Nowy widżet pokazujący zmęczenie w rozbiciu na subsystemy (z `TrainingPrioritiesService`)
- Wizualizacja trendu 7d/28d
- "Twój ATL rośnie o 3.2 TSS/d - zwolnij"

**7. Tygodniowy budżet stresu**

Co zrobić:
- W `WeeklyCoachCockpit` dodać porównanie: plan vs wykonanie vs bezpieczny limit
- Ostrzeżenie gdy TSS tygodnia > 1.5x średnia z ostatnich 4 tygodni

**8. Automatyczne wyzwalanie WorkoutEvaluation**

Co zrobić:
- Po sync nowego treningu, automatycznie triggerować `WorkoutEvaluationService.evaluate()`
- Zapisanie wyniku do bazy (nowa encja `WorkoutEvaluation`)
- Wyświetlenie w ActivityDetailPage jako nowa zakładka "Ocena"

---

## 7. Problemy architektoniczne i spójnościowe

### 7.1 Duplikacja konceptów

| Koncept | Gdzie występuje | Problem |
|---------|----------------|---------|
| "Decyzja na dziś" | DailyDecisionEngine + AdaptiveCoachService | Dwie ścieżki dające rekomendację treningu na dziś, ale z różnych perspektyw. Użytkownik może być zdezorientowany. |
| "Zmęczenie" | FatigueModel, FatigueDebtEngine, FatigueFactors, ATL | Trzy różne modele zmęczenia - każdy daje inną wartość. Brak jednego, spójnego "Fatigue Score". |
| "Gotowość" | Readiness score (HealthService) + Readiness score (PerformancePredictionService) | Dwa różne algorytmy readiness |
| "Score" | Readiness score, Performance score, Workout score, Decision confidence | Różne skale (0-100, 0-1, 35-100), różne znaczenia |

### 7.2 Problemy z przepływem danych

1. **WorkoutEvaluation nie integruje się z resztą systemu**
   - Nie zapisuje wyniku do bazy (jest tylko endpoint POST → response)
   - Nie aktualizuje DailySummary
   - Nie wpływa na DailyDecision następnego dnia

2. **Adaptive Training Panel jest izolowany**
   - `AdaptiveTrainingPanel` to osobny komponent z własnym stanem
   - Nie integruje się z `TrainingCalendar` ani `AdaptiveCoach`
   - Wynik adaptacji nie jest zapisywany (chyba że przez `useAdaptiveTraining`)

3. **Check-in nie wpływa na Adaptive Coach**
   - Daily check-in (subiektywna ocena) wpływa na DailyDecision, ale nie na AdaptiveCoach
   - Brak pętli feedbacku: "powiedziałeś że jesteś zmęczony → coach to uwzględnił → oto nowa decyzja"

### 7.3 Spójność UI

1. **Nawigacja** - 16 stron, niektóre bardzo płytkie (AiPredictionPage to wrapper na 1 komponent). Można rozważyć konsolidację.
2. **Kolorystyka scoringu** - `readinessScales.ts` (9 poziomów), `scoreColor.ts` (4 poziomy), inne komponenty mają własne logiki kolorów. Warto ujednolicić.
3. **Empty states** - nie wszystkie strony mają sensowne empty states (np. HealthPage bez danych z Garmina)

---

## 8. Rekomendowany plan działania

### Faza 1: Post-workout scoring (podstawa Garmin-like)

1. Nowa encja domenowa `ActivityTrainingEffect`:
   - `activityId`
   - `trainingScore` (0-100)
   - `aerobicEffect` (0.0-5.0)
   - `anaerobicEffect` (0.0-5.0)
   - `primaryBenefit` (enum: RECOVERY/BASE/TEMPO/THRESHOLD/VO2MAX/ANAEROBIC/SPRINT)
   - `recoveryTimeHours` (int)
   - `calculatedAt`

2. Nowy kalkulator domenowy `TrainingEffectCalculator`:
   - Liczy aerobic/anaerobic TE z czasu w strefach mocy/tętna
   - Klasyfikuje Primary Benefit na podstawie dominującej strefy
   - Estymuje recovery time z TSS, IF, CTL/ATL/TSB, HRV

3. Automatyczne wyzwalanie po sync treningu

4. UI:
   - Nowa sekcja w `ActivityHeroSection` pokazująca score i benefit
   - Nowy chip/badge w `ActivityListView`
   - Recovery time na `DashboardPage`

### Faza 2: Energy & Fatigue management

1. Unified Fatigue Score (połączenie FatigueModel + FatigueDebtEngine + FatigueFactors)
2. Energy Budget Widget na Dashboard
3. Training Load Focus / Balance wizualizacja
4. Fatigue Dashboard Widget

### Faza 3: Planning enhancement

1. Event countdown + readiness projection
2. Weekly stress budget
3. "Co jeśli" forecast

### Faza 4: Spójność i porządki

1. Unified scoring (jedna skala i kolorystyka dla wszystkich score)
2. Integracja WorkoutEvaluation z flow (auto-trigger, zapis do bazy, wpływ na DailyDecision)
3. Integracja AdaptiveTraining z TrainingCalendar
4. Konsolidacja płytkich stron

---

## 9. Podsumowanie

System ma **solidny fundament domenowy** z zaawansowanymi silnikami decyzyjnymi (DailyDecisionEngine, AdaptiveCoach, PerformancePrediction, TrainingPriorities). Architektura heksagonalna jest czysta, frontend jest spójny wizualnie (dark theme, mobile-first, MUI).

**Główna słabość**: system jest **inteligentny przed treningiem** (mówi co robić), ale **głupi po treningu** (nie daje natychmiastowej informacji zwrotnej). To odwrotność modelu Garmin, gdzie właśnie **post-workout feedback** jest kluczowym elementem experience.

**Brakujące ogniwo**: automatyczny Training Score + Training Effect + Recovery Time po każdym treningu. To jest fundament, na którym można budować całą resztę (lepsze zarządzanie energią, lepsze planowanie, lepsze decyzje).

**Drugi priorytet**: zunifikowanie rozproszonych konceptów (zmęczenie, gotowość, scoring) w jeden spójny system, który mówi do użytkownika prostym językiem: "Twój trening był X. Jesteś zmęczony na poziomie Y. Odpocznij Z godzin. Twoja forma jest w trendzie W."
