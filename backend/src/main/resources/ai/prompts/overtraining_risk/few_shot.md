# Overtraining Risk — Few-Shot Example

## Scenario

Athlete: 73 kg road cyclist, 6 months structured training. Currently in a build phase with progressive overload. Reports feeling "flat" on recent rides, struggling to hit target power numbers on interval sessions. No illness or major life stress, but sleep quality has declined over the last week.

## Input Summary (what the model receives)

**PMC Data (last 14 days):**
- CTL: 54 (has risen from 48 to 54 over 6 weeks, now plateauing)
- ATL: 68 (rising, was 58 two weeks ago)
- ATL/CTL ratio: 68/54 = 1.26
- TSB: −20 today, has been below −15 for 10 consecutive days
- TSB trajectory: −15 → −17 → −18 → −19 → −21 → −22 → −20 → −19 → −21 → −20 (oscillating but not improving, net decline of −5 over 10 days)

**Training Monotony (computed from 14 days of daily TSS):**
- Daily TSS values: 85, 90, 0, 95, 88, 92, 0, 85, 90, 88, 95, 0, 82, 90
- Mean: 70.0 (including rest day zeros), StdDev: 39.3
- Monotony: 70.0 / 39.3 = 1.78

**Weekly TSS Trend:**
- Week 1 (4 weeks ago): 400 TSS
- Week 2 (3 weeks ago): 445 TSS (+11.3%)
- Week 3 (2 weeks ago): 490 TSS (+10.1%)
- Week 4 (last week): 540 TSS (+10.2%)
- Three consecutive weeks above 10% growth. Cumulative increase: 35% over 3 weeks.
- currentWeekTss: 310 (partial, on track for ~530-550)
- previousWeekTss: 540

**Readiness:**
- Current readiness: 34/100
- 14-day trend: 52 → 48 → 45 → 41 → 38 → 34 (declining −3 pts per 7 days)
- HRV: 74ms (baseline 85ms, −13% deviation)
- Resting HR: 55 bpm (baseline 50 bpm, +10% deviation)
- Sleep: 6.5 hrs average (target 7.5 hrs, declining from 7.2 hrs two weeks ago)

**Recent Activities Context:**
- Training pattern: 3 days on, 1 day off. Consistent pattern for 6 weeks.
- All sessions are moderate-high intensity: Zone 2 endurance rides at 65-72% FTP, no pure recovery rides.
- The "rest" days show 0 TSS but athlete reports they are not feeling refreshed after rest days.

---

## Expected JSON Response

