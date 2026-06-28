# Nutrition Plan — User Message Template

Calculate a complete sports nutrition plan for a planned cycling activity. Include total energy expenditure (kJ), carbohydrate targets per hour (g/h), fluid targets per hour (ml/h), sodium targets per hour (mg/h), pre-ride meal timing and composition, during-ride nutrition schedule (timing, sources, quantities), and post-ride recovery nutrition. Adjust all targets for athlete body weight, FTP, planned intensity, duration, and environmental conditions.

## Input Data

### ATHLETE PROFILE
{{athleteProfile}}

### TIME CONTEXT
{{timeContext}}

### PLANNED ACTIVITY (duration, intensity targets, estimated average power, type)
{{plannedActivity}}

### RECENT ACTIVITIES (last 7 days, to assess nutritional status and glycogen depletion)
{{recentActivities}}

### WEATHER CONDITIONS (temperature, humidity, wind, forecast)
{{weatherConditions}}

### READINESS DATA (current score, sleep quality, HRV, resting HR)
{{readiness}}

### KNOWLEDGE BASE (optional — RAG-retrieved context)
{{knowledgeBase}}

## Instructions

1. Calculate total energy expenditure in kJ from planned activity: estimated_average_watts × duration_min × 60 / 1000. Factor in approximate gross efficiency (~23%) to estimate total metabolic energy cost.
2. Determine the dominant intensity zone and prescribe carbohydrate intake per hour based on the Jeukendrup multi-transportable carbohydrate framework. If duration exceeds 3 hours and intensity exceeds 75% FTP, recommend 80-90g/h with 2:1 glucose:fructose ratio. Cap at 90g/h unless gut training status is confirmed.
3. Calculate fluid requirements based on temperature, humidity, and intensity. Estimate sweat rate from body weight if known, otherwise use environmental tiers. Target <2% body weight loss.
4. Calculate sodium requirements based on sweat sodium concentration if known, otherwise use environmental tiers. Recommend specific products or ratios to achieve targets.
5. Pre-ride nutrition: timing relative to start, carbohydrate loading protocol if event exceeds 2.5 hours (10-12g/kg BW day before for high-intensity events), meal composition by time window.
6. During-ride nutrition schedule: break the activity into time windows (every 20-30 min for carbs, every 15-20 min for fluids). Specify exact sources: gels, bars, drink mix, real food. Calculate total product quantities needed.
7. Post-ride recovery nutrition: immediate (0-30 min) and extended (2h+) windows. Include carbohydrate:protein ratio, rehydration protocol (150% of fluid deficit), and anti-inflammatory food choices.
8. Flag any special considerations: caffeine strategy, gut training prerequisites for high-carb plans, heat acclimation if temperature >30°C, altitude adjustments if applicable.
