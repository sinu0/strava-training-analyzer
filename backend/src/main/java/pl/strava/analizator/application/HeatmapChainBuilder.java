package pl.strava.analizator.application;

import org.springframework.stereotype.Component;
import pl.strava.analizator.domain.model.HeatmapPoint;
import pl.strava.analizator.domain.model.HeatmapSegment;

import java.util.*;

/**
 * Java port of the frontend chainSegments() function.
 * Merges heatmap grid segments into continuous polylines by tracing through degree-2 nodes.
 */
@Component
public class HeatmapChainBuilder {

    public record Chain(List<HeatmapPoint> path, int maxCount) {}

    public List<Chain> buildChains(List<HeatmapSegment> segments) {
        if (segments.isEmpty()) return List.of();

        Map<String, List<String[]>> adj = new HashMap<>();
        Map<String, HeatmapPoint> coordByKey = new HashMap<>();

        for (int i = 0; i < segments.size(); i++) {
            HeatmapSegment seg = segments.get(i);
            String keyA = endpointKey(seg.getLat1(), seg.getLon1());
            String keyB = endpointKey(seg.getLat2(), seg.getLon2());
            coordByKey.put(keyA, new HeatmapPoint(seg.getLat1(), seg.getLon1()));
            coordByKey.put(keyB, new HeatmapPoint(seg.getLat2(), seg.getLon2()));
            adj.computeIfAbsent(keyA, k -> new ArrayList<>()).add(new String[]{keyB, String.valueOf(i)});
            adj.computeIfAbsent(keyB, k -> new ArrayList<>()).add(new String[]{keyA, String.valueOf(i)});
        }

        boolean[] visited = new boolean[segments.size()];
        List<Chain> chains = new ArrayList<>();

        for (Map.Entry<String, List<String[]>> entry : adj.entrySet()) {
            if (entry.getValue().size() == 2) continue;
            for (String[] neighbor : entry.getValue()) {
                int segIdx = Integer.parseInt(neighbor[1]);
                if (visited[segIdx]) continue;
                chains.add(traceChain(entry.getKey(), segIdx, segments, adj, coordByKey, visited));
            }
        }

        for (int i = 0; i < segments.size(); i++) {
            if (visited[i]) continue;
            HeatmapSegment seg = segments.get(i);
            chains.add(traceChain(endpointKey(seg.getLat1(), seg.getLon1()), i, segments, adj, coordByKey, visited));
        }

        chains.sort(Comparator.comparingInt(Chain::maxCount));
        return chains;
    }

    private Chain traceChain(String startKey, int firstEdgeIdx,
                              List<HeatmapSegment> segments,
                              Map<String, List<String[]>> adj,
                              Map<String, HeatmapPoint> coordByKey,
                              boolean[] visited) {
        List<HeatmapPoint> path = new ArrayList<>();
        int maxCount = 0;
        String currentKey = startKey;
        int edgeIdx = firstEdgeIdx;
        path.add(coordByKey.get(currentKey));

        while (true) {
            visited[edgeIdx] = true;
            HeatmapSegment seg = segments.get(edgeIdx);
            maxCount = Math.max(maxCount, seg.getTraversalCount());

            String keyA = endpointKey(seg.getLat1(), seg.getLon1());
            String keyB = endpointKey(seg.getLat2(), seg.getLon2());
            String nextKey = currentKey.equals(keyA) ? keyB : keyA;
            path.add(coordByKey.get(nextKey));

            List<String[]> neighbors = adj.get(nextKey);
            if (neighbors == null || neighbors.size() != 2) break;

            String[] nextEdge = neighbors.stream()
                    .filter(n -> !visited[Integer.parseInt(n[1])])
                    .findFirst().orElse(null);
            if (nextEdge == null) break;

            currentKey = nextKey;
            edgeIdx = Integer.parseInt(nextEdge[1]);
        }
        return new Chain(path, maxCount);
    }

    private static String endpointKey(double lat, double lon) {
        return String.format("%.5f|%.5f", lat, lon);
    }
}
