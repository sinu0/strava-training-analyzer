# Race Pacing Strategy — Few-Shot Example

## Scenario

Athlete: 68 kg competitive road cyclist, FTP 280W (4.12 W/kg). Target event: A-priority gran fondo, 120 km with 1800 m elevation, undulating terrain with two categorized climbs (8 km at 5.5%, 4 km at 7.2%) in the second half and rolling hills throughout. Target finish time: 4 hours 30 minutes. Known for strong sustained efforts (high durability) but limited sprint/anaerobic power. Recently completed a successful 16-week build with consistent threshold work.

## Input Summary (what the model receives)

**Power Duration Curve:**
- 5s: 850W (12.50 W/kg) — below average for competitive cyclist
- 1min: 490W (7.21 W/kg) — below average, anaerobic weakness
- 5min: 355W (5.22 W/kg) — competitive
- 20min: 300W (4.41 W/kg) — strong
- 60min: 275W (4.04 W/kg) — very strong durability, low decay
- FTP: 280W (4.12 W/kg)
- Power decay 20→60 min: 8.3% — excellent durability profile

**PMC Data:**
- CTL: 58, ATL: 55, TSB: +12 (taper week, race in 7 days)
- Readiness: 78/100

**Race Profile:**
- Distance: 120 km
- Total elevation: 1800 m
- Target time: 4:30 (4 hours 30 min)
- Segment breakdown:
  - 0-40 km: Flat/rolling, +200m elevation, mostly open roads
  - 40-65 km: Rolling hills, +400m, three short climbs (1-2 km at 4-5%)
  - 65-73 km: First categorized climb, 8 km at 5.5% average (440m), max gradient 9%
  - 73-85 km: Technical descent, -500m, then valley flat
  - 85-105 km: Rolling, +350m, feed zone at 95 km
  - 105-109 km: Second categorized climb, 4 km at 7.2% (288m), max gradient 11%
  - 109-120 km: Descent then flat to finish, -350m

---

## Expected JSON Response

