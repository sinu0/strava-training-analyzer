import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import DataObjectOutlinedIcon from '@mui/icons-material/DataObjectOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ScaleOutlinedIcon from '@mui/icons-material/ScaleOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { List, ListItemButton, ListItemIcon, ListItemText, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import PageContainer from '@/components/common/PageContainer';

const items = [
  { label: 'Pełna pogoda', description: 'Prognoza, lokalizacje i ustawienia', path: '/weather', icon: <CloudOutlinedIcon /> },
  { label: 'Profil i strefy', description: 'FTP, tętno i ustawienia sportowe', path: '/profile', icon: <PersonOutlineIcon /> },
  { label: 'Zdrowie', description: 'Ręczny check-in i dostępność danych', path: '/health', icon: <MonitorHeartOutlinedIcon /> },
  { label: 'Masa ciała', description: 'Historia oraz cel masy', path: '/weight', icon: <ScaleOutlinedIcon /> },
  { label: 'Dane i zadania', description: 'Synchronizacja, przeliczenia i diagnostyka', path: '/admin', icon: <DataObjectOutlinedIcon /> },
  { label: 'Ustawienia', description: 'Integracje i konfiguracja aplikacji', path: '/admin', icon: <SettingsOutlinedIcon /> },
];

export default function MorePage() {
  const navigate = useNavigate();
  return (
    <PageContainer title="Więcej" subtitle="Profil, pogoda, zdrowie, integracje i jakość danych." maxWidth="md">
      <Paper sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <List disablePadding>
          {items.map((item) => (
            <ListItemButton key={`${item.path}-${item.label}`} onClick={() => navigate(item.path)} divider>
              <ListItemIcon sx={{ color: 'primary.main' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} secondary={item.description} />
            </ListItemButton>
          ))}
        </List>
      </Paper>
    </PageContainer>
  );
}
