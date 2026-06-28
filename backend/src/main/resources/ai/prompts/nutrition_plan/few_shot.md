# Nutrition Plan — Few-Shot Example

## Scenario

Athlete: 72 kg competitive amateur cyclist, FTP 260W (3.61 W/kg). Planned activity: 4-hour weekend endurance ride targeting 200W average (77% FTP, upper Zone 2 / low Zone 3). Weather: 25°C, 65% humidity, partly cloudy with light wind. Athlete has moderate gut tolerance history — can handle 80g/h without issues, has not attempted >90g/h. Known moderate sodium sweater (visible salt stains on kit). No caffeine sensitivity. Ride starts at 8:00 AM.

## Input Summary (what the model receives)

**Athlete Profile:**
- Weight: 72 kg
- FTP: 260W (3.61 W/kg)
- Gut training status: Moderate (handles 80g/h, untested at 90+)
- Sweat type: Moderate sodium sweater
- Caffeine: Tolerant (regular user)

**Planned Activity:**
- Duration: 4 hours (240 minutes)
- Average power target: 200W (77% FTP)
- Type: Endurance ride, Zone 2-3, includes some sustained climbs

**Weather:**
- Temperature: 25°C
- Humidity: 65%
- Wind: Light (5-10 km/h)

**Recent Activities (nutrition-relevant context):**
- Previous day: Recovery ride, 60 min at 120W. Normal eating pattern. No glycogen depletion concern.
- Sleep: 7.5h, good quality.

---

## Expected JSON Response

