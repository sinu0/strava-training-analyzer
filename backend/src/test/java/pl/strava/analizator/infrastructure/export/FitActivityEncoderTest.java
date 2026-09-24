package pl.strava.analizator.infrastructure.export;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;

import org.junit.jupiter.api.Test;

import com.garmin.fit.ActivityMesg;
import com.garmin.fit.Decode;
import com.garmin.fit.File;
import com.garmin.fit.FileIdMesg;
import com.garmin.fit.LapMesg;
import com.garmin.fit.Mesg;
import com.garmin.fit.MesgBroadcaster;
import com.garmin.fit.MesgNum;
import com.garmin.fit.RecordMesg;
import com.garmin.fit.SessionMesg;
import com.garmin.fit.Sport;
import com.garmin.fit.SubSport;

import pl.strava.analizator.domain.model.RideSample;
import pl.strava.analizator.domain.model.WorkoutExecution;

class FitActivityEncoderTest {
    private static final Instant START = Instant.parse("2026-09-24T17:00:00Z");

    private static List<RideSample> ride() {
        List<RideSample> samples = new ArrayList<>();
        IntStream.range(0, 120).forEach(second -> samples.add(RideSample.builder()
                .at(START.plusSeconds(second)).elapsedMs(second * 1000L).stepIndex(second < 60 ? 0 : 1)
                .powerWatts(second < 60 ? 150 : 250).heartRateBpm(second < 60 ? 120 : 150)
                .cadenceRpm(90).speedKph(36.0).build()));
        return samples;
    }

    private static List<Mesg> decode(byte[] bytes) {
        List<Mesg> messages = new ArrayList<>();
        MesgBroadcaster broadcaster = new MesgBroadcaster(new Decode());
        broadcaster.addListener((com.garmin.fit.MesgListener) mesg -> messages.add(switch (mesg.getNum()) {
            case MesgNum.FILE_ID -> new FileIdMesg(mesg);
            case MesgNum.RECORD -> new RecordMesg(mesg);
            case MesgNum.LAP -> new LapMesg(mesg);
            case MesgNum.SESSION -> new SessionMesg(mesg);
            case MesgNum.ACTIVITY -> new ActivityMesg(mesg);
            default -> mesg;
        }));
        broadcaster.run(new ByteArrayInputStream(bytes));
        return messages;
    }

    @Test
    void writesAValidIndoorCyclingActivityWithLapsPerStep() {
        WorkoutExecution execution = WorkoutExecution.builder().id(UUID.randomUUID()).workoutNameSnapshot("Próg").ftpWatts(250).build();

        byte[] bytes = new FitActivityEncoder().encode(execution, ride());
        List<Mesg> messages = decode(bytes);

        assertThat(new Decode().checkFileIntegrity(new ByteArrayInputStream(bytes))).isTrue();
        assertThat(messages.get(0)).isInstanceOf(FileIdMesg.class);
        assertThat(((FileIdMesg) messages.get(0)).getType()).isEqualTo(File.ACTIVITY);
        assertThat(messages.get(messages.size() - 1)).isInstanceOf(ActivityMesg.class);

        List<RecordMesg> records = messages.stream().filter(RecordMesg.class::isInstance).map(RecordMesg.class::cast).toList();
        assertThat(records).hasSize(120);
        assertThat(records.get(0).getPower()).isEqualTo(150);
        assertThat(records.get(0).getHeartRate()).isEqualTo((short) 120);
        assertThat(records.get(0).getSpeed()).isEqualTo(10.0f);
        assertThat(records.get(119).getDistance()).isGreaterThan(1180f);

        List<LapMesg> laps = messages.stream().filter(LapMesg.class::isInstance).map(LapMesg.class::cast).toList();
        assertThat(laps).hasSize(2);
        assertThat(laps.get(0).getAvgPower()).isEqualTo(150);
        assertThat(laps.get(1).getAvgPower()).isEqualTo(250);
        assertThat(laps.get(1).getMaxHeartRate()).isEqualTo((short) 150);

        SessionMesg session = messages.stream().filter(SessionMesg.class::isInstance).map(SessionMesg.class::cast).findFirst().orElseThrow();
        assertThat(session.getSport()).isEqualTo(Sport.CYCLING);
        assertThat(session.getSubSport()).isEqualTo(SubSport.INDOOR_CYCLING);
        assertThat(session.getAvgPower()).isEqualTo(200);
        assertThat(session.getNumLaps()).isEqualTo(2);
        assertThat(session.getTotalTimerTime()).isEqualTo(120f);
    }

    @Test
    void omitsMissingSensorFieldsInsteadOfWritingZeros() {
        WorkoutExecution execution = WorkoutExecution.builder().id(UUID.randomUUID()).workoutNameSnapshot("Bez tętna").build();
        List<RideSample> samples = List.of(
                RideSample.builder().at(START).elapsedMs(0).stepIndex(0).powerWatts(200).build(),
                RideSample.builder().at(START.plusSeconds(1)).elapsedMs(1000).stepIndex(0).powerWatts(210).build());

        List<RecordMesg> records = decode(new FitActivityEncoder().encode(execution, samples)).stream()
                .filter(RecordMesg.class::isInstance).map(RecordMesg.class::cast).toList();

        assertThat(records).extracting(RecordMesg::getHeartRate).containsOnlyNulls();
        assertThat(records).extracting(RecordMesg::getPower).containsExactly(200, 210);
    }
}
