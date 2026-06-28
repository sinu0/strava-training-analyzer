# Performance Trend — Few-Shot Example

## Scenario

Athlete: 70 kg road cyclist, 18 months structured training, targeting a gran fondo in 8 weeks. Has been following a polarized training plan (80% Zone 1-2, 20% Zone 4-5). Recent data shows steady improvement across multiple metrics.

## Input Summary (what the model receives)

**PMC Data (60 days):**
- CTL Day 60 ago: 48
- CTL Day 30 ago: 52
- CTL Today: 56
- CTL 60-day delta: +8
- ATL Today: 54
- TSB Today: −3
- CTL has risen steadily at approximately +1.3 points per week with no plateaus.
- TSB been stable between −8 and +2 throughout, indicating well-managed load.

**Training Consistency:**
- 60 days: 52 training days out of 60 (87% consistency)
- Max consecutive days without training: 2 days (once, minor illness)
- No gaps >3 days at any point

**FTP History:**
- 60 days ago: 255W at 70 kg → 3.64 W/kg
- 30 days ago: 260W (estimated from field data)
- Today: 265W at 70 kg → 3.79 W/kg
- Δ W/kg: +0.15 over 60 days

**Efficiency Factor (EF) Trend:**
- 60 days ago: EF 2.01 (180W NP / 89 bpm avg on 2.5-hr Zone 2 ride)
- 30 days ago: EF 2.08 (185W NP / 89 bpm avg)
- Today (most recent comparable ride): EF 2.12 (190W NP / 90 bpm avg)
- EF has risen 0.11 over 60 days on comparable Zone 2 rides

**Power Curve Evolution (comparing recent 14 days vs 45-60 days ago):**
- 1-min: 580W → 590W (+10W, +1.7%)
- 5-min: 370W → 380W (+10W, +2.7%)
- 20-min: 270W → 280W (+10W, +3.7%)
- 60-min: 245W → 255W (+10W, +4.1%)
- All durations improving, with larger improvements at longer durations (aerobic development pattern)

**Zone Distribution (last 30 days):**
- Zone 1: 14%, Zone 2: 64%, Zone 3: 8%, Zone 4: 8%, Zone 5: 4%, Zone 6: 1%, Zone 7: 1%
- Strong Zone 2 dominance (78% Z1+Z2) consistent with polarized model

**Weekly TSS Trend:**
- Week -8: 450, Week -7: 460, Week -6: 470, Week -5: 440 (recovery), Week -4: 490,
- Week -3: 510, Week -2: 520, current week partial: 310 (on track for ~500)
- Gradual volume increase with periodic recovery weeks embedded

---

## Expected JSON Response

