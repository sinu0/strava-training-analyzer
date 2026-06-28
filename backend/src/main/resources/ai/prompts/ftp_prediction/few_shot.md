# FTP Prediction — Few-Shot Example

## Scenario

Athlete: 72 kg road cyclist, training consistently 6 days/week for 12 weeks. No recent formal FTP test. Last tested FTP: 280W (3.89 W/kg) 8 weeks ago. The athlete reports feeling stronger on climbs but has not validated with a test.

## Input Summary (what the model receives)

**PMC Data (last 8 weeks):**
- CTL: Week 1 = 55, Week 4 = 60, Week 8 = 65 (steady +1.25 pts/week rise over 8 weeks)
- ATL: Week 8 = 68, prior week 7-day average 72 → declining slightly as TSB recovers
- TSB: Week 6 trough at −22, Week 7 = −14, Week 8 = −8 → recovering steadily

**Power Curve:**
- 20-minute best: 285W (Week 4) → 295W (Week 7) → 298W (current, 3 days ago)
- 5-minute best: 340W → 345W (stable, slight gain)
- 1-minute best: 520W → 525W (maintained)

**Weekly Load:**
- Weeks 4–6: 480–510 TSS/week
- Week 7: 530 TSS (highest in block, included 2×20min at 290W NP)
- Week 8 (current, partial): 310 TSS through 4 days, including the 298W 20-min effort
- currentWeekTss: 310, previousWeekTss: 530

**Intensity Distribution (4-week):**
- Zone 1-2: 78%, Zone 3-4: 16%, Zone 5-7: 6% (polarized pattern)

**FTP History:**
- 12 months ago: 250W, 6 months ago: 265W, 8 weeks ago: 280W

---

## Expected JSON Response

```json
{
  "summary": "FTP estimated at 290W (4.03 W/kg), a 3.6% gain over 8 weeks. Rising CTL + recovering TSB + 20-min PR at 298W support continued aerobic progression to 295W within 4 more weeks.",
  "insight": "CTL has risen from 55 to 65 over 8 weeks (+1.25 pts/week), the strongest FTP predictor. TSB has recovered from a −22 trough to −8, indicating fatigue is dissipating and fitness expression is improving. The 20-minute power improved from 285W to 298W (+13W, 4.6%) over the same block. Coggan-derived FTP estimate: 298 × 0.95 = 283W, but the consistent CTL rise and polarized intensity distribution (78% Z1-2) suggest the true FTP is likely slightly above this calculation. Weekly TSS of 480–530 with NP near 290W on key sessions supports an FTP closer to 290W. The gap between tested FTP (280W) and estimated FTP (290W) is consistent with the 3–5% seasonal gain expected during a progressive build phase.",
  "action": "Perform a formal 20-minute FTP test within the next 7 days after a 2-day taper (50% TSS reduction). Target 310W average for the 20-minute effort, which would confirm an FTP of 295W. If unable to test, use 290W as the training FTP for the next 4-week block.",
  "metrics": {
    "currentFtp": "290W",
    "previousFtp": "280W",
    "ftpWkg": "4.03",
    "ctl": "65",
    "atl": "68",
    "tsb": "-8",
    "recentPeak20min": "298W",
    "fourWeekCtldelta": "+5",
    "eightWeekCtldelta": "+10",
    "weeksOfProgressiveLoad": "8",
    "fourWeekProjection": "295W",
    "eightWeekProjection": "300W"
  },
  "confidence": 0.82,
  "confidence_breakdown": {
    "data_quality": 0.90,
    "trend_clarity": 0.85,
    "model_certainty": 0.70
  },
  "reasoning": "Step 1 — CTL analysis: 8-week CTL rise from 55→65 (+10) is unambiguous. Rate of +1.25 pts/week is sustainable for a trained athlete without overreaching risk. Positive CTL delta over 4 weeks (+5) confirms fitness accumulation. Step 2 — TSB trajectory: TSB recovering from −22 to −8 over 3 weeks shows effective fatigue dissipation. The athlete is exiting the functional overreaching window and entering the supercompensation phase where fitness expression peaks. Step 3 — Power curve: 20-min power gain of +13W (4.6%) in 4 weeks is a strong signal. 5-min and 1-min power are maintained, indicating the gain is aerobic-specific rather than a general shift. Step 4 — FTP estimation: Coggan 0.95 factor gives 283W, but this method under-estimates in athletes with developed aerobic engines who can sustain a higher fraction of 20-min power. Training data (NP=290W on 2×20min sessions) supports a 290W estimate. Step 5 — Projection: At current CTL ramp rate with maintained polarization, an additional 5W gain over the next 4 weeks (to 295W) and 10W over 8 weeks (to 300W) is realistic, reaching 4.17 W/kg.",
  "warnings": [
    "FTP estimate is based on field data, not a formal lab or ramp test — formal testing recommended for precision",
    "Week 7 TSS of 530 is approaching the upper range of sustainable load — monitor ATL/CTL ratio closely"
  ],
  "alternatives": [
    {
      "scenario": "Athlete cannot perform formal FTP test within 7 days",
      "action": "Use 290W as training FTP for the next block. Execute a controlled 2×20-minute session at 285-295W to validate in the field. If both intervals are completed with HR drift under 5%, confidence in 290W estimate increases to high."
    },
    {
      "scenario": "CTL rise plateaus due to life stress or illness",
      "action": "Accept current 290W estimate but reduce 4-week projection to 292W. Focus on maintaining current level rather than pushing for 295W. Insert a recovery week at 60% TSS before resuming progression."
    }
  ],
  "references": [
    "Coggan, A. & Allen, H. — Training and Racing with a Power Meter, 3rd ed. (FTP estimation from 20-min test protocol, 0.95 factor)",
    "Banister, E.W. et al. (1975) — A systems model of training for athletic performance (PMC impulse-response, CTL/ATL/TSB framework)",
    "Seiler, S. (2010) — Intervals, Thresholds, and Long Slow Distance: the role of intensity distribution in endurance training (polarized 80/20 model supports steady aerobic progression)"
  ]
}
```
