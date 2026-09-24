import { expect, test } from '../fixtures';

/**
 * E2E tests for activity lap cards with elevation data.
 * Runs against the base URL selected by the active Playwright configuration.
 */

const ID = 'e2e-test';

const LAPS = [
  {lapIndex:0,name:'Lap 1',startIndex:0,endIndex:19,distanceM:3000,elapsedTimeSec:300,movingTimeSec:300,avgSpeedMs:8.0,maxSpeedMs:10.5,avgHeartrate:128,maxHeartrate:135,avgPowerW:180,maxPowerW:250,avgCadence:70,totalElevationGain:30,normalizedPowerW:210,variabilityIndex:1.17,powerDropPct:null,intensityClass:'THRESHOLD'},
  {lapIndex:1,name:'Lap 2',startIndex:20,endIndex:39,distanceM:2500,elapsedTimeSec:280,movingTimeSec:280,avgSpeedMs:7.5,maxSpeedMs:9.0,avgHeartrate:145,maxHeartrate:160,avgPowerW:160,maxPowerW:220,avgCadence:68,totalElevationGain:15,normalizedPowerW:190,variabilityIndex:1.19,powerDropPct:11.1,intensityClass:'ENDURANCE'},
  {lapIndex:2,name:'Lap 3',startIndex:40,endIndex:59,distanceM:3500,elapsedTimeSec:340,movingTimeSec:340,avgSpeedMs:8.5,maxSpeedMs:11.0,avgHeartrate:155,maxHeartrate:170,avgPowerW:200,maxPowerW:280,avgCadence:72,totalElevationGain:25,normalizedPowerW:230,variabilityIndex:1.15,powerDropPct:-25.0,intensityClass:'VO2'},
];

const MOCK = {
  id:ID,externalId:'999',source:'strava',sportType:'cycling',name:'Test Ride',
  description:'',startedAt:'2026-05-01T12:00:00Z',elapsedTimeSec:920,movingTimeSec:920,
  distanceM:9000,elevationGainM:70,elevationLossM:55,avgSpeedMs:8.0,maxSpeedMs:11.0,
  avgHeartrate:140,maxHeartrate:170,avgPowerW:180,maxPowerW:280,avgCadence:70,maxCadence:90,
  calories:450,avgTempC:18,summaryPolyline:null,photoUrls:[],
  powerStream: Array.from({length:60},(_,i)=>100+i*5),
  heartrateStream: Array.from({length:60},(_,i)=>120+i),
  altitudeStream: Array.from({length:60},(_,i)=>280+i),
  timeStream: Array.from({length:60},(_,i)=>i),
  velocityStream: Array.from({length:60},(_,i)=>7+i*0.1),
  latStream:null,lngStream:null,distanceStream:null,cadenceStream:null,
  metrics:[],createdAt:'2026-05-01T12:00:00Z',updatedAt:'2026-05-01T12:00:00Z',
};

test.describe('Activity lap charts e2e', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/\/api\/v2\/activities\/e2e-test(?:\?.*)?$/, (route) => route.fulfill({ json: MOCK }));
    await page.route(/\/api\/v2\/activities\/e2e-test\/laps(?:\?.*)?$/, (route) => route.fulfill({ json: LAPS }));
    await page.route(/\/api\/v2\/activities\/e2e-test\/streams(?:\?.*)?$/, (route) => route.fulfill({
      json: {
        series: ['power', 'heartrate', 'altitude', 'velocity', 'time'],
        originalPoints: 60,
        returnedPoints: 60,
        resolution: '1000',
        power: MOCK.powerStream,
        heartrate: MOCK.heartrateStream,
        altitude: MOCK.altitudeStream,
        velocity: MOCK.velocityStream,
        time: MOCK.timeStream,
      },
    }));
    await page.route(/\/api\/v2\/matched-rides\/activity\/e2e-test(?:\?.*)?$/, (route) => route.fulfill({ status: 204 }));
    await page.goto(`/activities/${ID}`, { waitUntil: 'networkidle' });
  });

  test('laps tab shows intensity classification badges and best-power markers', async ({ page }) => {
    await page.getByRole('tab', { name: 'Okrążenia' }).click();

    // 3 laps
    await expect(page.getByText(/3 okrążenia/)).toBeVisible({ timeout: 5000 });

    // Intensity chips
    await expect(page.getByText('VO2max', { exact: true })).toBeAttached({ timeout: 5000 });
    await expect(page.getByText('Próg', { exact: true })).toBeAttached({ timeout: 5000 });

    // Best-power markers
    await expect(page.getByText('Najmoc')).toBeAttached({ timeout: 5000 });
  });

  test('lap cards are rendered with correct structure', async ({ page }) => {
    await page.getByRole('tab', { name: 'Okrążenia' }).click();

    // Each lap card should have an expand button (ExpandMoreIcon)
    await expect(page.locator('[data-testid="ExpandMoreIcon"]').first()).toBeAttached({ timeout: 5000 });
  });
});
