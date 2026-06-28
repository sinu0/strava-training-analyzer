# Recovery Plan — Few-Shot Example

## Scenario

Athlete: 70 kg competitive amateur cyclist, currently in a VO2max-focused training block. Has completed 4 consecutive days of hard training: Tuesday — threshold intervals (4×8min at 105% FTP), Wednesday — VO2max hill repeats (5×4min at 115% FTP), Thursday — long Zone 2 endurance (3 hours at 72% FTP), Friday — race simulation group ride (intense, high TSS). It is now Saturday morning. Athlete reports heavy legs, struggling to get heart rate up during yesterday's ride, and poor sleep quality for the last 2 nights (5.5-6 hours vs normal 7.5). No illness symptoms. Rest day planned for Monday.

## Input Summary (what the model receives)

**PMC Data:**
- CTL: 55 (has been rising from 50 over 3 weeks, currently plateauing)
- ATL: 63 (spiked after yesterday's race simulation, was 55 three days ago)
- ATL/CTL ratio: 63/55 = 1.15
- TSB: −18 today (was −5 on Monday, has been falling all week: −5 → −9 → −12 → −14 → −18)
- TSB trajectory: steeply falling, −13 points in 4 days (−3.25/day)

**Readiness:**
- Current readiness: 35/100
- 14-day trend: 65 → 58 → 52 → 47 → 42 → 38 → 35 (declining −5 pts per week, accelerating)
- HRV: 72ms (baseline 84ms, −14% deviation, worsening from −8% three days ago)
- Resting HR: 54 bpm (baseline 49 bpm, +10% deviation, was +5% three days ago)
- Sleep: 5.8 hrs average last 2 nights (target 7.5 hrs, deficit accumulating)

**Recent Activities (last 4 days):**
- Tuesday: Threshold intervals, 90 min, 105 TSS. 4×8min at 294W (105% of 280W FTP). Felt strong, hit all targets.
- Wednesday: VO2max hill repeats, 75 min, 95 TSS. 5×4min at 322W (115% FTP) on 6% grade. Completed all repeats but last two were a struggle.
- Thursday: Zone 2 endurance, 180 min, 140 TSS. 72% FTP (202W). Felt "heavier than normal" for Zone 2, HR higher than usual for power.
- Friday: Race simulation group ride, 150 min, 160 TSS. Unstructured intensity, multiple surges above 120% FTP. Reported "couldn't respond to attacks in the last hour" and "legs wouldn't fire."

**4-day TSS total: 500.** Normal 4-day TSS for this athlete: 350-400 (38% overload).

**Weekly Volume:**
- currentWeekTss (partial, 4 of 7 days): 500
- previousWeekTss (full 7 days): 480
- 4-week average weekly TSS: 510
- The athlete is on pace for ~620 TSS this week if training continues — a 29% increase over the 4-week average.

**Planned Training (originally):**
- Saturday: Zone 2 endurance, 2 hours (180 TSS planned)
- Sunday: Long ride, 3.5 hours with tempo (220 TSS planned)
- Monday: Rest day (planned)

---

## Expected JSON Response

```json
{
  "summary": "Active Recovery prescribed for today (Saturday). TSB −18 and steeply falling (−3.25/day over 4 days), readiness 35 with HRV −14% deviation, 4 hard days totaling 500 TSS (38% above normal 4-day load). Athlete is in functional overreaching with insufficient recovery. Replace planned 2h Zone 2 with 45 min at 45% FTP maximum. Full Active possible tomorrow if readiness improves above 45.",
  "insight": "The athlete has accumulated significant fatigue across 4 consecutive hard days in three distinct training domains — threshold (anaerobic), VO2max (aerobic power), and endurance (aerobic durability) — with the race simulation compounding fatigue through unstructured supramaximal efforts. The 500 TSS over 4 days represents a 38% overload compared to the athlete's typical 4-day block (350-400 TSS). This is a planned functional overreaching block but the recovery response is inadequate: TSB has fallen from −5 to −18 in 4 days at a rate of −3.25/day with no recovery inflection, readiness has declined 12 points in the same period with convergent autonomic signals (HRV −14%, RHR +10%), and sleep quality has degraded (5.8 hrs vs 7.5 hrs target — the cumulative sleep deficit of approximately 3.5 hours over 2 nights amplifies the physiological fatigue). The TSB trajectory is the most concerning signal: a steeply falling TSB with no plateau or recovery inflection after 4 days of loading indicates that the adaptive response is lagging the training stimulus — the athlete is digging a recovery hole rather than supercompensating. The planned Saturday/Sunday sessions totaling 400 TSS would push weekly TSS to ~620 (29% above 4-week average) and drive TSB below −25 — a red-flag threshold for non-functional overreaching. The planned Monday rest day is insufficient as a solo recovery intervention — the athlete needs immediate load reduction to intercept the declining trend before it crosses into NFOR territory. The positive framing: this is good training stress (functional overreaching), and with 1-2 days of proper recovery the supercompensation response should produce a fitness uptick. The mistake to avoid is pushing through Saturday-Sunday and converting a productive overload into a damaging one.",
  "action": "Today (Saturday): Replace planned 2h Zone 2 with ACTIVE RECOVERY — 45 min cycling at strictly 40-50% FTP (112-140W at 280W FTP), HR Zone 1 only (<120 bpm at estimated LTHR 170), cadence 90-100 rpm spinning light on flat terrain. Then: 20 min foam rolling (quads — 90s/leg, hamstrings — 60s/leg, glutes — 90s/leg, IT band/TFL — 45s/leg, thoracic spine — 60s) + 10 min static stretching (hamstrings, quadriceps, hip flexors, glutes, lower back — 30s holds, 2 rounds each). Nutrition: anti-inflammatory focus — post-ride protein 25g + tart cherry juice (200ml). Sleep target: 9 hours tonight (bed by 21:30). Tomorrow (Sunday): Reassess morning readiness and HRV. If readiness >45 and HRV within 10% of baseline, prescribe Full Active — 90 min Zone 2 at 55-65% FTP with no intensity. If readiness remains <45, prescribe PASSIVE_RECOVERY — complete off-bike day with body work and sleep focus.",
  "metrics": {
    "tsb": "-18",
    "tsbTrajectory": "Falling −3.25/day over 4 days",
    "tsb4dChange": "-13 points",
    "readiness": "35",
    "readiness14dTrend": "Declining −5 pts/week",
    "hrvDeviation": "-14%",
    "restingHrDeviation": "+10%",
    "sleepAvgLast2Nights": "5.8 hrs",
    "sleepDeficitHrs": "3.5 hrs cumulative",
    "tss4Days": "500",
    "tss4DaysOverloadPercent": "38%",
    "recoveryLevel": "ACTIVE_RECOVERY",
    "prescribedDurationMin": "45",
    "prescribedPowerPercentFtp": "40-50%"
  },
  "confidence": 0.87,
  "confidence_breakdown": {
    "data_quality": 0.90,
    "trend_clarity": 0.88,
    "model_certainty": 0.82
  },
  "reasoning": "Step 1 — TSB assessment: Current TSB of −18 is in the moderate negative zone (−5 to −25) but the trajectory is the primary concern. TSB has fallen 13 points in 4 days at −3.25/day — this is a steep decline with no sign of plateau. A healthy overload-recovery pattern shows TSB falling during hard days, plateauing during easy days, and rising during recovery. The absence of any plateau or rise indicates the athlete has had NO recovery days in this block — all 4 days have been TSS-positive. The continued decline of TSB at this rate predicts TSB −21 to −22 by Saturday evening if the planned 180 TSS ride were executed, and −28 to −30 by Sunday — crossing the −25 NFOR threshold. This is an intercept recommendation: stop the decline before it crosses into damaged territory. Step 2 — Readiness assessment: Readiness of 35 is in the recovery-required zone (<40). The declining trend from 65 to 35 over 14 days (−2.1 pts/day) indicates building fatigue even before this 4-day block. The 4-day acceleration to −3.25 pts/day confirms the block is compounding pre-existing fatigue. HRV at −14% deviation and RHR at +10% provide autonomic confirmation — the parasympathetic nervous system is suppressed, meaning the body is in a sympathetic-dominant (stress) state rather than a recovery-dominant state. These autonomic signals typically precede subjective feelings of fatigue by 2-3 days — the athlete's report of 'heavy legs' and 'couldn't respond to attacks' is the subjective catch-up to what the autonomic data has been signaling. Step 3 — Training density: 4 consecutive days with moderate-to-high TSS (95, 105, 140, 160) across three training domains is a high-density block. The 500 TSS total exceeds the athlete's typical 4-day load of 350-400 by 38%. This is effective functional overreaching BUT requires proportional recovery. The common error is viewing the 4-day block in isolation without accounting for the pre-existing readiness decline — the athlete entered this block already carrying some fatigue, making the overload proportionally larger than the raw TSS suggests. Step 4 — Sleep: 2 nights of 5.5-6 hours sleep represents a ~3.5 hour cumulative deficit vs the 7.5h target. Sleep restriction at this level reduces growth hormone secretion by approximately 20-30% and impairs glycogen resynthesis. The sleep deficit alone would justify an active recovery day even without the TSB/readiness data. Step 5 — Subjective markers: 'Heavy legs,' 'couldn't respond to attacks,' and 'legs wouldn't fire' are the classic subjective triad of functional overreaching. 'Struggling to get HR up' (suppressed HR response to exercise) is a more specific marker — it indicates autonomic fatigue where the sympathetic drive cannot produce normal cardiovascular response. This is a stronger signal than heavy legs alone. Step 6 — Recovery level determination: TSB −18 (moderate, falling), readiness 35 (recovery-required), sleep deficit (compounding), autonomic confirmation (HRV/RHR convergent), and subjective markers (4 of 5 primary markers present). ACTIVE_RECOVERY is the appropriate level — the athlete needs training load reduction but does not require complete rest (TSB is not below −25, readiness is above 30, no illness). The 45-min prescription at 40-50% FTP with HR Zone 1 constraint ensures cardiovascular blood flow for muscle repair without adding training stimulus. The 90-100 rpm cadence is important — high cadence low torque spinning promotes blood flow through the capillary beds without imposing muscular force demands. Step 7 — Return to training criteria: If morning readiness improves to >45 and HRV returns to within −10% of baseline by Sunday, the athlete can progress to Full Active (Zone 2, no intensity). The Monday rest day remains in place — this recovery intervention replaces the Saturday/Sunday training, not the Monday recovery. By Tuesday, if readiness is >55 and TSB has risen above −10, structured training can resume at normal load.",
  "warnings": [
    "If the athlete feels 'worse' after the 45-min recovery spin (more fatigue, not less), this is a red flag that the recovery requirement is higher than Active Recovery. Switch to PASSIVE_RECOVERY immediately — the athlete may be approaching NFOR territory where even light exercise is counterproductive.",
    "Do NOT use the phrase 'just an easy spin' to describe this recovery session. Athletes with high training motivation often turn recovery rides into Zone 2 rides because 'it feels too easy.' The discipline to ride at 40-50% FTP when capable of much more is the most difficult and most important recovery skill. If the athlete cannot maintain the discipline, prescribe a complete rest day instead — a Zone 2 ride disguised as recovery is worse than no ride at all.",
    "The sleep deficit is a compounding factor — 9 hours of sleep tonight is not a suggestion, it's a recovery intervention with comparable impact to the active recovery ride. Prioritize sleep over any evening activities."
  ],
  "alternatives": [
    {
      "scenario": "Athlete insists on training Saturday due to scheduling constraints and cannot move sessions",
      "action": "Replace the 2h Zone 2 with a SHORTENED Zone 1 recovery ride: 60 min at 40-50% FTP (not the planned 70-75% Zone 2). This provides training compliance while still delivering meaningful recovery. The Sunday long ride MUST then be cancelled or swapped for another recovery day — the 400 TSS originally planned for the weekend cannot be executed in any modified form without significant overtraining risk. The Monday rest day remains."
    },
    {
      "scenario": "Athlete's readiness rebounds strongly to 55+ by Sunday morning with HRV back to baseline",
      "action": "The supercompensation has occurred faster than anticipated. Prescribe Full Active — 90 min Zone 2 at 60-70% FTP (168-196W) with optional 2-3 short (30s) openers at 110% FTP in the final 15 minutes. This maintains the adaptive window while still respecting the overall recovery block. The Monday rest day is now optional and can be converted to a Zone 2 day if readiness continues to climb."
    },
    {
      "scenario": "Athlete reports onset of mild illness symptoms (scratchy throat, fatigue beyond normal training fatigue, elevated resting HR beyond current +10%)",
      "action": "Upgrade immediately to REST_DAY. The immune system is suppressed during functional overreaching — adding training stimulus while fighting a nascent infection can extend illness duration from 2-3 days to 7-10 days. Complete rest until 24 hours symptom-free. The 'above the neck' rule (mild symptoms okay for light exercise) does NOT apply here — the athlete is already in a depleted state."
    }
  ],
  "references": [
    "Seiler, S. (2010) — What is best practice for training intensity and duration distribution in endurance athletes? International Journal of Sports Physiology and Performance. Polarized training model: easy days must be genuinely easy (<2.0 mmol/L lactate, Zone 1). Training in the 'gray zone' provides neither adequate recovery nor adequate stimulus.",
    "Halson, S.L. (2014) — Monitoring training load to understand fatigue in athletes. Sports Medicine. Multi-metric fatigue monitoring: TSB, HRV, resting HR, and subjective wellness as convergent recovery indicators. Sleep as the primary recovery intervention.",
    "Hausswirth, C. & Mujika, I. — Recovery for Performance in Sport. Multi-modal recovery protocols: active recovery (cycling), body work (foam rolling, stretching), nutrition (anti-inflammatory, protein timing), and sleep optimization. Tart cherry juice for DOMS reduction."
  ]
}
```
