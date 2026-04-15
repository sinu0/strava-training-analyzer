export interface RouteWeatherStop {
  id: string;
  label: string;
  position: [number, number];
  progress: number;
}

function toCartesian([lat, lng]: [number, number], referenceLat: number) {
  const scale = Math.cos((referenceLat * Math.PI) / 180);
  return {
    x: lng * scale,
    y: lat,
  };
}

function distanceToSegment(
  point: [number, number],
  segmentStart: [number, number],
  segmentEnd: [number, number],
): number {
  const referenceLat = (point[0] + segmentStart[0] + segmentEnd[0]) / 3;
  const p = toCartesian(point, referenceLat);
  const a = toCartesian(segmentStart, referenceLat);
  const b = toCartesian(segmentEnd, referenceLat);
  const abX = b.x - a.x;
  const abY = b.y - a.y;
  const apX = p.x - a.x;
  const apY = p.y - a.y;
  const abLengthSq = abX * abX + abY * abY;

  if (abLengthSq === 0) {
    return Math.hypot(apX, apY);
  }

  const t = Math.max(0, Math.min(1, (apX * abX + apY * abY) / abLengthSq));
  const closestX = a.x + abX * t;
  const closestY = a.y + abY * t;
  return Math.hypot(p.x - closestX, p.y - closestY);
}

function findNearestSegmentIndex(
  positions: [number, number][],
  point: [number, number],
): number {
  let nearestSegmentIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < positions.length - 1; index += 1) {
    const segmentStart = positions[index];
    const segmentEnd = positions[index + 1];
    if (!segmentStart || !segmentEnd) {
      continue;
    }

    const distance = distanceToSegment(point, segmentStart, segmentEnd);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestSegmentIndex = index;
    }
  }

  return nearestSegmentIndex;
}

function buildWaypointRouteIndices(
  waypoints: [number, number][],
  routePositions: [number, number][],
): number[] {
  let searchStart = 0;

  return waypoints.map((waypoint) => {
    let nearestIndex = searchStart;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (let index = searchStart; index < routePositions.length; index += 1) {
      const routePoint = routePositions[index];
      if (!routePoint) {
        continue;
      }

      const distance = distanceToSegment(waypoint, routePoint, routePoint);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    }

    searchStart = nearestIndex;
    return nearestIndex;
  });
}

function buildEvenlySpacedIndexes(length: number, desiredCount: number): number[] {
  if (length <= 0 || desiredCount <= 0) {
    return [];
  }

  if (desiredCount === 1) {
    return [0];
  }

  const step = (length - 1) / (desiredCount - 1);
  const indexes = Array.from({ length: desiredCount }, (_, index) => Math.round(index * step));

  return Array.from(new Set(indexes)).sort((left, right) => left - right);
}

export function buildRouteWeatherStops(
  waypoints: [number, number][],
  polyline: [number, number][],
  maxStops = 4,
): RouteWeatherStop[] {
  const source = polyline.length >= 2 ? polyline : waypoints;
  if (source.length === 0) {
    return [];
  }

  const indexes = buildEvenlySpacedIndexes(source.length, Math.min(maxStops, source.length));
  const stops = indexes
    .map((sourceIndex, index) => {
      const position = source[sourceIndex];
      if (!position) {
        return null;
      }

      const progress = indexes.length === 1 ? 0 : index / (indexes.length - 1);
      const label =
        index === 0
          ? 'Start'
          : index === indexes.length - 1
            ? 'Meta'
            : `${Math.round(progress * 100)}%`;

      return {
        id: `${sourceIndex}-${label}`,
        label,
        position,
        progress,
      } satisfies RouteWeatherStop;
    })
    .filter((stop): stop is RouteWeatherStop => stop !== null);

  return stops.filter((stop, index, allStops) => {
    const key = `${stop.position[0].toFixed(5)}:${stop.position[1].toFixed(5)}`;
    return allStops.findIndex((candidate) =>
      `${candidate.position[0].toFixed(5)}:${candidate.position[1].toFixed(5)}` === key,
    ) === index;
  });
}

export function findRouteInsertionIndex(
  waypoints: [number, number][],
  polyline: [number, number][],
  clickedPoint: [number, number],
): number {
  if (waypoints.length < 2) {
    return Math.max(0, waypoints.length - 1);
  }

  const routePositions = polyline.length >= 2 ? polyline : waypoints;
  const nearestSegmentIndex = findNearestSegmentIndex(routePositions, clickedPoint);
  const waypointRouteIndices = buildWaypointRouteIndices(waypoints, routePositions);

  for (let index = 0; index < waypointRouteIndices.length - 1; index += 1) {
    const currentIndex = waypointRouteIndices[index];
    const nextIndex = waypointRouteIndices[index + 1];
    if (currentIndex == null || nextIndex == null) {
      continue;
    }

    if (nearestSegmentIndex >= currentIndex && nearestSegmentIndex < nextIndex) {
      return index;
    }
  }

  return waypoints.length - 2;
}