```json
{
  "summary": "Strongly improving performance trajectory. CTL +8 over 60 days, W/kg up 0.15 to 3.79, EF rising 0.11, all power curve durations improving with aerobic dominance. Well-structured polarized training driving consistent adaptation.",
  "insight": "This athlete is in a clearly positive performance phase with convergent evidence across all major indicators. CTL has risen 8 points over 60 days (+1.3/week) without any plateau — a sustainable rate that indicates effective progressive overload. The W/kg improvement from 3.64 to 3.79 (+0.15, 4.1%) over 60 days is meaningful for a trained cyclist and exceeds the 2-3% expected seasonal gain rate, suggesting the training stimulus is well-calibrated. Efficiency Factor improvement of 0.11 on comparable Zone 2 rides is an early indicator that aerobic capacity is deepening — the athlete is producing more power at the same metabolic cost. Power curve improvements are distributed across all durations but the pattern is notably aerobic-dominant: 1-min +1.7%, 5-min +2.7%, 20-min +3.7%, 60-min +4.1%. The larger gains at longer durations confirm that aerobic adaptation (mitochondrial biogenesis, capillary density, fat oxidation) is the primary driver. Zone distribution at 78% Zone 1+2 with 14% Zone 3+4 and 6% Zone 5+ is a near-textbook polarized distribution per Seiler's model. Training consistency at 87% with disciplined recovery weeks (Week -5 at 440 TSS after 470) shows the athlete is managing load intelligently. At current trajectory, the athlete projects to 3.85-3.90 W/kg by the gran fondo in 8 weeks, assuming continued load management and no disruptions.",
  "action": "Maintain current polarized structure (78% Z1-2, 15% Z3-4, 7% Z5+) for the next 4 weeks. Increase weekly TSS by 5% from 520 to ~545. Add one additional 20-30 minute Zone 2 block to the weekly endurance ride to deepen aerobic base. Schedule a formal FTP test at Week 4 to validate the projected 270-275W FTP.",
  "metrics": {
    "ctl60dDelta": "+8",
    "weeklyTssAvg": "485",
    "consistencyScore": "87%",
    "wKgDelta": "+0.15",
    "currentWkg": "3.79",
    "efTrend": "+0.11",
    "powerTrend": "aerobic_dominant_improving",
    "trajectory": "strongly_improving",
    "fourWeekFtpProjection": "270-275W",
    "eightWeekProjection": "3.85-3.90 W/kg"
  },
  "confidence": 0.87,
  "confidence_breakdown": {
    "data_quality": 0.90,
    "trend_clarity": 0.93,
    "model_certainty": 0.78
  },
  "reasoning": "Step 1 — CTL 60-day delta: +8 points over 60 days at +1.3/week is a clear and unambiguous positive fitness trend. The rate is within the sustainable range (0.5-2.0/week) and has been maintained without interruption. No plateaus or reversals in the trajectory. Step 2 — Consistency: 52/60 training days (87%) with max gap of 2 days indicates high consistency. The single 2-day gap from minor illness is within the adaptive recovery range and did not disrupt the CTL trend. No significant disruptions. Step 3 — W/kg: 3.64 → 3.79 (+0.15) over 60 days is a meaningful improvement for a trained athlete. Assuming body weight is stable at 70 kg, the entire gain is power-driven, which is the ideal scenario (as opposed to weight-loss-driven W/kg gains which are less sustainable). Step 4 — EF trend: +0.11 over 60 days on comparable rides is a clear positive signal. The fact that NP increased (+10W) while average HR increased only 1 bpm indicates genuine aerobic efficiency improvement, not just a higher effort level. This is a leading indicator that typically precedes FTP confirmation by 2-4 weeks. Step 5 — Power curve: All durations improving is ideal. The pattern of larger improvements at longer durations (1-min +1.7% vs 60-min +4.1%) is characteristic of an aerobic development phase — exactly what a polarized plan should produce. The athlete is not sacrificing top-end for endurance or vice versa. Step 6 — Zone distribution: 78% Z1+2, 14% Z3+4, 8% Z5+ tracks closely to the Seiler 80/20 model. The minimal Zone 3 (8%) avoids the 'black hole' of training intensity where effort is too hard for aerobic development but too easy for threshold/VO2max stimulus. Step 7 — Weekly TSS: Gradual increase from 450 to 520 over 8 weeks (+15.5%) with a recovery week at 440 embedded at Week -5 demonstrates intelligent periodization. The ~5% weekly increase is within the 5-10% recommended range. Step 8 — Trajectory classification: Strongly improving. All evidence is convergent. No contradictory signals. Step 9 — Projection: At current CTL ramp rate (+1.3/week) with maintained polarization, the athlete should reach CTL ~60 by Week 4 and CTL ~64 by Week 8. FTP projected at 270-275W by Week 4 (based on CTL-FTP regression), 280-285W by Week 8, corresponding to 3.86-4.07 W/kg. The gran fondo target of 3.85+ W/kg is well within reach at the current trajectory.",
  "warnings": [
    "EF trend is based on outdoor Zone 2 rides which are influenced by terrain, wind, and temperature. Indoor validation on a trainer would provide cleaner EF data.",
    "W/kg gains rely on stable body weight. If the athlete enters a weight-cutting phase before the gran fondo, W/kg may increase independent of power gains — this is less indicative of true fitness improvement."
  ],
  "alternatives": [
    {
      "scenario": "Athlete experiences a plateau (CTL stops rising despite maintained training volume)",
      "action": "This would indicate the current training stimulus is no longer driving adaptation. Introduce a 2-week overload block: increase weekly TSS by 10% (to ~570) and add a third quality session (Zone 5 VO2max, 5×4min at 115-120% FTP). Follow with a recovery week at 350 TSS. The overload/recovery cycle should restart CTL progression."
    },
    {
      "scenario": "Athlete wants to accelerate gains for the gran fondo in 8 weeks",
      "action": "Shift from pure polarized to a pyramidal distribution (70% Z1-2, 20% Z3-4, 10% Z5+) for the next 4 weeks. This increases total high-intensity time while maintaining aerobic volume. Add one additional threshold session per week (3×15min at 95-100% FTP). Reduce to 2 quality sessions in Week 4 for a supercompensation week before the taper. This may yield 2-3% additional FTP gain by event day."
    }
  ],
  "references": [
    "Banister, E.W. et al. (1975) — A systems model of training for athletic performance. Australian Journal of Sports Medicine. PMC framework: CTL as fitness proxy, exponential weighting of training impulse over time.",
    "Seiler, S. (2010) — Intervals, Thresholds, and Long Slow Distance: the role of intensity distribution in endurance training. Scandinavian Journal of Medicine & Science in Sports. Polarized 80/20 model validated for long-term aerobic development in trained cyclists.",
    "Coggan, A. & Allen, H. — Training and Racing with a Power Meter, 3rd ed. Efficiency Factor (EF) interpretation and power curve duration-specific physiological mapping."
  ]
}
```
