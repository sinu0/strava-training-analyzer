package pl.strava.analizator.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PmcDataDto {

    private LocalDate date;
    private BigDecimal ctl;
    private BigDecimal atl;
    private BigDecimal tsb;
    private BigDecimal ctlDelta;
    private BigDecimal atlDelta;
    private BigDecimal tsbDelta;
}
