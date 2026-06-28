# Fatigue Assessment — Few-Shot Example

## Scenario

Athlete: 75 kg road cyclist in the third week of a build block. Has been progressively increasing volume and intensity. Reports "heavy legs" but still completing workouts. No recent illness or life stress.

## Input Summary (what the model receives)

**PMC Data (last 14 days):**
- CTL: 62 (stable, has risen from 55 to 62 over the previous 6 weeks)
- ATL: 87 (rising — was 72 two weeks ago, 80 one week ago, 87 today)
- ATL/CTL ratio: 87/62 = 1.40
- TSB: −28 today, trajectory: Day −14 = −15, Day −10 = −19, Day −7 = −22, Day −5 = −25, Day −3 = −27, Day −1 = −28
- TSB rate of change: approximately −1 point per day over the last 10 days

**Weekly TSS:**
- Week 1 (3 weeks ago): 510 TSS
- Week 2 (2 weeks ago): 560 TSS
- Week 3 (last week, previousWeekTss): 590 TSS
- Week 4 (current week partial, currentWeekTss): 420 TSS through 5 days (projected ~590 full week)
- 3 consecutive weeks above 550 TSS threshold

**Readiness Data:**
- Current readiness: 20/100
- 7-day trend: declining (was 35 → 28 → 24 → 20)
- HRV: 68ms (baseline 82ms, −17% from norm)
- Resting HR: 58 bpm (baseline 52 bpm, +12% from norm)
- Sleep: 6.2 hrs average last 5 nights (target 7.5+ hrs)

**Recent Activities (most impactful):**
- Yesterday: 145 TSS — 4×15-minute threshold intervals at 310W (105% FTP), 3 hours total
- 2 days ago: 95 TSS — 2.5-hour endurance ride, Zone 2
- 4 days ago: 130 TSS — VO2max session, 6×4 min at 340W, 2.5 hours total

---

## Expected JSON Response

```json
{
  "summary": "Significant accumulated fatigue detected. ATL/CTL ratio 1.40, TSB −28 with 10-day sustained decline, readiness at 20 with declining HRV. Recommend immediate 2-day full rest followed by 3 days of active recovery at Zone 1 only.",
  "insight": "The athlete is in a state of functional overreaching that is approaching the boundary of non-functional overreaching. ATL has risen 15 points in 14 days (72→87) while CTL has plateaued at 62, resulting in an ATL/CTL ratio of 1.40 — well above the 1.3 caution threshold. TSB has fallen from −15 to −28 over 10 consecutive days without any sign of stabilization, indicating the load accumulation has not been absorbed. Three consecutive weeks above 550 TSS (510→560→590) shows a 15.7% load increase over the block without a recovery week. Readiness score of 20 with declining HRV (−17% from baseline) and elevated resting HR (+12%) confirms that autonomic recovery is compromised. Yesterday's 145 TSS threshold session on already-deep fatigue was counterproductive — the athlete could not have hit true threshold power targets in this state.",
  "action": "Immediate recovery protocol: Days 1-2 complete rest (no training, prioritize 8+ hrs sleep and nutrition). Days 3-5 active recovery only — maximum 60-minute easy spin at 45-55% FTP (130-160W), HR Zone 1, cadence 85-95 rpm. No intensity work of any kind. On Day 6, reassess readiness and TSB. If readiness >50 and TSB > −15, resume normal training at 70% of previous week's TSS (~400 TSS for the return week). If not, extend recovery until both thresholds are met.",
  "metrics": {
    "atl": "87",
    "ctl": "62",
    "atlCtlRatio": "1.40",
    "tsb": "-28",
    "readinessScore": "20",
    "hrvDeviation": "-17%",
    "restingHrDeviation": "+12%",
    "previousWeekTss": "590",
    "currentWeekTssPartial": "420",
    "daysToRecovery": "7",
    "consecutiveDaysTsbBelowMinus25": "5"
  },
  "confidence": 0.91,
  "confidence_breakdown": {
    "data_quality": 0.95,
    "trend_clarity": 0.92,
    "model_certainty": 0.85
  },
  "reasoning": "Step 1 — PMC analysis: ATL/CTL ratio of 1.40 exceeds the Gabbett (2016) ACWR threshold of 1.3 for elevated injury/fatigue risk. The ratio has been above 1.3 for approximately 7 days. Step 2 — TSB trajectory: A 10-day unbroken decline from −15 to −28 at −1 pt/day is a clear fatigue accumulation pattern. TSB is now in Friel's 'deep fatigue' zone (<−30 approaching). Step 3 — Weekly load: Three consecutive weeks of increasing TSS (510, 560, 590) with no recovery week embedded represents a 15.7% load increase. The recommended maximum weekly TSS increase is 10% per week (Foster's rule). The block structure has violated this guideline. Step 4 — Readiness confirmation: Readiness of 20 with declining HRV (−17%) and elevated resting HR (+12%) provides convergent validity with PMC data. Both objective (PMC) and subjective (readiness) measures agree on significant fatigue. Step 5 — Recovery projection: Based on similar fatigue profiles in trained cyclists, return to neutral TSB (−10 to 0) typically requires 5-7 days of aggressive recovery. The 2-day complete rest + 3-day active recovery protocol targets a TSB return to approximately −10 by Day 7, at which point readiness should have recovered above 50 based on current HRV reversal rate.",
  "warnings": [
    "TSB at −28 with 5+ days below −25 is approaching non-functional overreaching territory. If athlete reports persistent heavy legs, mood disturbance, or poor sleep quality beyond 3 days of recovery, consider formal overtraining evaluation.",
    "Yesterday's 145 TSS session at 105% FTP was executed in deep fatigue — the actual physiological stimulus was likely higher than the TSS value suggests due to reduced efficiency. Power data may overstate what was actually accomplished."
  ],
  "alternatives": [
    {
      "scenario": "Athlete insists on maintaining some training stimulus during recovery",
      "action": "Replace Day 2 rest with a 45-minute recovery spin at 40-50% FTP (120-140W), HR strictly Zone 1. Extend high-intensity restriction to Day 7. This compromise slows recovery by approximately 1-2 days but is acceptable if athlete compliance with full rest is unlikely."
    },
    {
      "scenario": "Readiness rebounds above 50 by Day 4",
      "action": "Consider this an unusually fast recovery (possibly indicating the fatigue was more acute than chronic despite the 10-day TSB decline). Resume training on Day 5 at 60% TSS (~350 TSS for the week) but maintain the no-intensity restriction until Day 7."
    }
  ],
  "references": [
    "Friel, J. — The Cyclist's Training Bible: TSB zones and recovery protocols. TSB < −30 mandates recovery priority with structured return-to-training guidelines.",
    "Gabbett, T.J. (2016) — The training-injury prevention paradox: should athletes be training smarter and harder? British Journal of Sports Medicine. ACWR > 1.3 associated with significantly elevated injury/illness risk.",
    "Halson, S.L. (2014) — Monitoring Training Load to Understand Fatigue in Athletes. Sports Medicine. Multi-metric approach (HRV, resting HR, subjective readiness) provides convergent validity for fatigue assessment."
  ]
}
```
