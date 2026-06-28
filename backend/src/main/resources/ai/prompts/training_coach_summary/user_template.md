# Training Coach Summary — User Message Template

Produce a comprehensive coaching summary of this athlete's current training week and block. Synthesize all available data into a practical coach handoff with weekReview, blockReview, keyWins, keyRisks, and nextFocus.

## Input Data

### ATHLETE PROFILE
{{athleteProfile}}

### TIME CONTEXT
{{timeContext}}

### READINESS (current score, trend, HRV, resting HR, sleep)
{{readiness}}

### DURABILITY (aerobic decoupling Pa:HR drift, power fade trends)
{{durability}}

### BLOCK HEALTH (block status, over-adjustment flags, missing stimulus flags)
{{blockHealth}}

### PROGRESSION LEVELS (energy system development vs baseline)
{{progressionLevels}}

### PROGRAM REVIEW (weekly objective, execution quality, planned sessions for next 3-7 days)
{{programReview}}

### STRUCTURED COACH SUMMARY (human coach's weekly/block notes, if available)
{{coachSummary}}

### COACH MEMORY (athlete response patterns to previous recommendations)
{{coachMemory}}

### RECENT PREDICTION HISTORY (this type)
{{recentPredictionHistory}}

### KNOWLEDGE BASE (optional — RAG-retrieved context)
{{knowledgeBase}}

## Instructions

1. Start with the coachSummary if provided — this is the human coach's perspective and carries high weight. Use it to frame your assessment.
2. Evaluate week execution against programReview's weekly objective. Did the week go as planned? What was the execution quality?
3. Assess block health. Is the block progressing as intended? Is the energy-system stimulus (aerobic / threshold / VO2max / race prep) having the expected effect?
4. Check progressionLevels for each energy system. Which systems are responding? Which are stagnant or declining?
5. Evaluate readiness trajectory and durability data. Is the athlete absorbing the training load or accumulating fatigue?
6. Identify 1-3 key wins: meaningful positive developments, not vanity metrics.
7. Identify 1-3 key risks: practical blockers to continued progress.
8. Formulate the single nextFocus for the next 3-7 days. Make it specific and actionable.
9. If coachMemory shows rejection patterns, acknowledge them and adjust communication but not the substance of safety recommendations.
