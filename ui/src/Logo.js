import { Box } from '@mui/material';
import logo from './images/miniclusterlogo.png'

export interface LogoProps {
  onClick: () => void;
  clickable: boolean;
}

export default function Logo(props: LogoProps) {

  const iconContainer = {
    height: 60,
    marginBottom: '3em',
    marginTop: '2em',
    width: '100%',
  };

  const logoStyle = {
    maxHeight: '100%',
    maxWidth: '100%'
  }
  return (
    <Box style={{ textAlign: 'center', marginBottom: '20px' }}>
      <Box style={iconContainer}>
        <img src={logo} style={logoStyle} />
      </Box>
    </Box>
  );
}
