import { Box } from '@mui/material';
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet';

import type { WeatherLocation } from '@/types/analytics';

import 'leaflet/dist/leaflet.css';

interface WeatherStudioMapProps {
  selectedPoint: { lat: number; lon: number; label: string };
  locations: WeatherLocation[];
  onSelectPoint: (point: { lat: number; lon: number; label: string }) => void;
}

function ClickHandler({
  onSelectPoint,
}: {
  onSelectPoint: WeatherStudioMapProps['onSelectPoint'];
}) {
  useMapEvents({
    click(event) {
      const lat = Number(event.latlng.lat.toFixed(4));
      const lon = Number(event.latlng.lng.toFixed(4));
      onSelectPoint({
        lat,
        lon,
        label: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      });
    },
  });

  return null;
}

export default function WeatherStudioMap({
  selectedPoint,
  locations,
  onSelectPoint,
}: WeatherStudioMapProps) {
  return (
    <Box
      sx={{
        height: 360,
        overflow: 'hidden',
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <MapContainer
        center={[selectedPoint.lat, selectedPoint.lon]}
        zoom={9}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onSelectPoint={onSelectPoint} />
        {locations.map((location) => (
          <CircleMarker
            key={location.id}
            center={[location.latitude, location.longitude]}
            radius={location.active ? 8 : 6}
            pathOptions={{
              color: location.active ? '#FF6B35' : '#58A6FF',
              fillOpacity: 0.7,
            }}
            eventHandlers={{
              click: () => {
                onSelectPoint({
                  lat: location.latitude,
                  lon: location.longitude,
                  label: location.name,
                });
              },
            }}
          />
        ))}
        <CircleMarker
          center={[selectedPoint.lat, selectedPoint.lon]}
          radius={10}
          pathOptions={{
            color: '#4ECDC4',
            fillOpacity: 0.85,
          }}
        />
      </MapContainer>
    </Box>
  );
}
