import { Box } from '@mui/material';

import { COMMON_COLORS, alphaColor } from '@/utils/colors';

interface Props {
  total: number;
  current: number;
  progress: number; // 0..100
}

export default function StoryProgressBar({ total, current, progress }: Props) {
  return (
    <Box sx={{ display: 'flex', gap: 0.5, px: 2, pt: 1.5, width: '100%' }}>
      {Array.from({ length: total }, (_, i) => (
        <Box
          key={i}
          sx={{
            flex: 1,
            height: 3,
            borderRadius: 1.5,
            bgcolor: alphaColor(COMMON_COLORS.white, 0.3),
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              height: '100%',
              borderRadius: 1.5,
              bgcolor: COMMON_COLORS.white,
              width: `${i < current ? 100 : i === current ? progress : 0}%`,
              transition: i === current ? 'width 0.1s linear' : 'none',
            }}
          />
        </Box>
      ))}
    </Box>
  );
}
