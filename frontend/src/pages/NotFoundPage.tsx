import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

/**
 * Friendly 404 page shown when a route is not found.
 */
export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        gap: 2,
        px: 3,
      }}
    >
      <Box
        component="img"
        src="/illustrations/error-404.png"
        alt=""
        sx={{ width: 200, height: 200, objectFit: 'contain', opacity: 0.9 }}
      />
      <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
        Strona nie znaleziona
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
        Wygląda na to, że ta trasa prowadzi donikąd. Sprawdź adres URL lub wróć na dashboard.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 1 }}>
        Wróć na dashboard
      </Button>
    </Box>
  );
}
