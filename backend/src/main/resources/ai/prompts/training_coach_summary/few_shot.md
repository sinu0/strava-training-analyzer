# Training Coach Summary — Few-Shot Example

## Scenario

Athlete: 72 kg cyclist, Week 3 of a 4-week threshold development block. Training 5-6 days per week with a polarized structure. Human coach provides weekly structured summaries reviewed by the AI. The athlete is responsive to threshold work but tends to skip designated recovery weeks and push volume beyond the plan.

## Input Summary (what the model receives)

**Coach Summary (human coach's notes):**
"Week 3 threshold block. Objective: 2 threshold sessions (Tuesday 2×20 FTP, Friday 3×15 sweet spot) with endurance fill. Athlete reported Tuesday session felt strong — completed at 295-305W (FTP 290W). Missed Friday session due to work conflict, rescheduled to Saturday but executed with reduced quality (struggled to hold 280W on third interval). Weekly TSS 490 (target 500). Concerned about the pattern of missed mid-week quality sessions — this is the second week in a row."

**Time Context:**
Assessment is end-of-week review (Sunday), covering Week 3 of a 4-week threshold block.

**Readiness:**
- Current readiness: 62/100
- 7-day trend: 58 → 56 → 54 → 59 → 61 → 60 → 62 (stabilized after mid-week dip)
- HRV: 84ms (baseline 81ms, within normal range)
- Resting HR: 50 bpm (baseline 50 bpm, normal)
- Sleep: 7.3 hrs average, good quality
- Mid-week dip (Day 3-5) corresponded with work conflict and poor sleep (5.8 hrs on Day 3)

**Durability:**
- Aerobic decoupling (last long ride, Day 1 of this week, 3 hrs): 4.8% (below 5% threshold, good)
- Power fade trend: stable across the block, no degradation at 3+ hours

**Block Health:**
- Status: "minor_adjustment_needed"
- Flag: "quality_session_missed — Friday threshold session rescheduled and executed below target power"
- Flag: "second_consecutive_midweek_miss — pattern emerging"
- Missing stimulus: "none" (the rescheduled session was completed, though at reduced quality)

**Progression Levels (energy systems vs block start baseline):**
- Aerobic endurance (Zone 2): +4% (steady improvement)
- Threshold (Zone 4): +3% (improving but below block target of +5% due to reduced session quality)
- VO2max (Zone 5): +2% (maintained, not a current block focus)
- Anaerobic capacity (Zone 6-7): +1% (minimal focus this block)
- Durability: +1% (maintained)

**Program Review:**
- Weekly objective: "Week 3 peak threshold — deliver 2 quality sessions with 40+ min total at 95-105% FTP. Total TSS target 500."
- Execution assessment: "Tuesday session executed at high quality (295-305W, 2×20 min completed). Friday session missed due to work; Saturday execution below target (280W vs 290W target). Weekly TSS 490 — close to target."
- Next 3-7 days planned: "Week 4 (final threshold block week): Monday rest, Tuesday threshold session #1 (2×20 min FTP), Wednesday Zone 2 endurance 2 hrs, Thursday Zone 2 + sprints, Friday threshold session #2 (over-unders), Saturday Zone 2 endurance 2.5 hrs, Sunday rest. Target TSS: 480."

**Coach Memory:**
- Accepts: threshold intervals, structured sessions, endurance rides, coach feedback
- Rejects: rest days (rarely takes Mondays off completely — usually does 45-60 min Zone 2 instead), recovery weeks (extends volume beyond prescription)
- Pattern: "Athlete adds 10-15% extra Zone 2 volume to endurance days when feeling good. Tends to treat planned recovery weeks as maintenance weeks. Has been warned twice about this pattern in previous block reviews."

---

## Expected JSON Response

```json
{
  "summary": "Week 3 threshold block progressing but with execution gaps. Key Tuesday session strong at 295-305W; Friday quality session was missed and the Saturday reschedule delivered below target. Block is on track for +3% threshold gain but below the +5% target. Address the midweek quality session reliability in Week 4.",
  "weekReview": "Week 3 — Peak threshold week — partially on track. Tuesday's 2×20-minute FTP session was executed with excellent quality at 295-305W (102-105% FTP), the strongest single session of the block so far. Friday's planned 3×15-minute sweet spot was missed due to a work conflict, and the Saturday reschedule produced degraded quality (280W on the third interval vs 290W target). This is the second consecutive week with a missed midweek quality session — last week it was the Tuesday session. Weekly TSS of 490 is close to the 500 target, but the quality distribution is skewed: one excellent session and one below-standard session does not equal two quality sessions. The midweek readiness dip (readiness dropped to 54 on Days 3-5, correlated with 5.8 hrs sleep on Day 3) suggests work stress is affecting both recovery and session availability. Durability remains solid at 4.8% decoupling — the endurance days are being executed reliably even when quality sessions are compromised.",
  "blockReview": "The 4-week threshold block is delivering progression (+3% threshold vs +5% target) but execution reliability on midweek quality sessions is the limiting factor. Aerobic endurance continues to strengthen (+4%) on the back of consistent Zone 2 volume, and durability is maintaining at acceptable levels. However, two consecutive weeks with compromised quality sessions have created a stimulus gap — the block's intended progressive overload on the threshold system is being delivered at approximately 60-70% of planned intensity due to scheduling issues rather than physiological limitations. Block health correctly flags 'minor adjustment needed' — this is not a crisis but does require a Week 4 course correction to maximize the block's adaptive stimulus before the transition to the next training phase. The athlete's demonstrated ability on Tuesday (295-305W) proves the physiological capacity exists — the issue is consistency of delivery, not fitness. The coach memory pattern of adding extra Zone 2 volume is not harmful to the block's purposes (it may even help explain the +4% aerobic gain) but should not substitute for missed quality work.",
  "keyWins": [
    "Tuesday 2×20-minute threshold session completed at 295-305W (102-105% FTP) was the highest-quality threshold execution of the entire block. Both 20-minute intervals held above target power with reported strong form — this confirms the athlete's FTP of 290W is accurate and potentially conservative.",
    "Readiness rebounded from a 54 midweek dip to 62 by Sunday despite work stress and reduced sleep, demonstrating solid recovery capacity. HRV and resting HR remained within normal ranges throughout."
  ],
  "keyRisks": [
    "Second consecutive week with a missed midweek quality session. The pattern (missed Tuesday Week 2, missed Friday Week 3) suggests the Tuesday/Friday quality day structure is vulnerable to work conflicts. If Week 4's Tuesday session is also missed, the block will close with only 3 of 6 planned threshold sessions completed at full quality — insufficient stimulus for a 4-week threshold development block to achieve the +5% target.",
    "Coach memory indicates the athlete adds 10-15% extra Zone 2 volume when feeling good and treats recovery weeks as maintenance weeks. Heading into the final block week and subsequent recovery/transition phase, there is risk the athlete will extend volume rather than accepting the planned deload. This pattern, if repeated, will blunt the supercompensation effect the recovery week is designed to produce."
  ],
  "nextFocus": "Protect Tuesday's threshold session at all costs — it is the single most important session remaining in this block. Rearrange non-training commitments to guarantee execution at 290-310W for 2×20 minutes. If a midweek conflict is unavoidable, proactively reschedule to Wednesday morning rather than pushing to Friday/Saturday when accumulated fatigue and life stress degrade quality. Enter the Week 5 recovery phase at exactly the prescribed volume — do not add extra Zone 2 'filler' rides.",
  "metrics": {
    "readinessScore": "62",
    "durabilityTrend": "stable (4.8% decoupling)",
    "mainProgressionSystem": "threshold_zone4",
    "thresholdProgression": "+3% vs +5% target",
    "aerobicProgression": "+4%",
    "executionScore": "70% (1 of 2 quality sessions delivered at full quality)",
    "nextFocusWindow": "Week 4 (final threshold block week)"
  },
  "confidence": 0.85,
  "confidence_breakdown": {
    "data_quality": 0.90,
    "trend_clarity": 0.85,
    "model_certainty": 0.80
  },
  "insight": "The athlete has the physiological capacity to execute this block at a high level — Tuesday's 295-305W session proves it. The gap between capacity and execution is purely logistical: midweek work conflicts are disrupting the Tuesday/Friday quality session cadence. The Tuesday session this week shows what happens when the athlete is fresh and the session is protected — 102-105% FTP execution. The Saturday reschedule shows what happens when the same session is pushed to the end of a stressful week — 97% FTP execution with fade on the third interval. This is not a training problem, it's a scheduling problem with training consequences. The block can still close at or near the +5% threshold target if the remaining Week 4 sessions are protected. Readiness data confirms the athlete recovered well from the midweek stress dip, so fatigue is not limiting performance — availability is. The coach memory pattern of adding extra Zone 2 volume is a secondary concern but becomes relevant heading into the recovery week: if the athlete converts the planned recovery week at 280 TSS into a 380 TSS 'maintenance' week, the accumulated fatigue from the block will not fully dissipate, blunting the performance gains the block was designed to produce. This is a pattern that needs direct coach intervention, not just observation.",
  "action": "For Week 4: Rearrange Tuesday's schedule to guarantee the morning training window is protected. If a midweek conflict is anticipated, pre-emptively plan the second quality session for Wednesday (not Friday) while the athlete is fresher. Set a firm agreement with the athlete: Week 5 recovery week TSS cap at 300 (50% of peak block TSS), no extra Zone 2 volume beyond plan. If the athlete wants to ride more, it must be Zone 1 recovery only.",
  "reasoning": "Step 1 — Coach summary integration: The human coach's notes provide the direct observation that Tuesday execution was excellent and Friday/Saturday execution was compromised. The coach identifies the pattern concern (second consecutive week) and the underlying cause (work conflict). The AI's role is to validate this assessment with data, add physiological context, and strengthen the Week 4 action plan. Step 2 — Week execution vs objective: Target was 2 quality sessions at 95-105% FTP. Session 1: fully delivered (102-105%). Session 2: partially delivered (rescheduled, 97% FTP on intervals 1-2, 280W/97% with fade on interval 3). Execution score: 70% — one session at full quality, one at reduced quality. TSS 490 vs 500 target is acceptable. Step 3 — Block trajectory: Threshold +3% vs +5% target. The deficit is attributable entirely to the two missed/reduced sessions (Week 2 Tuesday and Week 3 Friday). If the remaining Week 4 sessions are delivered at full quality, the block target is still achievable — the adaptive response to threshold training is non-linear and the strongest gains often come in the final block week when cumulative stimulus peaks. Step 4 — Readiness trajectory: The midweek dip (readiness 54, 5.8 hrs sleep) correlates with the Friday session being missed. The recovery to 62 by Sunday validates that the underlying recovery capacity is intact. The readiness pattern suggests the quality session placement should consider weekly stress patterns — Wednesday may be better than Friday for the second quality session if work stress accumulates through the week. Step 5 — Durability: 4.8% decoupling on the long ride is solid. No action needed. Step 6 — Coach memory risk: The pattern of extending recovery weeks is a structural concern. The athlete has been warned twice about this pattern. Heading into the Week 5 recovery/transition, direct communication about the physiological purpose of the recovery week (fatigue dissipation to enable supercompensation and prevent NFOR) is warranted. The coach memory should inform HOW this is communicated (firm, data-backed, with a specific cap number) rather than softening the recommendation. Step 7 — Key wins and risks: The wins demonstrate the block IS working when sessions are executed — this is encouraging because it means the problem is solvable (scheduling) rather than physiological (non-response). The risks focus on execution reliability and the recovery week pattern — both are actionable if addressed directly. Step 8 — Next focus: The Tuesday session is the most impactful remaining stimulus. Protecting it is priority #1. The 'Saturday quality session' pattern should be actively de-prioritized — Saturday reschedules have now failed twice. Wednesday morning is a better fallback slot based on the readiness data (readiness was recovering by Day 5, suggesting Wednesday would have been strong).",
  "warnings": [
    "If Week 4's Tuesday session is also missed, the block will close with only 50% of planned quality sessions delivered. At that point, extending the threshold block by one week (Week 5 becomes threshold rather than recovery) should be considered rather than accepting an under-stimulated block.",
    "The athlete's pattern of converting recovery weeks to maintenance weeks has been noted twice previously. A third occurrence in Week 5 should trigger a formal coach-athlete discussion about recovery compliance, as this pattern directly undermines periodization effectiveness."
  ],
  "references": [
    "Friel, J. — The Cyclist's Training Bible: Block periodization structure, recovery week integration (50-60% TSS reduction), and the role of supercompensation in performance gains."
  ],
  "structured_workout": null
}
```
