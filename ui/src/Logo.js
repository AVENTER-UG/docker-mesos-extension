import { Box, Typography } from '@mui/material';
import logo from './images/miniclusterlogo.png'

export interface LogoProps {
  onClick: () => void;
  clickable: boolean;
}

export default function Logo(props: LogoProps) {

  const logoContainer = {
    height: 40,
    marginBottom: '0.5em',
    marginTop: '1em',
    width: '100%',
    float: 'right',
    fontSize: '20px'
  };

  const logoImgStyle = {
    maxHeight: '40px',
    display: 'inline',
    verticalAlign: 'middle',
    paddingRight: '10px'
  }

  const logoTextStyle = {
    maxHeight: '40px',
    maxWidth: '100px',
  }


  const underTextStyle = {
    color: '#ccd1d1',
    fontSize: '13px',
  }

  return (
    <Box style={{ textAlign: 'left', marginBottom: '20px' }}>
      <Box style={logoContainer}>
        <img src={logo} style={logoImgStyle} alt="Mini Cluster Logo"/>Mini Cluster
      </Box>
      <div style={underTextStyle}> Mini Cluster is an easy way to test frameworks for Apache Mesos®.</div>
    </Box>
  );
}
