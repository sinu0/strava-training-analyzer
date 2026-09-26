# Usage

[← README](../README.md)

The UI is in Polish; Polish labels are given in parentheses.

## First run

1. Open http://localhost (Docker) or http://localhost:5173 (dev mode).
2. **Settings** (Ustawienia) → enter Client ID / Secret if they are not in `.env` → **Connect with Strava** (Połącz ze Stravą) → approve access in Strava.
3. **More → Data & jobs** (Więcej → Dane i zadania) → **Full import** (Pełny import). The first import can take a while: Strava allows 100 requests / 15 min and 1000 / day. When the limit is hit, the job resumes on its own later.
4. Metrics are calculated automatically after import. New activities come in via the sync button in the top bar and automatic sync every 30 min.

**Data & jobs** shows the stage, attempts and errors of every job; failed jobs can be resumed.

## Screens

| Screen | Contents |
|---|---|
| **Today** (Dzisiaj) `/` | recommendation for the day with evidence, data quality, load, latest activity, next workout |
| **History** (Historia) `/activities` | list, calendar and map with shared filters; activity detail: overview, analysis, laps, segments |
| **Analysis** (Analiza) `/analytics` | period comparison, load and recovery (CTL/ATL/TSB), power and durability |
| **Plan** `/training` | calendar, workout library, load scenario; start a workout on the trainer |
| **More** (Więcej) `/more` | weather (with the route planner `/routes` and heatmap), profile and records, health, weight, data & jobs, settings |

Missing data is shown explicitly ("no measurement"), never as zero.

## Trainer mode

Open a scheduled workout from **Plan** and start the player. Bluetooth connection to the trainer and HR strap, ERG mode and ride recording are described in [WORKOUT_EXECUTION_PWA.md](WORKOUT_EXECUTION_PWA.md).
