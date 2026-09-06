export interface paths {
    "/api/activities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listActivities"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/activities/{activityId}/ai-note": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getNote"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/activities/{activityId}/ai-note/ask": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["ask"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/activities/{activityId}/ai-note/generate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["generateNote"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/activities/{activityId}/ai-note/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["refreshNote"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/activities/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getActivity"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/activities/{id}/map": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getActivityMap"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/activities/{id}/recalculate-metrics": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["recalculateActivityMetrics_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/activities/{id}/recalculate-training-effect": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["recalculateTrainingEffect"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/activities/heatmap": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getActivityHeatmap"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/activities/heatmap/tile/{z}/{x}/{y}.png": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getTile"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/activities/timeline": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getTimeline_2"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/adaptive-coach/decide": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["decide_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/adaptive-coach/feedback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["feedback_2"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/adaptive-coach/today": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["today_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/ftp-history/rebuild": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["rebuildFtpHistory"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/heatmap/rebuild": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["rebuildHeatmap"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/recalculate-all-training-effects": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["recalculateAllTrainingEffects"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/strava-config": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getStravaConfig"];
        put: operations["updateStravaConfig"];
        post?: never;
        delete: operations["resetStravaConfig"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/weather-job-status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getWeatherJobStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ai/batch/run": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["runBatch"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ai/predict": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["predict_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ai/predict/compare": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["compareModels"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ai/predictions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getHistory_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ai/predictions/{id}/verify": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["verifyPrediction"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ai/prompts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getAll_4"];
        put?: never;
        post: operations["save_2"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ai/prompts/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["delete_5"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ai/prompts/{id}/activate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["activate"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ai/prompts/{id}/deactivate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["deactivate"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ai/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ai/today-tips": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getTodayTips"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/analytics/block-health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getBlockHealth"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/analytics/compare": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["comparePeriods"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/analytics/daily-optimal-load": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getDailyOptimalLoad"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/analytics/durability": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getDurability"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/analytics/ftp-progress": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getFtpProgress"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/analytics/pmc": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getPmc"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/analytics/power-curve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getPowerCurve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/analytics/progression-levels": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getProgressionLevels"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/analytics/readiness": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getReadiness"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/analytics/readiness/check-in": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["saveReadinessCheckIn"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/analytics/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getSummary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/analytics/training-status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getTrainingStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/analytics/trends": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getTrends"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/analytics/weekly": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getWeeklySummaries"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/analytics/weekly-brief": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getWeeklyBrief"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/analytics/weekly-budget": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getWeeklyBudget"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/analytics/weekly-mmp": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getWeeklyMmp"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/analytics/weekly-optimal-load": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getWeeklyOptimalLoad"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/analytics/zones": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getZoneDistribution"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/strava/callback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["callback"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/strava/connect": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["connect_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/challenges": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getAll_3"];
        put?: never;
        post: operations["create_3"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/challenges/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["update_3"];
        post?: never;
        delete: operations["delete_3"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/challenges/active": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getActive_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/challenges/templates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getTemplates"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/coach/decide": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["decide"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/coach/feedback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["feedback_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/coach/today": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getTodayDecision"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/daily-decision": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getDailyDecision"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/discover/discover": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getUnexploredDirections"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/equipment": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getAll_2"];
        put?: never;
        post: operations["create_2"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/equipment/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getById_1"];
        put: operations["update_2"];
        post?: never;
        delete: operations["delete_2"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/equipment/alerts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getAlerts"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/evaluation/workout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["evaluateWorkout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getAll_1"];
        put?: never;
        post: operations["create_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/events/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["update_1"];
        post?: never;
        delete: operations["delete_1"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/events/active": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getActive"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/events/active/projection": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getActiveProjection"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/fatigue-energy/load-focus": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getLoadFocus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/fatigue-energy/state": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getState"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/fatigue-energy/suggest": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["suggestSessions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/gamification/achievements": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getAchievements"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/gamification/achievements/evaluate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["evaluateAchievements"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/health/metrics": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["updateMetrics"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/health/overview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getOverview_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/health/recovery": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getRecoveryStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/health/timeline": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getTimeline_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/journal": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getEntries"];
        put?: never;
        post: operations["save_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/journal/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["delete_4"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/journal/activity/{activityId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getByActivityId"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/journal/latest": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getLatest"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/journal/mood-correlation": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getMoodCorrelation"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/journal/recent": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getRecent"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/mcp/info": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["info"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/mcp/message": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["message"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/mcp/sse": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["connect"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/nudges": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getPendingNudges"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/performance/current-state": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getCurrentState"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/performance/predict": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["predict"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/personal-records": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getAllRecords"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/personal-records/detect": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["detectNewRecords"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/personal-records/recent": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getRecentRecords"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getProfile"];
        put: operations["updateProfile"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/routes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["listRoutes"];
        put?: never;
        post: operations["createRoute"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/routes/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getRoute"];
        put?: never;
        post?: never;
        delete: operations["deleteRoute"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/routes/{id}/gpx": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["exportGpx"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/routes/generate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["generateRoute"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/routes/generate/alternatives": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["generateRouteAlternatives"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/routes/generate/persist": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["generateAndPersist"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/routes/preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["previewRoute"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/season-wrapped": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getWrapped"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/season-wrapped/years": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getAvailableYears"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/streak/calendar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getCalendar_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/streak/stats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getStats"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/sync/auto-sync-config": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getAutoSyncConfig"];
        put: operations["updateAutoSyncConfig"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/sync/data": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["clearData"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/sync/recalculate-activity-metrics": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["recalculateActivityMetrics"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/sync/recalculate-metrics": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["recalculateMetrics"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/sync/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["syncStatus"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/sync/strava/check": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["checkNewActivities"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/sync/strava/full": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["fullSync"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/sync/strava/photos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["syncActivityPhotos"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/sync/strava/recent": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["recentSync"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/sync/strava/resync-streams": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["resyncStreams"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/timeline": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getTimeline"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/training-priorities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getPriorities"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/training/adapt": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["adapt"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/training/adjustments/feedback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["recordAdjustmentFeedback"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/training/calendar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getCalendar"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/training/optimize": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["optimize"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/training/optimize/apply": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["applyOptimizedPlan"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/training/plans": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getPlans"];
        put?: never;
        post: operations["createPlan"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/training/plans/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["deletePlan"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/training/plans/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["updateStatus"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/training/programs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getPrograms"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/training/programs/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["deleteProgram"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/training/programs/generate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["generatePlan"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/training/templates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getAll"];
        put?: never;
        post: operations["create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/training/templates/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getById"];
        put: operations["update"];
        post?: never;
        delete: operations["delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/training/templates/{id}/export/fit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["exportFit_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/training/templates/{id}/export/zwo": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["exportZwo_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/activities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["findActivities"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/activities/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["findActivity"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/activities/{id}/laps": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["findLaps"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/activities/{id}/segments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["findSegments_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/activities/{id}/streams": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["findStreams"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/analysis-data/backfill/{type}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["status"];
        put?: never;
        post: operations["start_1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/analytics/compare": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["compare_1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/analytics/load": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["load"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/analytics/overview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["overview"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/analytics/power": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["power"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/data-quality/activities/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["activity"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/data-quality/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["summary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/import-jobs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["createImportJob"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/jobs/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getJob"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/jobs/{id}/retry": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["retryJob"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/matched-rides/{groupId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["findGroup"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/matched-rides/activity/{activityId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["findForActivity"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/planning/load-scenario": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["loadScenario"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/recalculation-jobs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["createRecalculationJob"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/segments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["findSegments"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/segments/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["findSegment"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/segments/{id}/comparison": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["compare"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/segments/{id}/efforts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["findEfforts"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/segments/{id}/favorite": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["setFavorite"];
        trace?: never;
    };
    "/api/v2/today": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getToday"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/training/context": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["get"];
        put: operations["save"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/training/weekly-review": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["review"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/ui-preferences": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getPreferences"];
        put: operations["updatePreferences"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workouts/delivery-capabilities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["capabilities"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workouts/executions/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["execution"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workouts/executions/{id}/abort": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["abort"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workouts/executions/{id}/activity-candidates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["candidates"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workouts/executions/{id}/activity-link": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["link"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workouts/executions/{id}/complete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["complete"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workouts/executions/{id}/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["event"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workouts/executions/{id}/feedback": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["feedback"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workouts/executions/active": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["active"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workouts/scheduled/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["scheduled"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workouts/scheduled/{id}/executions/start": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["start"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workouts/scheduled/{id}/export/fit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["exportFit"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workouts/scheduled/{id}/export/zwo": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["exportZwo"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v2/workouts/today": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["today"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/weather/current": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getCurrentWeather"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/weather/forecast": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getWeatherForecast"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/weather/gradient": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getWeatherGradient"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/weather/gradient/point": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getWeatherPointGradient"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/weather/gradient/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["refreshGradient"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/weather/gradient/refresh-all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["refreshAllGradients"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/weather/locations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getLocations"];
        put?: never;
        post: operations["addLocation"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/weather/locations/{name}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["deleteLocation"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/weather/locations/{name}/activate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["activateLocation"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/weather/locations/active": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getActiveLocation"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/weight": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getOverview"];
        put?: never;
        post: operations["addWeight"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/weight/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["deleteWeight"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/weight/goal": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["setGoal"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/weight/goal/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["deleteGoal"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/weight/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getHistory"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        AccountabilityDto: {
            /** Format: double */
            actualLoad?: number;
            /** Format: double */
            expectedLoad?: number;
            /** Format: double */
            gap?: number;
            message?: string;
            recommendedAction?: string;
            status?: string;
            /** Format: double */
            timelineAdjustmentDays?: number;
        };
        AchievementDto: {
            description?: string;
            icon?: string;
            id?: string;
            name?: string;
            type?: string;
            unlocked?: boolean;
            /** Format: date */
            unlockedAt?: string;
        };
        ActivityDataQualityDto: {
            /** Format: uuid */
            activityId?: string;
            /** Format: date-time */
            assessedAt?: string;
            issues?: string[];
            status?: string;
        };
        ActivityDetailDto: {
            altitudeStream?: number[];
            /** Format: int32 */
            avgCadence?: number;
            /** Format: int32 */
            avgHeartrate?: number;
            /** Format: int32 */
            avgPowerW?: number;
            avgSpeedMs?: number;
            avgTempC?: number;
            cadenceStream?: number[];
            /** Format: int32 */
            calories?: number;
            /** Format: date-time */
            createdAt?: string;
            description?: string;
            deviceWatts?: boolean;
            distanceM?: number;
            distanceStream?: number[];
            /** Format: int32 */
            elapsedTimeSec?: number;
            elevationGainM?: number;
            elevationLossM?: number;
            externalId?: string;
            heartrateStream?: number[];
            /** Format: uuid */
            id?: string;
            laps?: components["schemas"]["LapDto"][];
            latStream?: number[];
            lngStream?: number[];
            /** Format: int32 */
            maxCadence?: number;
            /** Format: int32 */
            maxHeartrate?: number;
            /** Format: int32 */
            maxPowerW?: number;
            maxSpeedMs?: number;
            metrics?: {
                [key: string]: Record<string, never>;
            };
            /** Format: int32 */
            movingTimeSec?: number;
            name?: string;
            photoUrls?: string[];
            powerStream?: number[];
            source?: string;
            sportType?: string;
            /** Format: date-time */
            startedAt?: string;
            summaryPolyline?: string;
            timeStream?: number[];
            trainingEffect?: components["schemas"]["ActivityTrainingEffectDto"];
            /** Format: date-time */
            updatedAt?: string;
            velocityStream?: number[];
        };
        ActivityHeatmapBoundsDto: {
            /** Format: double */
            east?: number;
            /** Format: double */
            north?: number;
            /** Format: double */
            south?: number;
            /** Format: double */
            west?: number;
        };
        ActivityHeatmapDto: {
            bounds?: components["schemas"]["ActivityHeatmapBoundsDto"];
            /** Format: int32 */
            maxCount?: number;
            /** Format: int32 */
            routeCount?: number;
            /** Format: int32 */
            segmentCount?: number;
            segments?: components["schemas"]["HeatmapSegmentDto"][];
            status?: string;
            /** Format: double */
            totalDistanceKm?: number;
        };
        ActivitySegmentsDto: {
            /** Format: uuid */
            activityId?: string;
            availability?: string;
            backfillStatus?: string;
            efforts?: components["schemas"]["SegmentEffortDto"][];
            personalBestConfirmed?: boolean;
            routePolyline?: string;
        };
        ActivityStreamsDto: {
            altitude?: number[];
            cadence?: number[];
            distance?: number[];
            heartrate?: number[];
            latitude?: number[];
            longitude?: number[];
            /** Format: int32 */
            originalPoints?: number;
            power?: number[];
            resolution?: string;
            /** Format: int32 */
            returnedPoints?: number;
            series?: string[];
            time?: number[];
            velocity?: number[];
        };
        ActivitySummaryDto: {
            /** Format: int32 */
            avgHeartrate?: number;
            /** Format: int32 */
            avgPowerW?: number;
            avgSpeedMs?: number;
            /** Format: int32 */
            calories?: number;
            deviceWatts?: boolean;
            distanceM?: number;
            elevationGainM?: number;
            externalId?: string;
            /** Format: uuid */
            id?: string;
            /** Format: int32 */
            movingTimeSec?: number;
            name?: string;
            /** Format: int32 */
            newRecordCount?: number;
            photoUrls?: string[];
            primaryBenefit?: string;
            /** Format: int32 */
            segmentCount?: number;
            sportType?: string;
            /** Format: date-time */
            startedAt?: string;
            summaryPolyline?: string;
            /** Format: int32 */
            trainingScore?: number;
        };
        ActivitySummaryPageDto: {
            items?: components["schemas"]["ActivitySummaryDto"][];
            /** Format: int32 */
            page?: number;
            /** Format: int32 */
            size?: number;
            /** Format: int64 */
            total?: number;
            /** Format: int32 */
            totalPages?: number;
        };
        ActivityTimelineEntry: {
            /** Format: int64 */
            count?: number;
            /** Format: int32 */
            month?: number;
            /** Format: int32 */
            year?: number;
        };
        ActivityTrainingEffectDto: {
            /** Format: uuid */
            activityId?: string;
            aerobicLabel?: string;
            aerobicTe?: number;
            anaerobicLabel?: string;
            anaerobicTe?: number;
            /** Format: date-time */
            calculatedAt?: string;
            dataQuality?: string;
            details?: {
                [key: string]: Record<string, never>;
            };
            /** Format: uuid */
            id?: string;
            primaryBenefit?: string;
            /** Format: int32 */
            qualityScore?: number;
            /** Format: int32 */
            recoveryTimeHours?: number;
            secondaryBenefit?: string;
            /** Format: int32 */
            trainingScore?: number;
        };
        ActivityV2DetailDto: {
            /** Format: int32 */
            avgCadence?: number;
            /** Format: int32 */
            avgHeartrate?: number;
            /** Format: int32 */
            avgPowerW?: number;
            avgSpeedMs?: number;
            avgTempC?: number;
            /** Format: int32 */
            calories?: number;
            /** Format: date-time */
            createdAt?: string;
            description?: string;
            deviceWatts?: boolean;
            distanceM?: number;
            /** Format: int32 */
            elapsedTimeSec?: number;
            elevationGainM?: number;
            elevationLossM?: number;
            externalId?: string;
            /** Format: uuid */
            id?: string;
            /** Format: int32 */
            maxCadence?: number;
            /** Format: int32 */
            maxHeartrate?: number;
            /** Format: int32 */
            maxPowerW?: number;
            maxSpeedMs?: number;
            metrics?: components["schemas"]["MetricValueDto"][];
            /** Format: int32 */
            movingTimeSec?: number;
            name?: string;
            source?: string;
            sportType?: string;
            /** Format: date-time */
            startedAt?: string;
            summaryPolyline?: string;
            trainingEffect?: components["schemas"]["ActivityTrainingEffectDto"];
            /** Format: date-time */
            updatedAt?: string;
        };
        AdaptiveCoachRequest: {
            aiInput?: string;
            /** Format: double */
            atl?: number;
            /** Format: double */
            baselineHrv?: number;
            /** Format: double */
            baselineRestingHr?: number;
            /** Format: double */
            bodyBattery?: number;
            /** Format: int32 */
            completedRecentSessions?: number;
            /** Format: double */
            ctl?: number;
            /** Format: double */
            currentValue?: number;
            /** Format: date */
            deadline?: string;
            /** Format: double */
            durabilityIndex?: number;
            /** Format: int32 */
            expectedRecentSessions?: number;
            /** Format: double */
            ftp?: number;
            goalContext?: string;
            goalType?: string;
            hasHrvData?: boolean;
            hasRecentActivities?: boolean;
            hasWeatherData?: boolean;
            /** Format: double */
            hrvRmssd?: number;
            overrideState?: string;
            /** Format: double */
            progressPerWeek?: number;
            /** Format: double */
            readinessScore?: number;
            recentSessionOutcomes?: string[];
            /** Format: double */
            restingHr?: number;
            /** Format: double */
            sleepScore?: number;
            /** Format: double */
            stressAvg?: number;
            targetMetric?: string;
            /** Format: double */
            targetValue?: number;
            /** Format: int32 */
            timeAvailableMinutes?: number;
            /** Format: double */
            trainingMonotony?: number;
            /** Format: double */
            tsb?: number;
            /** Format: double */
            vo2maxEstimate?: number;
            weatherDescription?: string;
            /** Format: int32 */
            weatherScore?: number;
            /** Format: double */
            weightKg?: number;
        };
        AdaptiveCoachResponse: {
            accountability?: components["schemas"]["AccountabilityDto"];
            aiInterpretation?: string;
            algorithmVersion?: string;
            allScoredSessions?: components["schemas"]["SessionOptionDto"][];
            alternatives?: components["schemas"]["SessionOptionDto"][];
            bestSession?: components["schemas"]["SessionOptionDto"];
            confidence?: string;
            consistency?: components["schemas"]["ConsistencyDto"];
            decision?: string;
            efficiency?: components["schemas"]["EfficiencyDto"];
            fatigue?: components["schemas"]["FatigueDto"];
            fatigueDebt?: components["schemas"]["FatigueDebtDto"];
            goalProgress?: components["schemas"]["GoalProgressDto"];
            insight?: string;
            reasoning?: string[];
            risk?: components["schemas"]["RiskDto"];
        };
        AdaptiveTrainingRequest: {
            fatigueSignals?: components["schemas"]["FatigueSignalsDto"];
            plannedWorkouts?: components["schemas"]["PlannedWorkoutDto"][];
            progressionState?: components["schemas"]["ProgressionStateDto"];
            recentWorkouts?: components["schemas"]["RecentWorkoutDto"][];
            trainingLoad?: components["schemas"]["TrainingLoadStateDto"];
        };
        AdaptiveTrainingResponse: {
            adjustments?: components["schemas"]["WorkoutAdjustmentDto"][];
            insight?: string;
            strategy?: components["schemas"]["StrategyDto"];
            warnings?: string[];
        };
        AddWeightRequest: {
            notes?: string;
            /** Format: date */
            recordedDate: string;
            weightKg: number;
        };
        AiActivityNoteDto: {
            /** Format: uuid */
            activityId?: string;
            detail?: string;
            /** Format: date-time */
            generatedAt?: string;
            /** Format: uuid */
            id?: string;
            modelId?: string;
            providerName?: string;
            queueStatus?: string;
            summary?: string;
        };
        AiModuleStatusDto: {
            activeModel?: string;
            activeProvider?: string;
            availablePredictionTypes?: string[];
            availableProviders?: string[];
            batchCron?: string;
            batchEnabled?: boolean;
            enabled?: boolean;
            modelAvailable?: boolean;
            todayTipsReady?: boolean;
        };
        AiNoteAskRequest: {
            question?: string;
        };
        AiNoteAskResponse: {
            answer?: string;
            modelId?: string;
            providerName?: string;
        };
        AlternativeOptionDto: {
            label?: string;
            rationale?: string;
            type?: string;
            workout?: components["schemas"]["WorkoutSuggestionDto"];
        };
        AnalyticsOverviewDto: {
            availability?: string;
            /** Format: date */
            from?: string;
            ftp?: components["schemas"]["FtpProgressDto"];
            /** Format: date */
            to?: string;
            weeks?: components["schemas"]["WeeklySummaryDto"][];
        };
        ApplyOptimizedPlanRequest: {
            goalPriority?: string;
            name?: string;
            sessions?: components["schemas"]["SessionInputDto"][];
            /** Format: double */
            targetWeeklyTss?: number;
        };
        AthleteProfileDto: {
            /** Format: date-time */
            createdAt?: string;
            currentZones?: components["schemas"]["TrainingZoneDto"][];
            /** Format: date */
            dateOfBirth?: string;
            email?: string;
            /** Format: int32 */
            ftpWatts?: number;
            /** Format: uuid */
            id?: string;
            /** Format: int32 */
            lthrBpm?: number;
            /** Format: int32 */
            maxHrBpm?: number;
            name?: string;
            /** Format: int32 */
            restingHrBpm?: number;
            /** Format: int64 */
            stravaAthleteId?: number;
            stravaConnected?: boolean;
            /** Format: date-time */
            updatedAt?: string;
            weightKg?: number;
        };
        AutoSyncConfig: {
            /** Format: int32 */
            intervalMinutes?: number;
        };
        BackfillStatusDto: {
            capability?: string;
            errorMessage?: string;
            jobType?: string;
            /** Format: int32 */
            processed?: number;
            /** Format: date-time */
            rateLimitResetsAt?: string;
            status?: string;
            /** Format: int32 */
            total?: number;
            /** Format: date-time */
            updatedAt?: string;
        };
        BatchRunResultDto: {
            /** Format: int32 */
            failed?: number;
            message?: string;
            /** Format: int32 */
            skipped?: number;
            /** Format: int32 */
            success?: number;
        };
        BlockHealthDto: {
            /** Format: int32 */
            adjustmentDays?: number;
            description?: string;
            /** Format: int32 */
            goalExecutionScore?: number;
            goalExecutionStatus?: string;
            keySignals?: string[];
            label?: string;
            /** Format: int32 */
            missedStimulusDays?: number;
            nextFocus?: string;
            objectiveLabel?: string;
            /** Format: int32 */
            overloadDays?: number;
            programGoal?: string;
            status?: string;
        };
        CalendarActivitySummaryDto: {
            distanceKm?: number;
            /** Format: int32 */
            durationMin?: number;
            /** Format: uuid */
            id?: string;
            name?: string;
            sportType?: string;
            tss?: number;
        };
        CalendarDayDto: {
            activities?: components["schemas"]["CalendarActivitySummaryDto"][];
            actual?: components["schemas"]["CalendarActivitySummaryDto"];
            adjustment?: components["schemas"]["TrainingAdjustmentSuggestionDto"];
            /** Format: double */
            compliance?: number;
            /** Format: date */
            date?: string;
            execution?: components["schemas"]["TrainingExecutionAssessmentDto"];
            planned?: components["schemas"]["TrainingPlanDto"];
            projection?: components["schemas"]["TrainingDayProjectionDto"];
            sessions?: components["schemas"]["CalendarSessionDto"][];
        };
        CalendarSessionDto: {
            actual?: components["schemas"]["CalendarActivitySummaryDto"];
            /** Format: double */
            compliance?: number;
            execution?: components["schemas"]["TrainingExecutionAssessmentDto"];
            planned?: components["schemas"]["TrainingPlanDto"];
        };
        ChallengeDto: {
            /** Format: date-time */
            completedAt?: string;
            /** Format: date-time */
            createdAt?: string;
            /** Format: double */
            currentValue?: number;
            /** Format: int64 */
            daysLeft?: number;
            description?: string;
            /** Format: date */
            endDate?: string;
            /** Format: uuid */
            id?: string;
            name?: string;
            /** Format: double */
            progressPercent?: number;
            /** Format: date */
            startDate?: string;
            status?: string;
            targetUnit?: string;
            /** Format: double */
            targetValue?: number;
            type?: string;
        };
        ConfidenceDto: {
            level?: string;
            reasons?: string[];
        };
        ConfidenceScoreDto: {
            description?: string;
            label?: string;
            /** Format: double */
            score?: number;
        };
        ConsistencyDto: {
            /** Format: int32 */
            completedSessions?: number;
            /** Format: double */
            completionRatio?: number;
            /** Format: int32 */
            expectedSessions?: number;
            /** Format: double */
            gainMultiplier?: number;
            recommendation?: string;
            status?: string;
        };
        ContextualFactors: {
            fatigueState?: string;
            recentFailures?: boolean;
            trainingLoadTrend?: string;
        };
        CpModelDto: {
            /** Format: double */
            cp?: number;
            /** Format: int32 */
            cpConfidence?: number;
            /** Format: double */
            cpPerKg?: number;
            /** Format: double */
            currentFtp?: number;
            /** Format: int32 */
            dataPoints?: number;
            /** Format: double */
            ftpVsCpPct?: number;
            /** Format: double */
            rsquared?: number;
            /** Format: double */
            wprime?: number;
        };
        CreateEventRequest: {
            eventDate?: string;
            name?: string;
            priority?: string;
            type?: string;
        };
        CreateRouteRequest: {
            description?: string;
            elevations?: number[];
            name?: string;
            polyline?: number[][];
            waypoints?: components["schemas"]["RouteWaypoint"][];
        };
        CreateTrainingPlanRequest: {
            /** Format: date */
            date?: string;
            notes?: string;
            plannedDescription?: string;
            /** Format: int32 */
            plannedDurationMin?: number;
            plannedTss?: number;
            plannedType?: string;
            /** Format: uuid */
            programId?: string;
            scaledSteps?: components["schemas"]["WorkoutStepInputDto"][];
            /** Format: uuid */
            workoutTemplateId?: string;
        };
        CurrentPerformanceStateDto: {
            atl?: number;
            ctl?: number;
            ctlTrend?: string;
            fatigueTrend?: string;
            ftp?: number;
            ftpTrend?: string;
            hrvTrend?: string;
            /** Format: int32 */
            recentSuccessCount?: number;
            /** Format: int32 */
            recentTotalCount?: number;
            restingHrTrend?: string;
            sleepQuality?: string;
            tsb?: number;
        };
        CustomPromptDto: {
            active?: boolean;
            /** Format: date-time */
            createdAt?: string;
            /** Format: uuid */
            id?: string;
            name?: string;
            predictionType?: string;
            responseFormat?: string;
            systemPrompt?: string;
            /** Format: date-time */
            updatedAt?: string;
            userPromptTemplate?: string;
        };
        DailyDecisionDto: {
            alternatives?: components["schemas"]["AlternativeOptionDto"][];
            confidence?: components["schemas"]["ConfidenceScoreDto"];
            decision?: string;
            reasons?: components["schemas"]["DecisionReasonDto"][];
            risk?: string;
            workout?: components["schemas"]["WorkoutSuggestionDto"];
        };
        DailyOptimalLoadDto: {
            actualTss?: number;
            atl?: number;
            ctl?: number;
            dangerThreshold?: number;
            /** Format: date */
            date?: string;
            future?: boolean;
            optimalMax?: number;
            optimalMin?: number;
            optimalTarget?: number;
            projectedTss?: number;
            status?: string;
            tsb?: number;
        };
        DailySlot: {
            date?: string;
            /** Format: double */
            precipitationSum?: number;
            /** Format: double */
            tempMax?: number;
            /** Format: double */
            tempMin?: number;
            /** Format: int32 */
            weatherCode?: number;
            weatherDescription?: string;
            /** Format: double */
            windSpeedMax?: number;
        };
        DailySummary: {
            /** Format: int32 */
            activeCalories?: number;
            /** Format: int32 */
            activitiesCount?: number;
            /** Format: int32 */
            awakeSleepSeconds?: number;
            /** Format: int32 */
            bodyBattery?: number;
            /** Format: int32 */
            checkInLegFreshness?: number;
            /** Format: int32 */
            checkInMotivation?: number;
            /** Format: int32 */
            checkInSleepQuality?: number;
            /** Format: int32 */
            checkInSoreness?: number;
            /** Format: date-time */
            checkInUpdatedAt?: string;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date */
            date?: string;
            /** Format: int32 */
            deepSleepSeconds?: number;
            /** Format: date-time */
            healthMetricsUpdatedAt?: string;
            hrvRmssd?: number;
            /** Format: uuid */
            id?: string;
            /** Format: int32 */
            lightSleepSeconds?: number;
            /** Format: int32 */
            remSleepSeconds?: number;
            /** Format: int32 */
            restingHrBpm?: number;
            /** Format: int32 */
            sleepDurationSeconds?: number;
            /** Format: int32 */
            sleepScore?: number;
            /** Format: int32 */
            steps?: number;
            /** Format: int32 */
            stressAvg?: number;
            totalDistanceM?: number;
            totalElevationM?: number;
            /** Format: int32 */
            totalTimeSec?: number;
            /** Format: date-time */
            updatedAt?: string;
        };
        DashboardLayoutDto: {
            widgets?: components["schemas"]["DashboardWidgetDto"][];
        };
        DashboardWidgetDto: {
            id?: string;
            /** Format: int32 */
            order?: number;
            settings?: {
                [key: string]: Record<string, never>;
            };
            /** Format: int32 */
            span?: number;
            type?: string;
        };
        DataQualitySummaryDto: {
            /** Format: int64 */
            assessedActivities?: number;
            /** Format: int64 */
            available?: number;
            /** Format: int64 */
            partial?: number;
            /** Format: int64 */
            totalActivities?: number;
            /** Format: int64 */
            unassessed?: number;
            /** Format: int64 */
            unknown?: number;
        };
        DecisionReasonDto: {
            evidence?: string;
            message?: string;
            priority?: string;
            signal?: string;
        };
        DerivedMetrics: {
            /** Format: double */
            decouplingPwHr?: number;
            /** Format: double */
            intensityFactor?: number;
            intervalHeartRateValues?: number[];
            intervalPowerValues?: number[];
            /** Format: double */
            tss?: number;
            /** Format: double */
            variabilityIndex?: number;
        };
        DurabilityInsightDto: {
            avgAerobicDecoupling?: number;
            /** Format: int32 */
            avgDurabilityScore?: number;
            avgPowerFade?: number;
            description?: string;
            label?: string;
            trend?: string;
            workouts?: components["schemas"]["DurabilityWorkoutDto"][];
        };
        DurabilityProfileDto: {
            /** Format: double */
            avgAerobicDecoupling?: number;
            /** Format: double */
            avgPowerFade?: number;
            description?: string;
            /** Format: double */
            fatigueResistanceIndex?: number;
            label?: string;
            /** Format: int32 */
            longDurationResistance?: number;
            /** Format: int32 */
            mediumDurationResistance?: number;
            /** Format: int32 */
            overallScore?: number;
            /** Format: int32 */
            recentWorkoutsCount?: number;
            recommendation?: string;
            /** Format: int32 */
            shortDurationResistance?: number;
            trend?: string;
        };
        DurabilityWorkoutDto: {
            /** Format: uuid */
            activityId?: string;
            aerobicDecoupling?: number;
            /** Format: date */
            date?: string;
            /** Format: int32 */
            durabilityScore?: number;
            /** Format: int32 */
            durationMin?: number;
            name?: string;
            powerFade?: number;
            tss?: number;
        };
        EfficiencyDto: {
            /** Format: double */
            completionRatio?: number;
            rating?: string;
        };
        EquipmentDto: {
            brand?: string;
            /** Format: date-time */
            createdAt?: string;
            /** Format: uuid */
            id?: string;
            model?: string;
            name?: string;
            notes?: string;
            /** Format: date */
            purchaseDate?: string;
            purchasePrice?: number;
            /** Format: int32 */
            replacementIntervalKm?: number;
            status?: string;
            /** Format: double */
            totalKm?: number;
            type?: string;
            /** Format: date-time */
            updatedAt?: string;
            /** Format: double */
            usagePercent?: number;
        };
        EventDto: {
            active?: boolean;
            /** Format: date */
            createdAt?: string;
            /** Format: date */
            eventDate?: string;
            /** Format: uuid */
            id?: string;
            name?: string;
            priority?: string;
            type?: string;
        };
        EventProjectionDto: {
            /** Format: double */
            currentCtl?: number;
            /** Format: double */
            currentTsb?: number;
            /** Format: int32 */
            daysToEvent?: number;
            eventName?: string;
            /** Format: int32 */
            fatigueScore?: number;
            /** Format: double */
            projectedCtl?: number;
            suggestedTaper?: string;
            /** Format: int32 */
            taperStartDays?: number;
        };
        EvidenceDto: {
            /** Format: date */
            asOf?: string;
            code?: string;
            message?: string;
            source?: string;
        };
        ExecutedWorkout: {
            /** Format: int32 */
            actualDurationSec?: number;
            /** Format: int32 */
            avgCadence?: number;
            /** Format: int32 */
            avgHeartRateBpm?: number;
            /** Format: double */
            avgPowerW?: number;
            /** Format: int32 */
            completedIntervals?: number;
            /** Format: int32 */
            maxHeartRateBpm?: number;
            /** Format: double */
            normalizedPowerW?: number;
            timeInZones?: {
                [key: string]: number;
            };
        };
        FatigueDebtDto: {
            /** Format: double */
            debt?: number;
            /** Format: int32 */
            recoveryDaysNeeded?: number;
            requiresRecovery?: boolean;
            severity?: string;
        };
        FatigueDto: {
            /** Format: double */
            currentAtl?: number;
            /** Format: double */
            currentTsb?: number;
            /** Format: double */
            projectedAtl?: number;
            /** Format: double */
            projectedTsb?: number;
        };
        FatigueFactorsDto: {
            /** Format: double */
            ansFatigue?: number;
            /** Format: double */
            atlFatigue?: number;
            /** Format: int32 */
            compositeScore?: number;
            description?: string;
            /** Format: double */
            metabolicFatigue?: number;
            /** Format: double */
            muscularFatigue?: number;
            statusLabel?: string;
        };
        FatigueSignalsDto: {
            hrvTrend?: string;
            restingHrTrend?: string;
            sleepQuality?: string;
            /** Format: int32 */
            subjectiveReadiness?: number;
        };
        FatigueStateDto: {
            /** Format: int32 */
            atlFatigue?: number;
            /** Format: date-time */
            calculatedAt?: string;
            /** Format: int32 */
            energyBudget?: number;
            level?: string;
            /** Format: int32 */
            loadFatigue?: number;
            /** Format: int32 */
            maxTssToday?: number;
            /** Format: int32 */
            metabolicFatigue?: number;
            /** Format: double */
            monotony?: number;
            /** Format: int32 */
            recoveryDebt?: number;
            /** Format: double */
            recoveryEfficiency?: number;
            /** Format: int32 */
            score?: number;
            /** Format: double */
            strain?: number;
            trend?: string;
            /** Format: double */
            weeklyRampRate?: number;
        };
        FinishWorkoutExecutionRequest: {
            idempotencyKey?: string;
            /** Format: date-time */
            occurredAt?: string;
        };
        FtpPoint: {
            date?: string;
            value?: number;
        };
        FtpProgressDto: {
            /** Format: double */
            changePercent?: number;
            /** Format: int32 */
            currentFtp?: number;
            history?: components["schemas"]["FtpPoint"][];
            trend?: string;
        };
        GeneratedRouteSuggestionDto: {
            preview?: components["schemas"]["RoutePreviewDto"];
            /** Format: int64 */
            seed?: number;
            sourceName?: string;
            sourceType?: string;
            strategy?: string;
            style?: string;
            waypoints?: number[][];
        };
        GeneratePlanRequest: {
            environmentPreference?: string;
            /** Format: date */
            eventDate?: string;
            goal?: string;
            goalPriority?: string;
            preferredLongRideDay?: string;
            /** Format: date */
            startDate?: string;
            targetWeeklyTss?: number;
            /** Format: int32 */
            trainingDaysPerWeek?: number;
            /** Format: int32 */
            weekdayAvailabilityMinutes?: number;
            /** Format: int32 */
            weekendAvailabilityMinutes?: number;
            /** Format: int32 */
            weeks?: number;
        };
        GoalProgressDto: {
            /** Format: double */
            currentValue?: number;
            /** Format: double */
            gap?: number;
            /** Format: double */
            gapPercent?: number;
            phase?: string;
            /** Format: double */
            projectedDaysToTarget?: number;
            status?: string;
            /** Format: double */
            targetValue?: number;
            /** Format: double */
            weeklyProgressRate?: number;
        };
        GradientDay: {
            bestWindowEnd?: string;
            /** Format: int32 */
            bestWindowScore?: number;
            bestWindowStart?: string;
            /** Format: int32 */
            dailyScore?: number;
            date?: string;
            hourlyScores?: components["schemas"]["HourScore"][];
            /** Format: double */
            precipitationSum?: number;
            /** Format: double */
            tempMax?: number;
            /** Format: double */
            tempMin?: number;
            /** Format: int32 */
            weatherCode?: number;
            weatherDescription?: string;
            /** Format: double */
            windSpeedMax?: number;
        };
        HealthDay: {
            /** Format: int32 */
            activeCalories?: number;
            /** Format: int32 */
            awakeSleepSeconds?: number;
            /** Format: int32 */
            bodyBattery?: number;
            /** Format: date */
            date?: string;
            /** Format: int32 */
            deepSleepSeconds?: number;
            hrvRmssd?: number;
            /** Format: int32 */
            lightSleepSeconds?: number;
            /** Format: int32 */
            remSleepSeconds?: number;
            /** Format: int32 */
            restingHrBpm?: number;
            /** Format: int32 */
            sleepDurationSeconds?: number;
            /** Format: int32 */
            sleepScore?: number;
            /** Format: int32 */
            steps?: number;
            /** Format: int32 */
            stressAvg?: number;
        };
        HealthOverview: {
            hrvTrend?: components["schemas"]["HrvTrend"];
            latest?: components["schemas"]["DailySummary"];
            restingHrTrend?: components["schemas"]["RestingHrTrend"];
            sleepTrend?: components["schemas"]["SleepTrend"];
            stressTrend?: components["schemas"]["StressTrend"];
        };
        HeatmapSegmentDto: {
            /** Format: int32 */
            count?: number;
            /** Format: double */
            lat1?: number;
            /** Format: double */
            lat2?: number;
            /** Format: double */
            lon1?: number;
            /** Format: double */
            lon2?: number;
        };
        HistoricalContext: {
            /** Format: double */
            atl?: number;
            /** Format: double */
            ctl?: number;
            last7DaysTss?: number;
            last28DaysTss?: number;
            /** Format: double */
            recentIntensityFactor?: number;
            recentWorkoutOutcomes?: string[];
            /** Format: double */
            tsb?: number;
        };
        HourlySlot: {
            /** Format: double */
            precipitation?: number;
            /** Format: double */
            temperature?: number;
            time?: string;
            /** Format: int32 */
            weatherCode?: number;
            weatherDescription?: string;
            /** Format: double */
            windSpeed?: number;
        };
        HourScore: {
            hour?: string;
            /** Format: double */
            precipitation?: number;
            /** Format: int32 */
            score?: number;
            sunrise?: string;
            sunset?: string;
            /** Format: double */
            temperature?: number;
            /** Format: int32 */
            weatherCode?: number;
            /** Format: double */
            windSpeed?: number;
        };
        HrvTrend: {
            current?: number;
            direction?: string;
            periodAvg?: number;
            sevenDayAvg?: number;
        };
        ImportJobRequest: {
            mode?: string;
        };
        IntensityDistributionDto: {
            /** Format: double */
            high?: number;
            /** Format: double */
            low?: number;
            /** Format: double */
            moderate?: number;
        };
        IntervalDetectionDto: {
            /** Format: double */
            avgQualityScore?: number;
            recentSessions?: components["schemas"]["IntervalSessionDto"][];
            recommendation?: string;
            sessionsByType?: {
                [key: string]: number;
            };
            /** Format: int32 */
            totalIntervalSessions?: number;
            trend?: string;
        };
        IntervalSessionDto: {
            activityId?: string;
            /** Format: int32 */
            avgDurationSec?: number;
            /** Format: double */
            avgPowerPct?: number;
            date?: string;
            /** Format: int32 */
            intervalCount?: number;
            intervalType?: string;
            /** Format: int32 */
            qualityScore?: number;
            /** Format: double */
            restRatio?: number;
            /** Format: int32 */
            totalWorkSec?: number;
        };
        JobStatus: {
            errorMessage?: string;
            /** Format: date-time */
            lastRunAt?: string;
            /** Format: int32 */
            locationsFailed?: number;
            /** Format: int32 */
            locationsProcessed?: number;
            status?: string;
        };
        JournalEntryDto: {
            /** Format: uuid */
            activityId?: string;
            /** Format: date-time */
            createdAt?: string;
            /** Format: uuid */
            id?: string;
            mood?: string;
            note?: string;
            tags?: string[];
            /** Format: date-time */
            updatedAt?: string;
        };
        LapDto: {
            /** Format: int32 */
            avgCadence?: number;
            /** Format: int32 */
            avgHeartrate?: number;
            /** Format: int32 */
            avgPowerW?: number;
            avgSpeedMs?: number;
            distanceM?: number;
            /** Format: int32 */
            elapsedTimeSec?: number;
            /** Format: int32 */
            endIndex?: number;
            intensityClass?: string;
            /** Format: int32 */
            lapIndex?: number;
            /** Format: int32 */
            maxHeartrate?: number;
            /** Format: int32 */
            maxPowerW?: number;
            maxSpeedMs?: number;
            /** Format: int32 */
            movingTimeSec?: number;
            name?: string;
            /** Format: int32 */
            normalizedPowerW?: number;
            powerDropPct?: number;
            /** Format: int32 */
            startIndex?: number;
            totalElevationGain?: number;
            variabilityIndex?: number;
        };
        LoadAnalyticsDto: {
            /** Format: date */
            asOf?: string;
            availability?: string;
            coverage?: number;
            /** Format: date */
            from?: string;
            points?: components["schemas"]["PmcDataDto"][];
            temporalCoverage?: number;
            /** Format: date */
            to?: string;
        };
        LoadFocusDto: {
            /** Format: double */
            anaerobicPct?: number;
            /** Format: double */
            anaerobicTarget?: number;
            /** Format: double */
            highAerobicPct?: number;
            /** Format: double */
            highAerobicTarget?: number;
            /** Format: double */
            lowAerobicPct?: number;
            /** Format: double */
            lowAerobicTarget?: number;
            /** Format: int32 */
            totalSeconds?: number;
            zoneSeconds?: {
                [key: string]: number;
            };
        };
        LoadScenarioDto: {
            assumptions?: string[];
            availability?: string;
            /** Format: date */
            from?: string;
            points?: components["schemas"]["LoadScenarioPointDto"][];
            /** Format: date */
            to?: string;
        };
        LoadScenarioPointDto: {
            atl?: number;
            ctl?: number;
            /** Format: date */
            date?: string;
            form?: number;
            plannedTss?: number;
        };
        LoadSnapshotDto: {
            /** Format: date */
            asOf?: string;
            atl7?: number;
            availability?: string;
            coverage?: number;
            ctl42?: number;
            form?: number;
            temporalCoverage?: number;
        };
        MatchedRidePointDto: {
            /** Format: uuid */
            activityId?: string;
            activityName?: string;
            /** Format: int32 */
            averageHeartrate?: number;
            /** Format: int32 */
            averagePowerW?: number;
            /** Format: double */
            averageSpeedKmh?: number;
            /** Format: int32 */
            movingTimeSec?: number;
            /** Format: int32 */
            relativeEffort?: number;
            /** Format: double */
            similarityPercent?: number;
            /** Format: double */
            smoothedSpeedKmh?: number;
            /** Format: date-time */
            startedAt?: string;
        };
        MatchedRideSummaryDto: {
            /** Format: double */
            changeFromAverageKmh?: number;
            /** Format: double */
            changeFromPreviousBestKmh?: number;
            /** Format: double */
            changeFromPreviousKmh?: number;
            /** Format: double */
            changeFromRecordKmh?: number;
            /** Format: int32 */
            currentRank?: number;
            /** Format: double */
            currentSpeedKmh?: number;
            directionVariant?: string;
            newRecord?: boolean;
            /** Format: int32 */
            rideCount?: number;
            /** Format: uuid */
            routeFamilyId?: string;
            /** Format: uuid */
            routeGroupId?: string;
            /** Format: double */
            similarityPercent?: number;
            trend?: components["schemas"]["MatchedRidePointDto"][];
        };
        MetricValueDto: {
            /** Format: date */
            asOf?: string;
            calculatorVersion?: string;
            /** Format: date-time */
            computedAt?: string;
            inputFingerprint?: string;
            name?: string;
            numericValue?: number;
            structuredValue?: {
                [key: string]: Record<string, never>;
            };
        };
        MoodCorrelationDto: {
            byMood?: {
                [key: string]: components["schemas"]["MoodMetric"];
            };
            /** Format: int32 */
            totalEntries?: number;
        };
        MoodMetric: {
            /** Format: double */
            avgDistanceKm?: number;
            /** Format: double */
            avgDurationMinutes?: number;
            /** Format: double */
            avgHeartRate?: number;
            /** Format: double */
            avgPower?: number;
            /** Format: double */
            avgTss?: number;
            /** Format: int32 */
            count?: number;
        };
        NewActivitiesCheck: {
            /** Format: int32 */
            count?: number;
            hasNew?: boolean;
            /** Format: date-time */
            lastSyncedAt?: string;
        };
        NewWorkoutDto: {
            intensityAdjustment?: string;
            type?: string;
            volumeAdjustment?: string;
        };
        NudgeDto: {
            actionUrl?: string;
            data?: {
                [key: string]: Record<string, never>;
            };
            id?: string;
            message?: string;
            severity?: string;
            title?: string;
            type?: string;
        };
        OptimizedSessionDto: {
            /** Format: date */
            day?: string;
            /** Format: int32 */
            durationMinutes?: number;
            goal?: string;
            intensity?: string;
            tss?: number;
            type?: string;
        };
        OptimizePlanRequest: {
            currentAtl?: number;
            currentCtl?: number;
            /** Format: date */
            eventDate?: string;
            /** Format: int32 */
            ftp?: number;
            goalPriority?: string;
            targetWeeklyTss?: number;
            /** Format: int32 */
            trainingDaysPerWeek?: number;
            /** Format: int32 */
            weeks?: number;
        };
        OptimizePlanResponse: {
            /** Format: int32 */
            confidence?: number;
            constraintViolations?: string[];
            loadSummary?: string[];
            plans?: components["schemas"]["PlanResultDto"][];
            strategy?: components["schemas"]["PlanStrategyDto"];
        };
        PeakWindowDto: {
            /** Format: int32 */
            durationDays?: number;
            /** Format: int32 */
            startInDays?: number;
        };
        PerformanceDto: {
            /** Format: int32 */
            ftp?: number;
            /** Format: int32 */
            power20min?: number;
        };
        PerformanceIndicatorsDto: {
            durability?: string;
            ftp?: number;
            ftpTrend?: string;
            /** Format: int32 */
            tte?: number;
        };
        PerformancePredictionRequest: {
            performanceIndicators?: components["schemas"]["PerformanceIndicatorsDto"];
            recentTrends?: components["schemas"]["RecentTrendsDto"];
            recentWorkouts?: components["schemas"]["RecentWorkoutDto"][];
            recoverySignals?: components["schemas"]["RecoverySignalsDto"];
            trainingLoad?: components["schemas"]["TrainingLoadStateDto"];
        };
        PerformancePredictionResponse: {
            /** Format: int32 */
            confidence?: number;
            formState?: string;
            peakWindow?: components["schemas"]["PeakWindowDto"];
            performancePrediction?: components["schemas"]["PerformanceDto"];
            /** Format: int32 */
            readinessScore?: number;
            recommendations?: string[];
        };
        PeriodComparisonDto: {
            availability?: string;
            period1?: components["schemas"]["PeriodSummaryDto"];
            period2?: components["schemas"]["PeriodSummaryDto"];
        };
        PeriodSummaryDto: {
            /** Format: int32 */
            activityCount?: number;
            /** Format: date */
            from?: string;
            /** Format: date */
            to?: string;
            totalDistanceM?: number;
            totalElevationM?: number;
            /** Format: int32 */
            totalTimeSec?: number;
        };
        PersonalRecordDto: {
            /** Format: date */
            achievedAt?: string;
            /** Format: uuid */
            activityId?: string;
            /** Format: uuid */
            id?: string;
            /** Format: double */
            improvementPercent?: number;
            label?: string;
            /** Format: double */
            previousValue?: number;
            recordType?: string;
            /** Format: double */
            recordValue?: number;
            unit?: string;
        };
        PlannedRoute: {
            /** Format: date-time */
            createdAt?: string;
            description?: string;
            /** Format: int32 */
            estimatedTimeSec?: number;
            /** Format: int32 */
            estimatedTss?: number;
            /** Format: uuid */
            id?: string;
            name?: string;
            polyline?: number[][];
            totalDistanceM?: number;
            totalElevationGainM?: number;
            totalElevationLossM?: number;
            /** Format: date-time */
            updatedAt?: string;
            waypoints?: components["schemas"]["RouteWaypoint"][];
        };
        PlannedWorkout: {
            /** Format: int32 */
            intervalDurationSec?: number;
            /** Format: double */
            intervalPowerPctFtp?: number;
            /** Format: int32 */
            intervalPowerW?: number;
            /** Format: int32 */
            plannedIntervals?: number;
            /** Format: int32 */
            targetDurationSec?: number;
            /** Format: double */
            targetPowerPctFtp?: number;
            /** Format: double */
            targetPowerW?: number;
            targetZoneDistribution?: {
                [key: string]: number;
            };
        };
        PlannedWorkoutDto: {
            /** Format: int32 */
            duration?: number;
            /** Format: int32 */
            intervals?: number;
            /** Format: int32 */
            targetPower?: number;
            type?: string;
        };
        PlanResultDto: {
            /** Format: double */
            adaptationGain?: number;
            estimatedTss?: number;
            /** Format: double */
            fatigueCost?: number;
            intensityDistribution?: components["schemas"]["IntensityDistributionDto"];
            /** Format: double */
            score?: number;
            sessions?: components["schemas"]["OptimizedSessionDto"][];
            type?: string;
        };
        PlanStrategyDto: {
            focus?: string;
            reasoning?: string;
        };
        PmcDataDto: {
            atl?: number;
            atlDelta?: number;
            ctl?: number;
            ctlDelta?: number;
            /** Format: date */
            date?: string;
            tsb?: number;
            tsbDelta?: number;
        };
        PostSessionFeedbackRequest: {
            /** Format: double */
            actualDurationMinutes?: number;
            /** Format: double */
            actualTss?: number;
            completed?: boolean;
            /** Format: double */
            executionQuality?: number;
            plannedType?: string;
            /** Format: int32 */
            rpe?: number;
            subjectiveFeedback?: string;
        };
        PowerAnalyticsDto: {
            availability?: string;
            curve?: components["schemas"]["PowerCurveDto"];
            durability?: components["schemas"]["DurabilityInsightDto"];
            /** Format: date */
            from?: string;
            ftp?: components["schemas"]["FtpProgressDto"];
            /** Format: date */
            to?: string;
        };
        PowerCurveDto: {
            efforts?: {
                [key: string]: number;
            };
            /** Format: int32 */
            estimatedActivities?: number;
            /** Format: int32 */
            measuredActivities?: number;
            source?: string;
            /** Format: int32 */
            unknownSourceActivities?: number;
        };
        PowerPhenotypeDto: {
            bestDuration?: string;
            description?: string;
            powerProfileWkg?: {
                [key: string]: number;
            };
            primaryType?: string;
            recommendation?: string;
            referenceScores?: {
                [key: string]: number;
            };
            secondaryType?: string;
            /** Format: double */
            weaknessGapWkg?: number;
            worstDuration?: string;
        };
        PredictionRequestDto: {
            extraParameters?: {
                [key: string]: string;
            };
            modelId?: string;
            predictionType?: string;
        };
        PredictionResponseDto: {
            /** Format: double */
            accuracyScore?: number;
            actualData?: {
                [key: string]: Record<string, never>;
            };
            /** Format: double */
            confidence?: number;
            /** Format: date-time */
            createdAt?: string;
            detail?: string;
            /** Format: uuid */
            id?: string;
            modelId?: string;
            predictionType?: string;
            providerName?: string;
            structuredData?: {
                [key: string]: Record<string, never>;
            };
            summary?: string;
            /** Format: date-time */
            verifiedAt?: string;
        };
        ProcessingJobDto: {
            /** Format: int32 */
            attempt?: number;
            /** Format: date-time */
            completedAt?: string;
            /** Format: date-time */
            createdAt?: string;
            errorMessage?: string;
            /** Format: uuid */
            id?: string;
            jobType?: string;
            mode?: string;
            stage?: string;
            /** Format: date-time */
            startedAt?: string;
            status?: string;
            /** Format: date-time */
            updatedAt?: string;
        };
        ProgressionLevelDto: {
            currentLoad?: number;
            description?: string;
            label?: string;
            /** Format: int32 */
            level?: number;
            nextRecommendation?: string;
            previousLoad?: number;
            system?: string;
            targetLoad?: number;
            trend?: string;
        };
        ProgressionStateDto: {
            /** Format: int32 */
            enduranceLevel?: number;
            recentIntensityDistribution?: string;
            /** Format: int32 */
            thresholdLevel?: number;
            /** Format: int32 */
            vo2Level?: number;
        };
        ReadinessCheckInDto: {
            /** Format: date */
            date?: string;
            /** Format: int32 */
            legFreshness?: number;
            /** Format: int32 */
            motivation?: number;
            /** Format: int32 */
            scoreAdjustment?: number;
            /** Format: int32 */
            sleepQuality?: number;
            /** Format: int32 */
            soreness?: number;
            /** Format: date-time */
            updatedAt?: string;
        };
        ReadinessDto: {
            /** Format: double */
            atl?: number;
            availability?: string;
            bestQualityWindowLabel?: string;
            checkIn?: components["schemas"]["ReadinessCheckInDto"];
            /** Format: double */
            ctl?: number;
            dayFocus?: string;
            dayLabel?: string;
            dayType?: string;
            description?: string;
            healthSignals?: components["schemas"]["ReadinessHealthSignalsDto"];
            level?: string;
            qualityWindows?: components["schemas"]["ReadinessWindowDto"][];
            qualityWindowSummary?: string;
            /** Format: int32 */
            score?: number;
            sessionVariants?: components["schemas"]["ReadinessSessionVariantDto"][];
            tomorrowHint?: string;
            /** Format: double */
            tsb?: number;
        };
        ReadinessHealthSignalsDto: {
            /** Format: int32 */
            bodyBattery?: number;
            /** Format: int32 */
            restingHrBpm?: number;
            restingHrDelta?: number;
            /** Format: int32 */
            scoreAdjustment?: number;
            /** Format: int32 */
            sleepScore?: number;
            /** Format: date */
            sourceDate?: string;
        };
        ReadinessSessionVariantDto: {
            /** Format: int32 */
            durationMinutes?: number;
            fuelingHint?: string;
            recoveryHint?: string;
            targetPower?: string;
            /** Format: int32 */
            targetTss?: number;
            title?: string;
        };
        ReadinessWindowDto: {
            /** Format: date */
            date?: string;
            focus?: string;
            label?: string;
            recommendation?: string;
            /** Format: int32 */
            score?: number;
        };
        RecentTrendsDto: {
            ctlTrend?: string;
            fatigueTrend?: string;
        };
        RecentWorkoutDto: {
            fatigueDrift?: string;
            hrResponse?: string;
            outcome?: string;
            /** Format: int32 */
            score?: number;
            workoutType?: string;
        };
        RecommendationDto: {
            algorithmVersion?: string;
            confidence?: string;
            decision?: string;
            description?: string;
            /** Format: int32 */
            durationMinutes?: number;
            sessionType?: string;
            targetTss?: number;
        };
        RecordAdjustmentFeedbackRequest: {
            /** Format: date */
            date?: string;
            feedback?: string;
            /** Format: uuid */
            planId?: string;
            suggestionTitle?: string;
            suggestionType?: string;
        };
        RecoveryContext: {
            /** Format: double */
            hrvTrend?: number;
            /** Format: int32 */
            restingHrBpm?: number;
            /** Format: double */
            sleepQuality?: number;
            /** Format: double */
            subjectiveReadinessScore?: number;
        };
        RecoverySignalsDto: {
            hrvTrend?: string;
            restingHrTrend?: string;
            sleepQuality?: string;
        };
        RecoveryStatus: {
            alerts?: string[];
            availability?: string;
            description?: string;
            level?: string;
            /** Format: int32 */
            score?: number;
        };
        RestingHrTrend: {
            avg?: number;
            /** Format: int32 */
            current?: number;
            direction?: string;
        };
        RiskDto: {
            level?: string;
            primaryRisk?: string;
        };
        RouteGenerationRequestDto: {
            routePlanningPreferences?: components["schemas"]["RoutePlanningPreferences"];
            /** Format: int64 */
            seed?: number;
            startPoint?: components["schemas"]["StartPointDto"];
            style?: string;
            /** Format: int32 */
            targetDistanceKm?: number;
            /** Format: int32 */
            variationLevel?: number;
        };
        RouteGroupDetailDto: {
            /** Format: int32 */
            algorithmVersion?: number;
            /** Format: double */
            averageSpeedKmh?: number;
            /** Format: double */
            bestSpeedKmh?: number;
            directionKey?: string;
            /** Format: int32 */
            rideCount?: number;
            rides?: components["schemas"]["MatchedRidePointDto"][];
            /** Format: uuid */
            routeFamilyId?: string;
            /** Format: uuid */
            routeGroupId?: string;
            /** Format: double */
            slowestSpeedKmh?: number;
        };
        RoutePlanningPreferences: {
            /** @enum {string} */
            climbPreference?: "flatter" | "balanced" | "hillier";
            /** @enum {string} */
            distancePreference?: "shortest" | "balanced" | "longer";
            /** @enum {string} */
            surfacePreference?: "asphalt" | "balanced" | "gravel";
            /** @enum {string} */
            trafficPreference?: "quieter" | "balanced" | "direct";
        };
        RoutePreviewDto: {
            cyclewayDistanceM?: number;
            distanceM?: number;
            elevationGainM?: number;
            /** Format: int32 */
            estimatedTimeSec?: number;
            /** Format: int32 */
            estimatedTss?: number;
            notices?: string[];
            pavedDistanceM?: number;
            polyline?: number[][];
            profile?: string;
            provider?: string;
            quietDistanceM?: number;
            unpavedDistanceM?: number;
        };
        RoutePreviewRequestDto: {
            preferences?: components["schemas"]["RoutePlanningPreferences"];
            waypoints?: number[][];
        };
        RouteWaypoint: {
            elevationM?: number;
            /** Format: int32 */
            index?: number;
            label?: string;
            /** Format: double */
            lat?: number;
            /** Format: double */
            lng?: number;
        };
        SaveChallengeRequest: {
            description?: string;
            /** Format: date */
            endDate?: string;
            name?: string;
            /** Format: date */
            startDate?: string;
            targetUnit?: string;
            /** Format: double */
            targetValue?: number;
            type?: string;
        };
        SaveEquipmentRequest: {
            brand?: string;
            model?: string;
            name?: string;
            notes?: string;
            /** Format: date */
            purchaseDate?: string;
            purchasePrice?: number;
            /** Format: int32 */
            replacementIntervalKm?: number;
            /** Format: double */
            totalKm?: number;
            type?: string;
        };
        SaveJournalEntryRequest: {
            /** Format: uuid */
            activityId: string;
            mood: string;
            note?: string;
            tags?: string[];
        };
        SaveReadinessCheckInRequest: {
            /** Format: int32 */
            legFreshness: number;
            /** Format: int32 */
            motivation: number;
            /** Format: int32 */
            sleepQuality: number;
            /** Format: int32 */
            soreness: number;
        };
        SegmentComparisonDto: {
            /** Format: double */
            distanceM?: number;
            /** Format: uuid */
            referenceEffortId?: string;
            /** Format: int64 */
            segmentId?: number;
            series?: components["schemas"]["SegmentComparisonSeriesDto"][];
        };
        SegmentComparisonPointDto: {
            /** Format: double */
            altitudeM?: number;
            /** Format: double */
            cadence?: number;
            /** Format: double */
            distanceM?: number;
            /** Format: double */
            heartrate?: number;
            /** Format: double */
            latitude?: number;
            /** Format: double */
            longitude?: number;
            /** Format: double */
            powerW?: number;
            /** Format: double */
            speedMs?: number;
            /** Format: double */
            timeDeltaSec?: number;
            /** Format: double */
            timeSec?: number;
        };
        SegmentComparisonSeriesDto: {
            /** Format: uuid */
            activityId?: string;
            activityName?: string;
            /** Format: uuid */
            effortId?: string;
            /** Format: int32 */
            elapsedTimeSec?: number;
            points?: components["schemas"]["SegmentComparisonPointDto"][];
            /** Format: date-time */
            startedAt?: string;
        };
        SegmentDetailDto: {
            backfillStatus?: string;
            efforts?: components["schemas"]["SegmentEffortDto"][];
            personalBestConfirmed?: boolean;
            segment?: components["schemas"]["SegmentSummaryDto"];
        };
        SegmentEffortDto: {
            achievementLabel?: string;
            /** Format: uuid */
            activityId?: string;
            activityName?: string;
            /** Format: int32 */
            averageCadence?: number;
            /** Format: int32 */
            averageHeartrate?: number;
            /** Format: int32 */
            averagePowerW?: number;
            averageSpeedMs?: number;
            deviceWatts?: boolean;
            /** Format: int32 */
            differenceToBestSec?: number;
            distanceM?: number;
            /** Format: int32 */
            elapsedTimeSec?: number;
            elevationGainM?: number;
            /** Format: int32 */
            endIndex?: number;
            /** Format: int64 */
            externalId?: number;
            /** Format: uuid */
            id?: string;
            /** Format: int32 */
            movingTimeSec?: number;
            /** Format: int32 */
            personalRank?: number;
            /** Format: int32 */
            previousBestElapsedTimeSec?: number;
            recordAtTime?: boolean;
            routePolyline?: string;
            /** Format: int64 */
            segmentId?: number;
            segmentName?: string;
            /** Format: int32 */
            sequence?: number;
            /** Format: date-time */
            startedAt?: string;
            /** Format: int32 */
            startIndex?: number;
        };
        SegmentPageDto: {
            items?: components["schemas"]["SegmentSummaryDto"][];
            /** Format: int32 */
            page?: number;
            /** Format: int32 */
            size?: number;
            /** Format: int64 */
            total?: number;
            /** Format: int32 */
            totalPages?: number;
        };
        SegmentSummaryDto: {
            activityType?: string;
            averageGrade?: number;
            /** Format: int32 */
            bestElapsedTimeSec?: number;
            city?: string;
            country?: string;
            distanceM?: number;
            /** Format: int32 */
            effortCount?: number;
            elevationHighM?: number;
            elevationLowM?: number;
            /** Format: double */
            endLatitude?: number;
            /** Format: double */
            endLongitude?: number;
            /** Format: int64 */
            id?: number;
            /** Format: date-time */
            latestEffortAt?: string;
            localFavorite?: boolean;
            maximumGrade?: number;
            name?: string;
            routePolyline?: string;
            /** Format: double */
            startLatitude?: number;
            /** Format: double */
            startLongitude?: number;
        };
        SessionInputDto: {
            /** Format: date */
            day?: string;
            /** Format: int32 */
            durationMinutes?: number;
            goal?: string;
            tss?: number;
            type?: string;
        };
        SessionOptionDto: {
            description?: string;
            difficulty?: string;
            /** Format: int32 */
            durationMinutes?: number;
            indoor?: boolean;
            /** Format: double */
            intensityFactor?: number;
            /** Format: double */
            score?: number;
            scoreBreakdown?: {
                [key: string]: number;
            };
            /** Format: double */
            targetTss?: number;
            type?: string;
        };
        SessionSuggestionDto: {
            /** Format: int32 */
            durationMin?: number;
            /** Format: double */
            estimatedIf?: number;
            /** Format: int32 */
            estimatedTss?: number;
            impact?: string;
            label?: string;
            rationale?: string;
            /** Format: int32 */
            roiScore?: number;
            structure?: string;
            type?: string;
        };
        SetWeightGoalRequest: {
            /** Format: date */
            targetDate: string;
            targetWeightKg: number;
        };
        SleepTrend: {
            /** Format: int32 */
            avgDurationSeconds?: number;
            avgScore?: number;
            /** Format: int32 */
            latestScore?: number;
        };
        SseEmitter: {
            /** Format: int64 */
            timeout?: number;
        };
        StartPointDto: {
            /** Format: double */
            lat?: number;
            /** Format: double */
            lng?: number;
        };
        StartWorkoutExecutionRequest: {
            deliveryMethod?: string;
            idempotencyKey?: string;
            /** Format: date-time */
            occurredAt?: string;
        };
        StrategyDto: {
            fatigueState?: string;
            performanceTrend?: string;
            progressionAction?: string;
        };
        StravaConfigDto: {
            clientId?: string;
            clientIdSource?: string;
            clientSecretSource?: string;
            hasClientSecret?: boolean;
            hasWebhookToken?: boolean;
            webhookTokenSource?: string;
        };
        StressTrend: {
            avg?: number;
            /** Format: int32 */
            current?: number;
        };
        SyncStatus: {
            /** Format: int32 */
            imported?: number;
            /** Format: date-time */
            lastSyncAt?: string;
            /** Format: date-time */
            rateLimitResetsAt?: string;
            /** Format: int32 */
            skipped?: number;
            status?: string;
        };
        TodayDto: {
            /** Format: date */
            asOf?: string;
            confidence?: components["schemas"]["ConfidenceDto"];
            dataStatus?: string;
            evidence?: components["schemas"]["EvidenceDto"][];
            lastActivity?: components["schemas"]["ActivitySummaryDto"];
            load?: components["schemas"]["LoadSnapshotDto"];
            nextTraining?: components["schemas"]["TrainingPlanDto"];
            recommendation?: components["schemas"]["RecommendationDto"];
            sync?: components["schemas"]["SyncStatus"];
            timezone?: string;
        };
        TrainingAdjustmentSuggestionDto: {
            description?: string;
            memoryHint?: string;
            title?: string;
            type?: string;
        };
        TrainingConstraintDto: {
            /** Format: date */
            from: string;
            note?: string;
            /** Format: date */
            to: string;
            /** @enum {string} */
            type: "BLOCKED" | "RETURN_TO_TRAINING";
        };
        TrainingContextDto: {
            /** Format: date */
            asOf?: string;
            availableMinutes: {
                [key: string]: number;
            };
            constraints: components["schemas"]["TrainingConstraintDto"][];
            /** Format: date */
            deadline?: string;
            /** @enum {string} */
            environment: "MIXED" | "INDOOR" | "OUTDOOR";
            /** @enum {string} */
            goalType?: "FTP" | "ENDURANCE" | "CONSISTENCY" | "EVENT";
            /** Format: int64 */
            revision: number;
            /** Format: double */
            targetValue?: number;
            timezone?: string;
        };
        TrainingDayProjectionDto: {
            dayLabel?: string;
            dayType?: string;
            plannedTss?: number;
            projectedAtl?: number;
            projectedCtl?: number;
            /** Format: int32 */
            projectedReadiness?: number;
            projectedTsb?: number;
            taperDay?: boolean;
        };
        TrainingExecutionAssessmentDto: {
            algorithmVersion?: string;
            availability?: string;
            description?: string;
            /** Format: double */
            durationCompliance?: number;
            /** Format: double */
            intervalCompliance?: number;
            label?: string;
            nextDayAdvice?: string;
            outcome?: string;
            primaryLimiter?: string;
            /** Format: int32 */
            score?: number;
            stimulusMatch?: boolean;
            /** Format: double */
            tssCompliance?: number;
            /** Format: double */
            zoneCompliance?: number;
        };
        TrainingGoalScorecardDto: {
            actualTss?: number;
            /** Format: int32 */
            avgExecutionScore?: number;
            /** Format: int32 */
            completedGoalSessions?: number;
            /** Format: int32 */
            completedQualityDays?: number;
            /** Format: int32 */
            goalExecutionScore?: number;
            goalExecutionStatus?: string;
            goalFocusLabel?: string;
            goalFocusRole?: string;
            label?: string;
            onTrack?: boolean;
            /** Format: int32 */
            plannedGoalSessions?: number;
            /** Format: int32 */
            plannedQualityDays?: number;
            plannedTss?: number;
            /** Format: date */
            weekEnd?: string;
            /** Format: date */
            weekStart?: string;
        };
        TrainingLoadStateDto: {
            atl?: number;
            ctl?: number;
            tsb?: number;
        };
        TrainingPlanDto: {
            activityMatchStatus?: string;
            /** Format: uuid */
            actualActivityId?: string;
            compliancePct?: number;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date */
            date?: string;
            deliveryMethod?: string;
            deliveryStatus?: string;
            /** Format: int32 */
            ftpWatts?: number;
            /** Format: uuid */
            id?: string;
            /** Format: int32 */
            lthrBpm?: number;
            /** Format: int32 */
            maxHrBpm?: number;
            notes?: string;
            plannedDescription?: string;
            /** Format: int32 */
            plannedDurationMin?: number;
            plannedTss?: number;
            plannedType?: string;
            /** Format: uuid */
            programId?: string;
            /** Format: int32 */
            restingHrBpm?: number;
            sessionRole?: string;
            status?: string;
            /** Format: int32 */
            targetPowerHighW?: number;
            /** Format: int32 */
            targetPowerLowW?: number;
            workoutStepsSnapshot?: components["schemas"]["WorkoutStep"][];
            /** Format: uuid */
            workoutTemplateId?: string;
            workoutTemplateName?: string;
            /** Format: int32 */
            workoutTemplateRevision?: number;
            /** Format: uuid */
            workoutTemplateRevisionId?: string;
        };
        TrainingPlanProgramDto: {
            /** Format: date-time */
            createdAt?: string;
            /** Format: date */
            endDate?: string;
            environmentPreference?: string;
            /** Format: date */
            eventDate?: string;
            generatedBy?: string;
            goal?: string;
            goalPriority?: string;
            goalScorecards?: components["schemas"]["TrainingGoalScorecardDto"][];
            /** Format: uuid */
            id?: string;
            name?: string;
            preferredLongRideDay?: string;
            /** Format: date */
            startDate?: string;
            /** Format: date */
            taperStartDate?: string;
            targetWeeklyHours?: number;
            targetWeeklyTss?: number;
            /** Format: int32 */
            weekdayAvailabilityMinutes?: number;
            /** Format: int32 */
            weekendAvailabilityMinutes?: number;
            weeklyObjectives?: components["schemas"]["TrainingWeekObjectiveDto"][];
        };
        TrainingPrioritiesDto: {
            cpModel?: components["schemas"]["CpModelDto"];
            durabilityProfile?: components["schemas"]["DurabilityProfileDto"];
            fatigueFactors?: components["schemas"]["FatigueFactorsDto"];
            intervalDetection?: components["schemas"]["IntervalDetectionDto"];
            powerPhenotype?: components["schemas"]["PowerPhenotypeDto"];
            priorities?: components["schemas"]["TrainingPriorityDto"][];
        };
        TrainingPriorityDto: {
            action?: string;
            /** Format: int32 */
            impactScore?: number;
            metricsSummary?: string;
            /** Format: int32 */
            rank?: number;
            rationale?: string;
            subsystem?: string;
            title?: string;
            /** Format: int32 */
            weeklyHours?: number;
        };
        TrainingStatusDto: {
            /** Format: double */
            ctlTrend?: number;
            /** Format: double */
            currentCtl?: number;
            /** Format: double */
            currentTsb?: number;
            description?: string;
            /** Format: int32 */
            fatigue?: number;
            label?: string;
            status?: string;
        };
        TrainingWeekObjectiveDto: {
            focus?: string;
            fuelingGuidance?: string;
            fuelingLabel?: string;
            keySessionTypes?: string[];
            label?: string;
            /** Format: int32 */
            maxQualityDays?: number;
            objectiveType?: string;
            plannedTss?: number;
            /** Format: date */
            weekEnd?: string;
            /** Format: date */
            weekStart?: string;
        };
        TrainingZoneDto: {
            color?: string;
            /** Format: uuid */
            id?: string;
            /** Format: int32 */
            maxValue?: number;
            /** Format: int32 */
            minValue?: number;
            /** Format: date */
            validFrom?: string;
            /** Format: date */
            validTo?: string;
            zoneName?: string;
            /** Format: int32 */
            zoneNumber?: number;
            zoneType?: string;
        };
        TrendDto: {
            /** Format: date */
            date?: string;
            metricName?: string;
            value?: number;
        };
        UiPreferencesDto: {
            dashboard?: components["schemas"]["DashboardLayoutDto"];
            mobileNavigation?: string[];
            /** Format: int64 */
            revision?: number;
            /** Format: int32 */
            schemaVersion?: number;
            warnings?: string[];
        };
        UpdatePlanStatusRequest: {
            status?: string;
        };
        UpdateProfileRequest: {
            /** Format: date */
            dateOfBirth?: string;
            /** Format: int32 */
            ftpWatts?: number;
            /** Format: int32 */
            lthrBpm?: number;
            /** Format: int32 */
            maxHrBpm?: number;
            name?: string;
            /** Format: int32 */
            restingHrBpm?: number;
            weightKg?: number;
        };
        UpdateSegmentFavoriteRequest: {
            favorite?: boolean;
        };
        WeatherDto: {
            /** Format: int32 */
            outdoorScore?: number;
            /** Format: double */
            precipitation?: number;
            /** Format: double */
            temperature?: number;
            warnings?: string[];
            /** Format: int32 */
            weatherCode?: number;
            weatherDescription?: string;
            /** Format: double */
            windSpeed?: number;
        };
        WeatherForecastDto: {
            current?: components["schemas"]["WeatherDto"];
            daily?: components["schemas"]["DailySlot"][];
            hourly?: components["schemas"]["HourlySlot"][];
        };
        WeatherGradientDto: {
            current?: components["schemas"]["WeatherDto"];
            days?: components["schemas"]["GradientDay"][];
            locationName?: string;
        };
        WeatherLocationDto: {
            active?: boolean;
            id?: string;
            /** Format: double */
            latitude?: number;
            /** Format: double */
            longitude?: number;
            name?: string;
        };
        WeeklyBriefDto: {
            /** Format: double */
            avg4WeekHours?: number;
            /** Format: double */
            avg4WeekTss?: number;
            /** Format: int32 */
            daysToEvent?: number;
            /** Format: double */
            efTrend?: number;
            eventName?: string;
            /** Format: int32 */
            fatigueLastWeek?: number;
            /** Format: int32 */
            fatigueScore?: number;
            fatigueTrend?: string;
            /** Format: double */
            loadFocusAnaerobicPct?: number;
            /** Format: double */
            loadFocusHighPct?: number;
            /** Format: double */
            loadFocusLowPct?: number;
            /** Format: double */
            projectedCtl?: number;
            status?: string;
            statusDescription?: string;
            suggestedFocus?: string;
            /** Format: double */
            weeklyHours?: number;
            /** Format: double */
            weeklyTss?: number;
        };
        WeeklyBudgetDto: {
            /** Format: int64 */
            completedTss?: number;
            /** Format: int64 */
            optimalTss?: number;
            /** Format: int64 */
            percentComplete?: number;
            /** Format: int64 */
            remainingTss?: number;
            status?: string;
            weekEnd?: string;
            weekStart?: string;
        };
        WeeklyMmpDto: {
            bestEfforts?: {
                [key: string]: number;
            };
            weekLabel?: string;
            /** Format: date */
            weekStart?: string;
        };
        WeeklyOptimalLoadDto: {
            /** Format: int32 */
            activityCount?: number;
            actualTss?: number;
            ctl?: number;
            dangerThreshold?: number;
            optimalMax?: number;
            optimalMin?: number;
            optimalTarget?: number;
            status?: string;
            /** Format: date */
            weekStart?: string;
        };
        WeeklyReviewDto: {
            /** Format: int32 */
            activityCount: number;
            /** Format: int32 */
            actualMinutes?: number;
            algorithmVersion: string;
            availability: string;
            /** Format: double */
            averageRpe?: number;
            /** Format: int32 */
            completedSessions: number;
            /** Format: double */
            completionRatio?: number;
            /** Format: int32 */
            feedbackCount: number;
            /** Format: date */
            from: string;
            /** Format: int32 */
            plannedMinutes?: number;
            /** Format: int32 */
            plannedSessions: number;
            reasons: string[];
            recommendation: string;
            /** Format: date */
            to: string;
        };
        WeeklySummaryDto: {
            /** Format: int32 */
            activityCount?: number;
            totalDistanceM?: number;
            totalElevationM?: number;
            /** Format: int32 */
            totalTimeSec?: number;
            totalTss?: number;
            /** Format: date */
            weekStart?: string;
        };
        WeightGoalDto: {
            /** Format: date-time */
            createdAt?: string;
            /** Format: uuid */
            id?: string;
            /** Format: date */
            targetDate?: string;
            targetWeightKg?: number;
            /** Format: date-time */
            updatedAt?: string;
        };
        WeightOverviewDto: {
            adjustedDailyTdee?: number;
            currentWeightKg?: number;
            dailyCaloricNeed?: number;
            dailyDeficitOrSurplus?: number;
            dataConfidence?: string;
            goal?: components["schemas"]["WeightGoalDto"];
            history?: components["schemas"]["WeightRecordDto"][];
            recommendedDailyCalories?: number;
            weeklyTrainingCalories?: number;
            weeklyWeightChange?: number;
            weeksRemaining?: number;
        };
        WeightRecordDto: {
            /** Format: date-time */
            createdAt?: string;
            /** Format: uuid */
            id?: string;
            notes?: string;
            /** Format: date */
            recordedDate?: string;
            weightKg?: number;
        };
        WorkoutActivityCandidateDto: {
            /** Format: int32 */
            elapsedTimeSec?: number;
            /** Format: uuid */
            id?: string;
            name?: string;
            sportType?: string;
            /** Format: date-time */
            startedAt?: string;
        };
        WorkoutActivityLinkRequest: {
            /** Format: uuid */
            activityId?: string;
        };
        WorkoutAdjustmentDto: {
            action?: string;
            day?: string;
            newWorkout?: components["schemas"]["NewWorkoutDto"];
            reason?: string;
        };
        WorkoutAnalysis: {
            executionStability?: string;
            fatigueDrift?: string;
            hrResponse?: string;
            /** Format: int32 */
            intervalCompletion?: number;
            /** Format: int32 */
            powerCompliance?: number;
            /** Format: int32 */
            timeInZoneAccuracy?: number;
        };
        WorkoutDeliveryCapabilityDto: {
            method?: string;
            reason?: string;
            status?: string;
        };
        WorkoutEvaluationRequest: {
            actual?: components["schemas"]["ExecutedWorkout"];
            /** Format: int32 */
            athleteFtpWatts?: number;
            /** Format: int32 */
            athleteHrMaxBpm?: number;
            /** Format: int32 */
            athleteRestingHrBpm?: number;
            derived?: components["schemas"]["DerivedMetrics"];
            historical?: components["schemas"]["HistoricalContext"];
            planned?: components["schemas"]["PlannedWorkout"];
            recovery?: components["schemas"]["RecoveryContext"];
            trainingIntent?: string;
        };
        WorkoutEvaluationResponse: {
            analysis?: components["schemas"]["WorkoutAnalysis"];
            /** Format: double */
            confidence?: number;
            contextualFactors?: components["schemas"]["ContextualFactors"];
            insight?: string;
            outcome?: string;
            reasons?: string[];
            recommendation?: string;
            /** Format: int32 */
            score?: number;
        };
        WorkoutExecutionDto: {
            /** Format: uuid */
            activityId?: string;
            activityMatchStatus?: string;
            complianceAlgorithmVersion?: string;
            /** Format: int32 */
            complianceScore?: number;
            complianceStatus?: string;
            /** Format: int32 */
            currentStepIndex?: number;
            deliveryMethod?: string;
            feeling?: string;
            /** Format: date-time */
            finishedAt?: string;
            /** Format: int32 */
            ftpWatts?: number;
            /** Format: uuid */
            id?: string;
            /** Format: int32 */
            intensityAdjustmentPct?: number;
            /** Format: int32 */
            lthrBpm?: number;
            /** Format: int32 */
            maxHrBpm?: number;
            notes?: string;
            repeatedStepIndexes?: number[];
            /** Format: int32 */
            restingHrBpm?: number;
            /** Format: int32 */
            rpe?: number;
            /** Format: date-time */
            runningSince?: string;
            /** Format: uuid */
            scheduledWorkoutId?: string;
            skippedStepIndexes?: number[];
            /** Format: date-time */
            startedAt?: string;
            /** Format: int64 */
            stateVersion?: number;
            status?: string;
            /** Format: int64 */
            stepElapsedMs?: number;
            stepsSnapshot?: components["schemas"]["WorkoutStep"][];
            /** Format: date-time */
            updatedAt?: string;
            /** Format: int64 */
            workoutElapsedMs?: number;
            workoutNameSnapshot?: string;
            /** Format: int32 */
            workoutTemplateRevision?: number;
        };
        WorkoutExecutionEventRequest: {
            idempotencyKey?: string;
            /** Format: int32 */
            intensityDeltaPct?: number;
            /** Format: date-time */
            occurredAt?: string;
            type?: string;
        };
        WorkoutFeedbackRequest: {
            feeling?: string;
            notes?: string;
            /** Format: int32 */
            rpe?: number;
        };
        WorkoutStep: {
            /** Format: int32 */
            cadenceRpmHigh?: number;
            /** Format: int32 */
            cadenceRpmLow?: number;
            /** Format: int32 */
            durationSec?: number;
            durationType?: string;
            /** Format: int32 */
            heartRateBpmHigh?: number;
            /** Format: int32 */
            heartRateBpmLow?: number;
            instructions?: string;
            name?: string;
            /** Format: int32 */
            offCadenceRpmHigh?: number;
            /** Format: int32 */
            offCadenceRpmLow?: number;
            /** Format: int32 */
            offDurationSec?: number;
            /** Format: int32 */
            offHeartRateBpmHigh?: number;
            /** Format: int32 */
            offHeartRateBpmLow?: number;
            /** Format: int32 */
            offPowerPctFtpHigh?: number;
            /** Format: int32 */
            offPowerPctFtpLow?: number;
            /** Format: int32 */
            onCadenceRpmHigh?: number;
            /** Format: int32 */
            onCadenceRpmLow?: number;
            /** Format: int32 */
            onDurationSec?: number;
            /** Format: int32 */
            onHeartRateBpmHigh?: number;
            /** Format: int32 */
            onHeartRateBpmLow?: number;
            /** Format: int32 */
            onPowerPctFtpHigh?: number;
            /** Format: int32 */
            onPowerPctFtpLow?: number;
            /** Format: int32 */
            powerPctFtpHigh?: number;
            /** Format: int32 */
            powerPctFtpLow?: number;
            /** Format: int32 */
            repeat?: number;
            type?: string;
        };
        WorkoutStepInputDto: {
            /** Format: int32 */
            cadenceRpmHigh?: number;
            /** Format: int32 */
            cadenceRpmLow?: number;
            /** Format: int32 */
            durationSec?: number;
            durationType?: string;
            /** Format: int32 */
            heartRateBpmHigh?: number;
            /** Format: int32 */
            heartRateBpmLow?: number;
            instructions?: string;
            name?: string;
            /** Format: int32 */
            offCadenceRpmHigh?: number;
            /** Format: int32 */
            offCadenceRpmLow?: number;
            /** Format: int32 */
            offDurationSec?: number;
            /** Format: int32 */
            offHeartRateBpmHigh?: number;
            /** Format: int32 */
            offHeartRateBpmLow?: number;
            /** Format: int32 */
            offPowerPctFtpHigh?: number;
            /** Format: int32 */
            offPowerPctFtpLow?: number;
            /** Format: int32 */
            onCadenceRpmHigh?: number;
            /** Format: int32 */
            onCadenceRpmLow?: number;
            /** Format: int32 */
            onDurationSec?: number;
            /** Format: int32 */
            onHeartRateBpmHigh?: number;
            /** Format: int32 */
            onHeartRateBpmLow?: number;
            /** Format: int32 */
            onPowerPctFtpHigh?: number;
            /** Format: int32 */
            onPowerPctFtpLow?: number;
            /** Format: int32 */
            powerPctFtpHigh?: number;
            /** Format: int32 */
            powerPctFtpLow?: number;
            /** Format: int32 */
            repeat?: number;
            type?: string;
        };
        WorkoutSuggestionDto: {
            description?: string;
            difficulty?: string;
            /** Format: int32 */
            durationMin?: number;
            indoor?: boolean;
            intensityDescription?: string;
            /** Format: int32 */
            targetTss?: number;
            type?: string;
        };
        WorkoutTemplateDto: {
            category?: string;
            /** Format: date-time */
            createdAt?: string;
            createdBy?: string;
            description?: string;
            /** Format: uuid */
            id?: string;
            intensityFactor?: number;
            name?: string;
            /** Format: int32 */
            relativeEffort?: number;
            /** Format: int32 */
            revision?: number;
            steps?: {
                [key: string]: Record<string, never>;
            }[];
            /** Format: int32 */
            targetDurationMin?: number;
            targetTss?: number;
        };
        ZoneDistributionDto: {
            /** Format: int32 */
            totalSeconds?: number;
            zones?: {
                [key: string]: number;
            };
            zoneType?: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    listActivities: {
        parameters: {
            query?: {
                from?: string;
                maxAvgHr?: number;
                maxAvgPowerW?: number;
                maxDistanceKm?: number;
                maxDurationMin?: number;
                minAvgHr?: number;
                minAvgPowerW?: number;
                minDistanceKm?: number;
                minDurationMin?: number;
                page?: number;
                size?: number;
                sportType?: string;
                to?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ActivitySummaryPageDto"];
                };
            };
        };
    };
    getNote: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                activityId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AiActivityNoteDto"];
                };
            };
        };
    };
    ask: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                activityId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AiNoteAskRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AiNoteAskResponse"];
                };
            };
        };
    };
    generateNote: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                activityId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AiActivityNoteDto"];
                };
            };
        };
    };
    refreshNote: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                activityId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AiActivityNoteDto"];
                };
            };
        };
    };
    getActivity: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ActivityDetailDto"];
                };
            };
        };
    };
    getActivityMap: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: Record<string, never>;
                    };
                };
            };
        };
    };
    recalculateActivityMetrics_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    recalculateTrainingEffect: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getActivityHeatmap: {
        parameters: {
            query?: {
                includeSegments?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ActivityHeatmapDto"];
                };
            };
        };
    };
    getTile: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                x: number;
                y: number;
                z: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": string;
                };
            };
        };
    };
    getTimeline_2: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ActivityTimelineEntry"][];
                };
            };
        };
    };
    decide_1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AdaptiveCoachRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AdaptiveCoachResponse"];
                };
            };
        };
    };
    feedback_2: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PostSessionFeedbackRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    today_1: {
        parameters: {
            query?: {
                aiInput?: string;
                currentValue?: number;
                goalType?: string;
                overrideState?: string;
                targetValue?: number;
                timeAvailableMinutes?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AdaptiveCoachResponse"];
                };
            };
        };
    };
    rebuildFtpHistory: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: string;
                    };
                };
            };
        };
    };
    rebuildHeatmap: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: string;
                    };
                };
            };
        };
    };
    recalculateAllTrainingEffects: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: Record<string, never>;
                    };
                };
            };
        };
    };
    getStravaConfig: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["StravaConfigDto"];
                };
            };
        };
    };
    updateStravaConfig: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    [key: string]: string;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["StravaConfigDto"];
                };
            };
        };
    };
    resetStravaConfig: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["StravaConfigDto"];
                };
            };
        };
    };
    getWeatherJobStatus: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["JobStatus"];
                };
            };
        };
    };
    runBatch: {
        parameters: {
            query?: {
                skipExisting?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["BatchRunResultDto"];
                };
            };
        };
    };
    predict_1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PredictionRequestDto"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PredictionResponseDto"];
                };
            };
        };
    };
    compareModels: {
        parameters: {
            query: {
                providers: string[];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PredictionRequestDto"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PredictionResponseDto"][];
                };
            };
        };
    };
    getHistory_1: {
        parameters: {
            query?: {
                limit?: number;
                type?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PredictionResponseDto"][];
                };
            };
        };
    };
    verifyPrediction: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    [key: string]: Record<string, never>;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PredictionResponseDto"];
                };
            };
        };
    };
    getAll_4: {
        parameters: {
            query?: {
                type?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["CustomPromptDto"][];
                };
            };
        };
    };
    save_2: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CustomPromptDto"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["CustomPromptDto"];
                };
            };
        };
    };
    delete_5: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    activate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["CustomPromptDto"];
                };
            };
        };
    };
    deactivate: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["CustomPromptDto"];
                };
            };
        };
    };
    getStatus: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AiModuleStatusDto"];
                };
            };
        };
    };
    getTodayTips: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PredictionResponseDto"][];
                };
            };
        };
    };
    getBlockHealth: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["BlockHealthDto"];
                };
            };
        };
    };
    comparePeriods: {
        parameters: {
            query: {
                period1From: string;
                period1To: string;
                period2From: string;
                period2To: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: Record<string, never>;
                    };
                };
            };
        };
    };
    getDailyOptimalLoad: {
        parameters: {
            query?: {
                futureDays?: number;
                pastDays?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["DailyOptimalLoadDto"][];
                };
            };
        };
    };
    getDurability: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["DurabilityInsightDto"];
                };
            };
        };
    };
    getFtpProgress: {
        parameters: {
            query?: {
                from?: string;
                to?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["FtpProgressDto"];
                };
            };
        };
    };
    getPmc: {
        parameters: {
            query: {
                from: string;
                to: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PmcDataDto"][];
                };
            };
        };
    };
    getPowerCurve: {
        parameters: {
            query: {
                from: string;
                to: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PowerCurveDto"];
                };
            };
        };
    };
    getProgressionLevels: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ProgressionLevelDto"][];
                };
            };
        };
    };
    getReadiness: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ReadinessDto"];
                };
            };
        };
    };
    saveReadinessCheckIn: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SaveReadinessCheckInRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ReadinessDto"];
                };
            };
        };
    };
    getSummary: {
        parameters: {
            query?: {
                period?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: Record<string, never>;
                    };
                };
            };
        };
    };
    getTrainingStatus: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TrainingStatusDto"];
                };
            };
        };
    };
    getTrends: {
        parameters: {
            query: {
                from: string;
                metric: string;
                to: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TrendDto"][];
                };
            };
        };
    };
    getWeeklySummaries: {
        parameters: {
            query?: {
                weeks?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WeeklySummaryDto"][];
                };
            };
        };
    };
    getWeeklyBrief: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WeeklyBriefDto"];
                };
            };
        };
    };
    getWeeklyBudget: {
        parameters: {
            query?: {
                ctl?: number;
                eventDate?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WeeklyBudgetDto"];
                };
            };
        };
    };
    getWeeklyMmp: {
        parameters: {
            query: {
                from: string;
                to: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WeeklyMmpDto"][];
                };
            };
        };
    };
    getWeeklyOptimalLoad: {
        parameters: {
            query?: {
                weeks?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WeeklyOptimalLoadDto"][];
                };
            };
        };
    };
    getZoneDistribution: {
        parameters: {
            query: {
                from: string;
                to: string;
                zoneType?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ZoneDistributionDto"];
                };
            };
        };
    };
    callback: {
        parameters: {
            query: {
                code: string;
                scope?: string;
                state: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    connect_1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: string;
                    };
                };
            };
        };
    };
    getAll_3: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ChallengeDto"][];
                };
            };
        };
    };
    create_3: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SaveChallengeRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ChallengeDto"];
                };
            };
        };
    };
    update_3: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SaveChallengeRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ChallengeDto"];
                };
            };
        };
    };
    delete_3: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getActive_1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ChallengeDto"][];
                };
            };
        };
    };
    getTemplates: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: Record<string, never>;
                    }[];
                };
            };
        };
    };
    decide: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AdaptiveCoachRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AdaptiveCoachResponse"];
                };
            };
        };
    };
    feedback_1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PostSessionFeedbackRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getTodayDecision: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AdaptiveCoachResponse"];
                };
            };
        };
    };
    getDailyDecision: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["DailyDecisionDto"];
                };
            };
        };
    };
    getUnexploredDirections: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: Record<string, never>;
                    }[];
                };
            };
        };
    };
    getAll_2: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["EquipmentDto"][];
                };
            };
        };
    };
    create_2: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SaveEquipmentRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["EquipmentDto"];
                };
            };
        };
    };
    getById_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["EquipmentDto"];
                };
            };
        };
    };
    update_2: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SaveEquipmentRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["EquipmentDto"];
                };
            };
        };
    };
    delete_2: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getAlerts: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["EquipmentDto"][];
                };
            };
        };
    };
    evaluateWorkout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WorkoutEvaluationRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WorkoutEvaluationResponse"];
                };
            };
        };
    };
    getAll_1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["EventDto"][];
                };
            };
        };
    };
    create_1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateEventRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["EventDto"];
                };
            };
        };
    };
    update_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    [key: string]: Record<string, never>;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["EventDto"];
                };
            };
        };
    };
    delete_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getActive: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["EventDto"][];
                };
            };
        };
    };
    getActiveProjection: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["EventProjectionDto"];
                };
            };
        };
    };
    getLoadFocus: {
        parameters: {
            query?: {
                weeks?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["LoadFocusDto"];
                };
            };
        };
    };
    getState: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["FatigueStateDto"];
                };
            };
        };
    };
    suggestSessions: {
        parameters: {
            query?: {
                minutes?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SessionSuggestionDto"][];
                };
            };
        };
    };
    getAchievements: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AchievementDto"][];
                };
            };
        };
    };
    evaluateAchievements: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AchievementDto"][];
                };
            };
        };
    };
    updateMetrics: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    [key: string]: Record<string, never>;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getOverview_1: {
        parameters: {
            query?: {
                days?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["HealthOverview"];
                };
            };
        };
    };
    getRecoveryStatus: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RecoveryStatus"];
                };
            };
        };
    };
    getTimeline_1: {
        parameters: {
            query: {
                from: string;
                to: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["HealthDay"][];
                };
            };
        };
    };
    getEntries: {
        parameters: {
            query?: {
                from?: string;
                to?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["JournalEntryDto"][];
                };
            };
        };
    };
    save_1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SaveJournalEntryRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["JournalEntryDto"];
                };
            };
        };
    };
    delete_4: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getByActivityId: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                activityId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["JournalEntryDto"];
                };
            };
        };
    };
    getLatest: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["JournalEntryDto"];
                };
            };
        };
    };
    getMoodCorrelation: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["MoodCorrelationDto"];
                };
            };
        };
    };
    getRecent: {
        parameters: {
            query?: {
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["JournalEntryDto"][];
                };
            };
        };
    };
    info: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: Record<string, never>;
                    };
                };
            };
        };
    };
    message: {
        parameters: {
            query: {
                sessionId: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    [key: string]: Record<string, never>;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    connect: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/event-stream": components["schemas"]["SseEmitter"];
                };
            };
        };
    };
    getPendingNudges: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["NudgeDto"][];
                };
            };
        };
    };
    getCurrentState: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["CurrentPerformanceStateDto"];
                };
            };
        };
    };
    predict: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PerformancePredictionRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PerformancePredictionResponse"];
                };
            };
        };
    };
    getAllRecords: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PersonalRecordDto"][];
                };
            };
        };
    };
    detectNewRecords: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PersonalRecordDto"][];
                };
            };
        };
    };
    getRecentRecords: {
        parameters: {
            query?: {
                days?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PersonalRecordDto"][];
                };
            };
        };
    };
    getProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AthleteProfileDto"];
                };
            };
        };
    };
    updateProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateProfileRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AthleteProfileDto"];
                };
            };
        };
    };
    listRoutes: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PlannedRoute"][];
                };
            };
        };
    };
    createRoute: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateRouteRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PlannedRoute"];
                };
            };
        };
    };
    getRoute: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PlannedRoute"];
                };
            };
        };
    };
    deleteRoute: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    exportGpx: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": string;
                };
            };
        };
    };
    generateRoute: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RouteGenerationRequestDto"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["GeneratedRouteSuggestionDto"];
                };
            };
        };
    };
    generateRouteAlternatives: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RouteGenerationRequestDto"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["GeneratedRouteSuggestionDto"][];
                };
            };
        };
    };
    generateAndPersist: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RouteGenerationRequestDto"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PlannedRoute"];
                };
            };
        };
    };
    previewRoute: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RoutePreviewRequestDto"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RoutePreviewDto"];
                };
            };
        };
    };
    getWrapped: {
        parameters: {
            query?: {
                year?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: Record<string, never>;
                    };
                };
            };
        };
    };
    getAvailableYears: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": number[];
                };
            };
        };
    };
    getCalendar_1: {
        parameters: {
            query?: {
                year?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: Record<string, never>;
                    };
                };
            };
        };
    };
    getStats: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: Record<string, never>;
                    };
                };
            };
        };
    };
    getAutoSyncConfig: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AutoSyncConfig"];
                };
            };
        };
    };
    updateAutoSyncConfig: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    [key: string]: number;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AutoSyncConfig"];
                };
            };
        };
    };
    clearData: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    recalculateActivityMetrics: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    recalculateMetrics: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    syncStatus: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SyncStatus"];
                };
            };
        };
    };
    checkNewActivities: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["NewActivitiesCheck"];
                };
            };
        };
    };
    fullSync: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SyncStatus"];
                };
            };
        };
    };
    syncActivityPhotos: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SyncStatus"];
                };
            };
        };
    };
    recentSync: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SyncStatus"];
                };
            };
        };
    };
    resyncStreams: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SyncStatus"];
                };
            };
        };
    };
    getTimeline: {
        parameters: {
            query?: {
                from?: string;
                to?: string;
                type?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": {
                        [key: string]: Record<string, never>;
                    }[];
                };
            };
        };
    };
    getPriorities: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TrainingPrioritiesDto"];
                };
            };
        };
    };
    adapt: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AdaptiveTrainingRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AdaptiveTrainingResponse"];
                };
            };
        };
    };
    recordAdjustmentFeedback: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RecordAdjustmentFeedbackRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getCalendar: {
        parameters: {
            query: {
                from: string;
                to: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["CalendarDayDto"][];
                };
            };
        };
    };
    optimize: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OptimizePlanRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["OptimizePlanResponse"];
                };
            };
        };
    };
    applyOptimizedPlan: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ApplyOptimizedPlanRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TrainingPlanProgramDto"];
                };
            };
        };
    };
    getPlans: {
        parameters: {
            query: {
                from: string;
                to: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TrainingPlanDto"][];
                };
            };
        };
    };
    createPlan: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateTrainingPlanRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TrainingPlanDto"];
                };
            };
        };
    };
    deletePlan: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    updateStatus: {
        parameters: {
            query?: {
                status?: string;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["UpdatePlanStatusRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getPrograms: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TrainingPlanProgramDto"][];
                };
            };
        };
    };
    deleteProgram: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    generatePlan: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GeneratePlanRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TrainingPlanProgramDto"];
                };
            };
        };
    };
    getAll: {
        parameters: {
            query?: {
                category?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WorkoutTemplateDto"][];
                };
            };
        };
    };
    create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    [key: string]: Record<string, never>;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WorkoutTemplateDto"];
                };
            };
        };
    };
    getById: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WorkoutTemplateDto"];
                };
            };
        };
    };
    update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    [key: string]: Record<string, never>;
                };
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WorkoutTemplateDto"];
                };
            };
        };
    };
    delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    exportFit_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": string;
                };
            };
        };
    };
    exportZwo_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": string;
                };
            };
        };
    };
    findActivities: {
        parameters: {
            query?: {
                from?: string;
                page?: number;
                q?: string;
                size?: number;
                sportType?: string;
                to?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ActivitySummaryPageDto"];
                };
            };
        };
    };
    findActivity: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ActivityV2DetailDto"];
                };
            };
        };
    };
    findLaps: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["LapDto"][];
                };
            };
        };
    };
    findSegments_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ActivitySegmentsDto"];
                };
            };
        };
    };
    findStreams: {
        parameters: {
            query?: {
                resolution?: string;
                series?: string;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ActivityStreamsDto"];
                };
            };
        };
    };
    status: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                type: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["BackfillStatusDto"];
                };
            };
        };
    };
    start_1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                type: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["BackfillStatusDto"];
                };
            };
        };
    };
    compare_1: {
        parameters: {
            query: {
                period1From: string;
                period1To: string;
                period2From: string;
                period2To: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PeriodComparisonDto"];
                };
            };
        };
    };
    load: {
        parameters: {
            query: {
                from: string;
                to: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["LoadAnalyticsDto"];
                };
            };
        };
    };
    overview: {
        parameters: {
            query: {
                from: string;
                to: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["AnalyticsOverviewDto"];
                };
            };
        };
    };
    power: {
        parameters: {
            query: {
                from: string;
                includeUnverified?: boolean;
                to: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["PowerAnalyticsDto"];
                };
            };
        };
    };
    activity: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ActivityDataQualityDto"];
                };
            };
        };
    };
    summary: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["DataQualitySummaryDto"];
                };
            };
        };
    };
    createImportJob: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["ImportJobRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ProcessingJobDto"];
                };
            };
        };
    };
    getJob: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ProcessingJobDto"];
                };
            };
        };
    };
    retryJob: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ProcessingJobDto"];
                };
            };
        };
    };
    findGroup: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                groupId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["RouteGroupDetailDto"];
                };
            };
        };
    };
    findForActivity: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                activityId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["MatchedRideSummaryDto"];
                };
            };
        };
    };
    loadScenario: {
        parameters: {
            query: {
                from: string;
                to: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["LoadScenarioDto"];
                };
            };
        };
    };
    createRecalculationJob: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["ProcessingJobDto"];
                };
            };
        };
    };
    findSegments: {
        parameters: {
            query?: {
                favorite?: boolean;
                maxDistanceM?: number;
                minAverageGrade?: number;
                minDistanceM?: number;
                page?: number;
                q?: string;
                size?: number;
                sort?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SegmentPageDto"];
                };
            };
        };
    };
    findSegment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SegmentDetailDto"];
                };
            };
        };
    };
    compare: {
        parameters: {
            query: {
                effortIds: string[];
                referenceEffortId?: string;
            };
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SegmentComparisonDto"];
                };
            };
        };
    };
    findEfforts: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SegmentEffortDto"][];
                };
            };
        };
    };
    setFavorite: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateSegmentFavoriteRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["SegmentSummaryDto"];
                };
            };
        };
    };
    getToday: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TodayDto"];
                };
            };
        };
    };
    get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TrainingContextDto"];
                };
            };
        };
    };
    save: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TrainingContextDto"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TrainingContextDto"];
                };
            };
        };
    };
    review: {
        parameters: {
            query?: {
                from?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WeeklyReviewDto"];
                };
            };
        };
    };
    getPreferences: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["UiPreferencesDto"];
                };
            };
        };
    };
    updatePreferences: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UiPreferencesDto"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["UiPreferencesDto"];
                };
            };
        };
    };
    capabilities: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WorkoutDeliveryCapabilityDto"][];
                };
            };
        };
    };
    execution: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WorkoutExecutionDto"];
                };
            };
        };
    };
    abort: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FinishWorkoutExecutionRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WorkoutExecutionDto"];
                };
            };
        };
    };
    candidates: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WorkoutActivityCandidateDto"][];
                };
            };
        };
    };
    link: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WorkoutActivityLinkRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WorkoutExecutionDto"];
                };
            };
        };
    };
    complete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FinishWorkoutExecutionRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WorkoutExecutionDto"];
                };
            };
        };
    };
    event: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WorkoutExecutionEventRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WorkoutExecutionDto"];
                };
            };
        };
    };
    feedback: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WorkoutFeedbackRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WorkoutExecutionDto"];
                };
            };
        };
    };
    active: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WorkoutExecutionDto"];
                };
            };
        };
    };
    scheduled: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TrainingPlanDto"];
                };
            };
        };
    };
    start: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StartWorkoutExecutionRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WorkoutExecutionDto"];
                };
            };
        };
    };
    exportFit: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": string;
                };
            };
        };
    };
    exportZwo: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": string;
                };
            };
        };
    };
    today: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["TrainingPlanDto"][];
                };
            };
        };
    };
    getCurrentWeather: {
        parameters: {
            query?: {
                lat?: number;
                lon?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WeatherDto"];
                };
            };
        };
    };
    getWeatherForecast: {
        parameters: {
            query?: {
                lat?: number;
                lon?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WeatherForecastDto"];
                };
            };
        };
    };
    getWeatherGradient: {
        parameters: {
            query: {
                location: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WeatherGradientDto"];
                };
            };
        };
    };
    getWeatherPointGradient: {
        parameters: {
            query: {
                label?: string;
                lat: number;
                lon: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WeatherGradientDto"];
                };
            };
        };
    };
    refreshGradient: {
        parameters: {
            query: {
                location: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    refreshAllGradients: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getLocations: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WeatherLocationDto"][];
                };
            };
        };
    };
    addLocation: {
        parameters: {
            query: {
                lat: number;
                lon: number;
                name: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WeatherLocationDto"];
                };
            };
        };
    };
    deleteLocation: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                name: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    activateLocation: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                name: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WeatherLocationDto"];
                };
            };
        };
    };
    getActiveLocation: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WeatherLocationDto"];
                };
            };
        };
    };
    getOverview: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WeightOverviewDto"];
                };
            };
        };
    };
    addWeight: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddWeightRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WeightRecordDto"];
                };
            };
        };
    };
    deleteWeight: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    setGoal: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SetWeightGoalRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WeightGoalDto"];
                };
            };
        };
    };
    deleteGoal: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    getHistory: {
        parameters: {
            query?: {
                from?: string;
                to?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "*/*": components["schemas"]["WeightRecordDto"][];
                };
            };
        };
    };
}