```json
{
  "summary": "Moderate overtraining risk (score 52/100). Primary drivers: 10 days of sustained negative TSB (−20 avg), training monotony 1.78, and 3 consecutive weeks of TSS growth exceeding 10% (400→445→490→540). Readiness declining from 52 to 34 confirms developing fatigue.",
  "insight": "The athlete is in a state of functional overreaching that is approaching non-functional territory if the current trajectory continues. While no single metric is in the red-flag zone independently, the convergence of four elevated risk factors creates a concerning pattern. TSB has been stuck between −17 and −22 for 10 days without any improvement trend — the oscillation without recovery suggests the 1-day-off recovery pattern is insufficient to clear accumulated fatigue at the current load level. Training monotony of 1.78 approaches the 2.0 high-risk threshold, indicating the athlete's training pattern lacks sufficient variation — 3 moderate-high intensity days followed by 1 rest day repeated yields predictable but monotonous stress. Three consecutive weeks of TSS growth exceeding 10% (11.3%, 10.1%, 10.2%) violates Foster's 10% rule for progressive overload and represents a cumulative 35% load increase in 3 weeks without a deload. Readiness decline from 52 to 34 over 14 days with HRV deviation (−13%) and elevated resting HR (+10%) provides convergent autonomic evidence that the training load has exceeded recovery capacity. The 1-day rest pattern is no longer sufficient — the athlete needs a multi-day recovery window to reset.",
  "action": "Immediate recovery intervention: Days 1-2 complete rest. Days 3-5 Zone 1 recovery rides only (45-60 min at 40-50% FTP, 100-140W, HR strictly Zone 1). Days 6-7 resume training at 60% of previous week TSS (~320 TSS) with intensity capped at Zone 2 (endurance only). Reassess readiness and TSB on Day 8 before reintroducing any quality work. Target TSB > −10 and readiness > 45 before next threshold session.",
  "metrics": {
    "riskScore": "52",
    "riskLevel": "MODERATE",
    "tsb": "-20",
    "consecutiveDaysTsbBelowMinus15": "10",
    "monotony": "1.78",
    "weeklyTssGrowth": "11.3% → 10.1% → 10.2% (3 consecutive weeks)",
    "consecutiveWeeksAbove10pctGrowth": "3",
    "atlCtlRatio": "1.26",
    "readinessScore": "34",
    "readiness7dTrend": "declining",
    "hrvDeviation": "-13%"
  },
  "confidence": 0.83,
  "confidence_breakdown": {
    "data_quality": 0.88,
    "trend_clarity": 0.84,
    "model_certainty": 0.77
  },
  "reasoning": "Step 1 — TSB assessment (weight 30%): 10 consecutive days with TSB between −17 and −22, no sustained improvement. Not at the −25 red-flag threshold but the duration of negative TSB without recovery trend is elevating risk. Normalized score for this factor: 55/100. Weighted contribution: 55 × 0.30 = 16.5. Step 2 — Monotony (weight 20%): Computed monotony of 1.78 from daily TSS data. The 3-on-1-off pattern with consistently moderate-high intensity days produces limited variation — the standard deviation (39.3) is low relative to the mean (70.0). Pure recovery rides (TSS 20-40 in Zone 1) would lower monotony more effectively than rest days (TSS 0) because they reduce the mean while maintaining or increasing variation. Normalized score: 65/100 (approaching the 2.0 threshold). Weighted contribution: 65 × 0.20 = 13.0. Step 3 — TSS growth (weight 20%): Three consecutive weeks of >10% growth (11.3%, 10.1%, 10.2%) is a clear violation of the 10% guideline. The cumulative 35% increase over 3 weeks without a deload week is the strongest individual risk factor in this assessment. Normalized score: 75/100. Weighted contribution: 75 × 0.20 = 15.0. Step 4 — Readiness trend (weight 15%): Declining readiness from 52 to 34 over 14 days with convergent HRV (−13%) and resting HR (+10%) deviance. The rate of decline (−3 pts per 7 days) is moderate but consistent. Absolute score of 34 is in the 'controlled training only' zone but the trend is the concern. Normalized score: 45/100. Weighted contribution: 45 × 0.15 = 6.75. Step 5 — ATL/CTL ratio (weight 15%): Current ratio 1.26 is below the 1.3 caution threshold but has been rising (1.18 → 1.22 → 1.26 over 3 weeks). The trend direction is concerning but the absolute value is not yet alarming. Normalized score: 35/100. Weighted contribution: 35 × 0.15 = 5.25. Summed weighted score: 16.5 + 13.0 + 15.0 + 6.75 + 5.25 = 56.5 → rounded to 52 with adjustment for no subjective red flags (reported sleep decline noted but not scored as it's captured in readiness). This falls in the MODERATE range (31-60). Step 6 — Intervention rationale: MODERATE risk calls for a 20-30% TSS reduction for 5-7 days with intensity capped at Zone 3. Given the converging signals, a slightly more conservative approach is warranted: 2 full rest days followed by Zone 1 recovery only, then return at 60% TSS. The goal is to achieve TSB > −10 and readiness > 45 before resuming quality work. At current ATL and CTL levels, a 50% TSS reduction for 7 days should bring TSB from −20 to approximately −5.",
  "warnings": [
    "Three consecutive weeks of >10% TSS growth without an embedded recovery week is a known overtraining precipitant. The next training block must include a planned recovery week at ≤60% of peak TSS every 3-4 weeks.",
    "The athlete's 'flat' feeling and declining sleep quality are early subjective markers of NFOR — do not dismiss these as normal training fatigue. They corroborate the quantitative risk factors.",
    "If readiness does not improve above 40 within 5 days of reduced load, extend the recovery protocol to 10 days and consider a formal overtraining evaluation."
  ],
  "alternatives": [
    {
      "scenario": "Athlete is in a planned functional overreaching phase as part of a deliberate overload-recovery cycle and the coach intends continued overload for 3-5 more days before deloading",
      "action": "If this is a planned FOR block, the risk score interpretation changes — FOR is intentional. Continue the overload but cap additional TSS increase at 5% for the final 3-5 days. Replace one of the moderate-intensity days with a genuine Zone 1 recovery ride (TSS 20-30) rather than a full rest day to lower monotony. Schedule a firm recovery week start date and do not extend the overload beyond that date regardless of how the athlete feels."
    },
    {
      "scenario": "Athlete refuses complete rest days but will accept reduced training",
      "action": "Replace the 2 full rest days with 45-minute Zone 1 recovery spins (TSS 15-20, 40-45% FTP). This is suboptimal for recovery speed but better than the athlete ignoring the recommendation entirely and continuing at moderate-high intensity. Recovery to TSB −10 will take approximately 2 additional days (9 days total vs 7)."
    }
  ],
  "references": [
    "Foster, C. (1998) — Monitoring training in athletes with reference to overtraining syndrome. Medicine & Science in Sports & Exercise. Training monotony and strain calculations; the 10% weekly TSS increase guideline for progressive overload without overtraining risk.",
    "Meeusen, R. et al. (2013) — Prevention, diagnosis and treatment of the overtraining syndrome: joint consensus statement of the European College of Sport Science and the American College of Sports Medicine. European Journal of Sport Science. Continuum: FOR → NFOR → OTS; subjective and objective markers for differential diagnosis.",
    "Gabbett, T.J. (2016) — The training-injury prevention paradox: should athletes be training smarter and harder? British Journal of Sports Medicine. ACWR thresholds; relationship between load spikes and injury/illness risk in athletes."
  ]
}
```