```json
{
  "summary": "4-hour ride at 200W (77% FTP): 2880 kJ total expenditure. Nutrition plan: 80g carbs/h (320g total) via 2:1 glucose:fructose drink mix + gels, 700 ml fluid/h, 750 mg sodium/h. Pre-ride: 100g carbs at T-2h. Post-ride: 85g carbs + 30g protein within 30 min. Estimated 2.0% body weight loss within safe range.",
  "insight": "A 4-hour ride at 200W average (77% FTP) represents upper Zone 2 endurance work — the intensity is high enough that carbohydrate oxidation dominates fuel substrate. At 200W with approximately 23% gross efficiency, total metabolic energy expenditure is approximately 12,522 kJ over 4 hours (200W × 240 min × 60 / 1000 × 1/0.23). Carbohydrate oxidation rates at 77% FTP are approximately 2.0-2.5 g/min for a trained cyclist — meaning without exogenous intake, endogenous glycogen stores (~500g total) would deplete in approximately 200-250 minutes. This puts the 4-hour mark at critical depletion risk without adequate fueling. Exogenous intake of 80g/h provides ~1.33 g/min of supplementary carbohydrate, reducing net glycogen drain to approximately 0.7-1.2 g/min and extending glycogen longevity well beyond the 4-hour target. The 2:1 glucose:fructose ratio is physiologically appropriate at 80g/h — it engages both SGLT1 (glucose) and GLUT5 (fructose) transporters for a combined absorption ceiling of approximately 90g/h (Jeukendrup, 2010). At 25°C, sweat rate for a 72 kg athlete at moderate intensity is estimated at 1.0-1.2 L/h — fluid intake of 700 ml/h leaves a deficit of 300-500 ml/h, totalling 1.2-2.0L over 4 hours. For a 72 kg athlete this represents 1.7-2.8% body weight loss, which is at the upper boundary of acceptable — increasing to 750 ml/h would maintain <2% loss. Sodium loss at 1.0-1.2 L/h sweat rate with moderate concentration (estimated 700 mg/L) equals 700-840 mg/h — intake of 750 mg/h matches losses closely.",
  "action": "Pre-ride (T-2h, 6:00 AM): 100g carbs — large bowl oatmeal (80g) with banana and honey + 250ml sports drink (20g carbs). Pre-ride (T-15min, 7:45 AM): 200ml water with caffeine gel (30g carbs, 75mg caffeine). During-ride (every 30 min starting at 0:30): alternate between 750ml bottle of drink mix (60g carbs, 500mg sodium per bottle) and gel (25g carbs). Target: finish 2 bottles + 4 gels over 4 hours = 320g carbs, 1000mg sodium. Fluid: sip 175ml every 15 min from bottles, supplement with plain water at refill stop at 2h mark. Post-ride (within 30 min): recovery shake — 85g carbs (banana + sports drink powder + oat milk) + 30g whey protein. Post-ride (2h later): full meal — chicken breast, rice, roasted vegetables, 500ml water + electrolytes.",
  "metrics": {
    "totalKjExpenditure": "2880",
    "totalMetabolicEnergyKj": "12522",
    "estimatedGlycogenOxidationRateGPerMin": "2.3",
    "carbsPerHour": "80",
    "totalCarbsG": "320",
    "carbSourceRatio": "2:1 glucose:fructose",
    "fluidPerHourMl": "700",
    "totalFluidL": "2.8",
    "sodiumPerHourMg": "750",
    "totalSodiumMg": "3000",
    "estimatedSweatRateLPerH": "1.1",
    "projectedBodyWeightLossPercent": "2.0",
    "preRideMealTimeBefore": "T-2h",
    "gutTrainingRequired": "No (80g/h within current tolerance)"
  },
  "confidence": 0.90,
  "confidence_breakdown": {
    "data_quality": 0.89,
    "trend_clarity": 0.92,
    "model_certainty": 0.88
  },
  "reasoning": "Step 1 — Energy expenditure: 200W × 240 min × 60 sec / 1000 = 2880 kJ of external work. With gross efficiency of ~23% (typical for trained cyclists), total metabolic energy expenditure = 2880 / 0.23 ≈ 12,522 kJ. Of this, an estimated 60-70% is carbohydrate-derived at 77% FTP (respiratory exchange ratio ~0.90-0.95), giving 7,513-8,765 kJ from carbohydrate oxidation, or approximately 470-550g total carbohydrate oxidized. Step 2 — Carbohydrate prescription: The 4-hour duration at 77% FTP falls in the 'Moderate intensity, >3h' category. Recommended intake: 80-90g/h per Jeukendrup framework. I prescribe 80g/h (320g total) rather than 90g/h because: (a) the athlete has not been gut trained for >80g/h, (b) 77% FTP is below the threshold where 90g+ is strongly indicated, and (c) prescribing above the athlete's proven tolerance risks GI distress that would compromise the training session. The 2:1 glucose:fructose ratio at 80g/h optimally engages both SGLT1 and GLUT5 transporters without exceeding the ~60g/h single-transporter ceiling. Net glycogen balance: 550g oxidized minus 320g exogenous intake minus ~50g liver glycogenolysis = ~180g net muscle glycogen utilization. Starting glycogen stores of ~400-450g (trained cyclist, no glycogen depletion from prior day) leaves 220-270g at ride end — the athlete should finish strong without glycogen depletion symptoms. Step 3 — Fluid prescription: At 25°C with 65% humidity and moderate intensity, estimated sweat rate is 1.0-1.2 L/h based on typical trained cyclist data (individual variation is high — this is an estimate without direct sweat testing). Prescribing 700 ml/h results in a deficit of 300-500 ml/h, or 1.2-2.0L total over 4 hours. For a 72 kg athlete: 1.2L / 72 kg = 1.7% loss (acceptable), 2.0L / 72 kg = 2.8% loss (borderline, approaching 2% threshold). I set 700 ml/h as the minimum target with a recommendation to increase to 750-800 ml/h if conditions feel hotter than forecast. At 700 ml/h, 2.8L total over 4 hours requires two 750ml bottles (1.5L) plus a refill stop at the 2-hour mark for the remaining 1.3L. Step 4 — Sodium prescription: Moderate sodium sweater at estimated 700 mg/L sweat sodium concentration × 1.1 L/h sweat rate = 770 mg/h sodium loss. Prescribed intake of 750 mg/h matches losses closely. Total sodium: 750 mg × 4h = 3000 mg. Delivered via drink mix (500 mg per 750ml bottle × 2 bottles = 1000 mg) plus sodium-containing gels (~50 mg each × 4 = 200 mg), remaining ~1800 mg from pre-ride meal and electrolyte tabs added to refill water. Step 5 — Pre-ride nutrition: Ride starts at 8:00 AM. T-2h meal at 6:00 AM with 100g low-fiber carbs (2.0 g/kg BW for a 72 kg athlete — within the 1-2 g/kg recommended range) is appropriate timing — gastric emptying is complete by ride start. Oatmeal provides low-GI sustained energy; banana adds potassium; honey adds fructose for mixed carb source. The caffeine gel at T-15min provides 75mg (1.0 mg/kg) for ergogenic effect — 60-90 min pre-exercise is optimal for caffeine, but 15 min pre-exercise through a gel achieves sufficient plasma concentration for alertness benefits during the ride. Step 6 — During-ride schedule: The alternating drink/gel pattern every 30 min (on the half-hour marks) provides a steady carbohydrate drip (30g per 30 min = 60g/h from drink; 25g per hour from gel = 85g/h total from both sources — close to the 80g target, slight overshoot acceptable). Starting at 0:30 gives the athlete 30 minutes of warm-up before introducing nutrition. Two 750ml bottles of mixed drink (total 120g carbs from drink mix) plus 4 gels (25g each = 100g) plus 1 caffeine gel pre-ride (25g) = 245g from packaged products. The remaining 75g to reach 320g total comes from the pre-ride meal's extended glucose release and a sports bar at the 2h refill stop. Step 7 — Post-ride recovery: The 30-minute glycogen window is critical. The prescribed 85g carbs + 30g whey protein achieves the 3:1 ratio ideal for glycogen resynthesis. Whey protein at 30g provides ~2.5g leucine — sufficient to trigger mTOR-mediated muscle protein synthesis. The 2-hour post-ride meal provides sustained recovery nutrition. Rehydration protocol: if 2.8L was consumed and 4.4L was lost (1.1 L/h × 4h), the 1.6L deficit should be replaced at 150% = 2.4L over the next 4-6 hours. The recommendation of 500ml with the recovery shake plus continued sipping achieves this.",
  "warnings": [
    "At 25°C, actual sweat rate may exceed the estimated 1.1 L/h if humidity rises or the athlete is a naturally heavy sweater. Monitor for early signs of dehydration: heart rate drift >5% at steady power, perceived thirst, or reduced sweat rate (paradoxically). If any appear, increase fluid intake to 900 ml/h.",
    "Intake of 80g/h of carbohydrate may cause mild GI discomfort in the first 60-90 minutes if the athlete typically consumes less. This is normal GI adaptation (thermoreceptors adapting) and typically resolves. If bloating or cramping occurs, reduce to 60g/h for this session and implement a structured gut training protocol.",
    "The 2:1 glucose:fructose ratio is critical at 80g/h. Using a single-source glucose drink mix (1:0 ratio) at this rate will overwhelm SGLT1 transporters and cause GI distress. Verify that the drink mix explicitly contains both maltodextrin/glucose AND fructose in approximately 2:1 ratio."
  ],
  "alternatives": [
    {
      "scenario": "Athlete prefers real food over sports nutrition products for this training ride",
      "action": "Replace drink mix with: banana (27g carbs, 422mg potassium) + date bar (45g carbs) + peanut butter sandwich on white bread (55g carbs) consumed at 1h and 2.5h marks. Replace gels with: dried mango (30g carbs per 40g serving) + salted potato (30g carbs, 200mg sodium) in jersey pockets. Drink plain water with electrolyte tablets (no carbs). Total carbs ≈ 300g from real food sources. Slightly lower absorption rate but acceptable for a training ride vs race."
    },
    {
      "scenario": "Weather forecast updates to 32°C with high humidity on ride day",
      "action": "Increase fluid to 900 ml/h (3.6L total) with 1000 mg/h sodium. Add pre-cooling: drink 500ml ice-cold water 30 min before start. Freeze one bottle overnight to provide cold fluid through first 90 min. Reduce power target by 5% (190W avg) to account for thermoregulatory cardiovascular drift. Consider starting 1 hour earlier to avoid peak heat."
    },
    {
      "scenario": "Athlete wants to target 90g/h to maximize performance for a race simulation",
      "action": "This ride is NOT the appropriate session for gut training experimentation. Gut training is best done on lower-intensity Zone 1-2 rides (<150W) where GI distress is less consequential. Recommend a dedicated gut training protocol on separate rides before attempting 90g/h at 77% FTP."
    }
  ],
  "references": [
    "Jeukendrup, A.E. (2010) — Carbohydrate and exercise performance: the role of multiple transportable carbohydrates. Current Opinion in Clinical Nutrition & Metabolic Care. 2:1 glucose:fructose ratio engages both SGLT1 and GLUT5 transporters to achieve combined absorption rates of up to 90g/h.",
    "Jeukendrup, A.E. (2017) — Training the gut for athletes. Sports Medicine. Gut trainability through progressive carbohydrate intake increases gastric emptying and intestinal absorption capacity; 4-6 week protocol from 60g to 90-120g/h.",
    "Coggan, A. & Allen, H. — Training and Racing with a Power Meter. Kilojoule expenditure calculation: power (watts) × duration (hours) × 3.6 = kJ. Gross efficiency of ~23% used to convert external work to metabolic energy cost for carbohydrate oxidation estimation.",
    "Coyle, E.F. (2004) — Fluid and fuel intake during exercise. Journal of Sports Sciences. Dehydration greater than 2% body weight impairs endurance performance; sodium replacement at 500-1000 mg/h matches sweat losses for most athletes."
  ]
}
```
