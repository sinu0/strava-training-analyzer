package pl.strava.analizator.domain.model;

import java.util.Map;

/**
 * Coggan-style power phenotype classification based on the power-duration curve shape.
 */
public record PowerPhenotype(
        /** Primary phenotype: SPRINTER | PURSUITER | TIME_TRIALIST | ALL_ROUNDER | CLIMBER */
        String primaryType,
        /** Secondary phenotype if close to another type */
        String secondaryType,
        /** Power profile per duration as W/kg: { "5s": 18.0, "30s": 9.0, "1min": 7.0, "5min": 5.0, "20min": 4.0, ... } */
        Map<String, Double> powerProfileWkg,
        /** Percentile vs Coggan reference values: { "5s": 45, "30s": 60, "1min": 55, ... } */
        Map<String, Integer> percentiles,
        /** Best duration: which part of the power curve stands out most vs reference */
        String bestDuration,
        /** Worst duration: which part of the power curve is weakest vs reference */
        String worstDuration,
        /** Weakness gap: how much under the reference the worst duration is (W/kg) */
        double weaknessGapWkg,
        /** Description of the phenotype's implications */
        String description,
        /** Specific training recommendation based on phenotype */
        String recommendation
) {}