```json
{
  "summary": "Negative split strategy for 120km/1800m gran fondo targeting 4:30. Start conservative at 72-78% FTP on opening flats, build through rolling middle at 80-85% FTP, attack the two categorized climbs at 90-95% FTP (first: cap at 95%, second: full gas at 100-105% for decisive selection). Estimated 3950 kJ total expenditure. Critical moments: Climb 1 at km 65 and Climb 2 at km 105.",
  "insight": "The athlete's PDC reveals a classic durability-dominant profile — exceptional 60-minute power retention (275W, 98.2% of 20-min power) with limited anaerobic capacity (1min 490W, 1.75× FTP vs typical 2.0-2.3×). This profile is well-suited to a negative split on a back-loaded course where the two categorized climbs arrive at km 65 and km 105 — the athlete can ride conservatively on the first 40 km of flat, preserving glycogen and W' for the decisive climbs. The 8.3% power decay from 20 to 60 minutes is excellent (<10% is considered high durability), meaning the athlete can sustain close to threshold power on long climbs without fade. At 68 kg with 4.12 W/kg, climbing at 5.5% gradient at 90% FTP (252W, 3.71 W/kg) yields approximately 17-18 km/h — the 8 km Climb 1 will take ~28 minutes, which is within the athlete's proven sustained power range. Climb 2 at 7.2% requires 100-105% FTP (280-294W, 4.12-4.32 W/kg) for selection — this effort of ~16 minutes is within the athlete's demonstrated capability given the 20-min power of 300W. The negative split approach on a back-loaded course is physiologically optimal: riding at 72-78% FTP (202-218W) on flat terrain maintains high fat oxidation (>0.8 g/min), sparing an estimated 80-100g of glycogen for the climbs. Total estimated energy expenditure of 3950 kJ (calculated as 270 min × 245W avg / 1000 × 60) requires strategic carbohydrate intake of 80-90 g/h to avoid depletion.",
  "action": "Segment 1 (0-40 km, flat/rolling): 72-78% FTP (202-218W), HR Zone 2, cadence 85-95 rpm, stay sheltered in peloton. Segment 2 (40-65 km, rolling): 78-85% FTP (218-238W), HR Zone 2-3, climbs at 90% FTP max (252W), cadence 75-85 on climbs. Segment 3 (65-73 km, Climb 1): 88-95% FTP (246-266W), cap efforts at 95% FTP — do NOT exceed 266W, HR Zone 3-4, cadence 70-80 rpm seated, maintain rhythm. Segment 4 (73-85 km, descent): 60-65% FTP (168-182W) active recovery, hydrate, eat 60g carbs. Segment 5 (85-105 km, rolling + feed): 80-85% FTP (224-238W), feed at km 95 with 80g carbs + 750ml. Segment 6 (105-109 km, Climb 2): 100-105% FTP (280-294W) decisive effort, cadence 65-75 rpm, standing on steepest sections. Segment 7 (109-120 km, flat finish): 85-90% FTP (238-252W) time trial to finish.",
  "metrics": {
    "ftp": "280W",
    "wkg": "4.12",
    "pdc20min": "300W",
    "pdc60min": "275W",
    "powerDecay20to60min": "8.3%",
    "durabilityRating": "Excellent",
    "estimatedTotalKj": "3950",
    "pacingStrategy": "Negative Split",
    "courseClimbs": "2 categorized (8km 5.5%, 4km 7.2%)",
    "totalElevation": "1800m",
    "targetDuration": "4h30m",
    "segmentCount": "7"
  },
  "confidence": 0.85,
  "confidence_breakdown": {
    "data_quality": 0.90,
    "trend_clarity": 0.83,
    "model_certainty": 0.81
  },
  "reasoning": "Step 1 — PDC Analysis: Athlete's 5s power (850W) and 1min power (490W) are below competitive norms for a 4.12 W/kg FTP cyclist, indicating an anaerobic weakness. However, 20-min (300W) and 60-min (275W) power are strong with only 8.3% decay — this is a classic durability profile. The athlete can sustain threshold-level power for extended durations but cannot rely on short explosive efforts. Strategy must leverage the durability advantage and avoid anaerobic demands. Step 2 — Course analysis: The 120 km course with 1800m elevation is moderately demanding (average gradient 1.5%). However, the elevation is concentrated in the second half — the first 40 km are mostly flat, and the two categorized climbs both fall after km 65. This back-loaded profile naturally favors a negative split strategy. The first climb (8 km at 5.5%) is longer but shallower — sustained threshold power is the physiological demand. The second climb (4 km at 7.2%) is shorter but steeper — higher relative power for a shorter duration. For a 68 kg athlete, climbing the 5.5% gradient requires approximately 3.7 W/kg to maintain 18 km/h; at 90% FTP (252W, 3.71 W/kg) this is sustainable. The 7.2% climb requires approximately 4.3 W/kg for competitive pace — at 100-105% FTP (4.12-4.32 W/kg) the athlete can produce this for the estimated 16-minute duration given the 20-min power of 300W. Step 3 — Energy calculation: Estimated average power across the 4.5-hour event is approximately 244W (accounting for drafting on flats, climbs at 90-95% FTP, and descents at recovery). Total kJ = 244W × 270 min × 60 / 1000 ≈ 3953 kJ. At a gross efficiency of approximately 23%, total metabolic energy expenditure is approximately 17,187 kJ. With glycogen stores of approximately 2000-2500 kJ (liver + muscle) and fat oxidation contributing approximately 0.6-0.8 g/min at 65-75% FTP, the athlete can oxidize approximately 162-216g of fat over 4.5h, contributing ~6075-8100 kJ. This leaves an estimated 9000 kJ from exogenous and endogenous carbohydrate — requiring aggressive carb intake of 80-90 g/h and a conservative early pacing strategy to preserve glycogen. Step 4 — Segment power targets: Segment 1 (flat, 0-40 km) at 72-78% FTP (202-218W) keeps the athlete firmly in Zone 2 where fat oxidation is maximized. HR Zone 2 with drafting should feel very comfortable — the athlete should stay in the peloton and not contribute to pace-making. Segment 2 (rolling, 40-65 km) raises to 78-85% FTP (218-238W) with a 90% FTP cap on the three short climbs. These climbs serve as 'openers' but must not deplete W'. Segment 3 (Climb 1, 65-73 km) at 88-95% FTP (246-266W) with a hard cap at 95% FTP — this is the discipline point. Many athletes will surge above threshold here and pay for it on Climb 2. The cap ensures W' is preserved. Segment 4 (descent, 73-85 km) is a critical nutrition and recovery window — 60-65% FTP active recovery, consume 60g carbs and 500-750ml fluid. Segment 5 (rolling + feed, 85-105 km) is the bridge section — maintain 80-85% FTP, feed aggressively at km 95. Segment 6 (Climb 2, 105-109 km) is the decisive effort at 100-105% FTP (280-294W) — this is where the athlete's durability advantage pays off. While competitors fade from earlier over-exertion, the athlete can produce threshold+ power on the final climb. Segment 7 (finish, 109-120 km) at 85-90% FTP in time trial mode — the athlete should have glycogen remaining for a strong finish.",
  "warnings": [
    "Absolute power cap of 266W (95% FTP) on Climb 1 is non-negotiable. Exceeding this for sustained periods will deplete the W' balance and compromise Climb 2 performance. If the peloton surges above this pace, let them go — at 4.12 W/kg and 68 kg, the athlete can time trial back on the descent and valley flat.",
    "The 60-65% FTP recovery on the descent (Segment 4) must be taken seriously — this is the only extended recovery window between the two climbs. If heart rate does not drop into Zone 1-2 on this segment, the athlete is not recovering adequately.",
    "Cadence below 65 rpm on Climb 2 significantly increases muscular fatigue due to elevated force requirements per pedal stroke. If the gradient forces cadence below 65, shift to a lower gear and accept lower speed rather than grinding at high torque."
  ],
  "alternatives": [
    {
      "scenario": "Peloton is aggressive on Segment 1, cruising pace is 85-90% FTP rather than expected 72-78%",
      "action": "Sit at the back of the peloton to maximize draft — aerodynamic savings of 25-35% in the bunch reduce effective power requirement. If still forced above 82% FTP, accept a slower climb on Climb 1 rather than entering it depleted. A 90-second slower Climb 1 is recoverable; a glycogen-depleted Climb 2 is not."
    },
    {
      "scenario": "Athlete feels exceptionally strong on Climb 1 and is tempted to push above 95% FTP",
      "action": "If readiness is above 80 and CTL > 60 on race day (confirm morning metrics), the cap can be raised to 98% FTP (274W) but no higher. The additional 8W is physiologically significant over 28 minutes (~13 kJ additional work) and will reduce Climb 2 capacity."
    },
    {
      "scenario": "Headwind on final flat section (km 109-120) makes time trialing at 85-90% FTP unsustainable",
      "action": "Reduce target to 78-82% FTP (218-230W) and adopt an aero position. If riders remain, cooperate in a paceline rather than solo time trialing. The finishing time target of 4:30 allows for 10-15 minutes of wind-related delay without exceeding plan."
    }
  ],
  "references": [
    "Allen, H. & Coggan, A. — Training and Racing with a Power Meter. Segment-based pacing using %FTP power targets derived from PDC analysis. Negative split strategy for endurance events >3 hours. Power caps for climbs to prevent premature W' depletion.",
    "Skiba, P.F. et al. — The W' Balance Model. Modeling anaerobic work capacity depletion and recovery during variable-intensity cycling. Application to pacing strategy: capping above-CP efforts to preserve W' for decisive race moments.",
    "Swart, J. et al. (2009) — A dynamic model of cycling performance: pacing on variable terrain. British Journal of Sports Medicine. Optimal power distribution varies with gradient — higher power on climbs yields disproportionate time savings compared to equivalent power increase on flats."
  ],
  "structured_workout": {
    "type": "race_simulation",
    "total_duration_min": 270,
    "intervals": [
      {
        "duration_sec": 5400,
        "power_target": "72-78% FTP (202-218W)",
        "cadence": "85-95 rpm",
        "description": "Flat/rolling start. Stay in peloton, maximize draft. HR Zone 2. Nutrition: start eating at 30 min mark, 25g carbs every 20 min."
      },
      {
        "duration_sec": 3600,
        "power_target": "78-85% FTP (218-238W), climbs capped at 90% FTP (252W)",
        "cadence": "75-85 rpm on climbs, 85-95 rpm flats",
        "description": "Rolling hills. Three short climbs (1-2 km at 4-5%). Use these as openers, do not exceed 252W. Maintain rhythm, do not chase attacks."
      },
      {
        "duration_sec": 1680,
        "power_target": "88-95% FTP (246-266W), hard cap 95% FTP",
        "cadence": "70-80 rpm seated",
        "description": "Climb 1: 8km at 5.5% avg (440m). Sustained threshold effort. Cap at 266W absolute. Stay seated to conserve energy. If peloton surges above cap, let them go — you can TT back on the descent."
      },
      {
        "duration_sec": 2400,
        "power_target": "60-65% FTP (168-182W)",
        "cadence": "80-90 rpm",
        "description": "Technical descent + valley flat. Active recovery. CRITICAL: consume 60g carbs + 500-750ml electrolyte drink. Allow HR to drop to Zone 1-2. Reassess legs — should feel refreshed."
      },
      {
        "duration_sec": 3600,
        "power_target": "80-85% FTP (224-238W)",
        "cadence": "85-95 rpm flats, 75-85 rpm rollers",
        "description": "Rolling terrain with feed zone at km 95. Stop for feed or consume carried nutrition: 80g carbs + 750ml fluid. Maintain group position, do not initiate breaks."
      },
      {
        "duration_sec": 960,
        "power_target": "100-105% FTP (280-294W)",
        "cadence": "65-75 rpm, standing on >9% sections",
        "description": "Climb 2: 4km at 7.2% avg (288m). DECISIVE EFFORT. Full commit — this is where the race is won. Use negative split energy advantage. Attack at 2km remaining if legs permit."
      },
      {
        "duration_sec": 2520,
        "power_target": "85-90% FTP (238-252W)",
        "cadence": "90-100 rpm, aero position",
        "description": "Descent then flat to finish. Time trial mode. Draft if riders available. If solo, aero tuck. Target 4:30 finish — you have the glycogen for a strong finish."
      }
    ]
  }
}
```
