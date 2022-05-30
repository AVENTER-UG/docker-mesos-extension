import { Box } from '@mui/material';
import { useState, useEffect } from 'react';

export default function ClusterInfo() {
  const [loading, setLoading] = useState(false);  
  const [state, setState] = useState([]);
  const [stateData, setStateData] = useState([]);

  var data;

  // Function to get Apache Mesos Tasks
  const getMesosState = async () => {
    setLoading(true);

    const response = await fetch("http://localhost:5050/state");
    const data = await response.json();
    setStateData(data);
    console.log(data);
    setLoading(false);
  };  

  useEffect(() => {
    getMesosState();
  }, []); 

  return (
    <Box style={{ textAlign: 'left', marginBottom: '20px' }}>
      {loading ? (<h4>Loading...</h4>) :
        <div>
          <Box><b>Server:</b> {stateData.hostname}</Box>
          <Box><b>Leader:</b> {stateData.leader}</Box>
          <Box><b>Version:</b> {stateData.version}</Box>
        </div>
      }    
    </Box>
  );
}
