import { Box } from '@mui/material';
import { useState, useEffect } from 'react';
import FrameworksTable from './FrameworksTable.js';

export default function Data(props: DataProps) {
  const [loading, setLoading] = useState(false);  
  const [frameworks, setFrameworks] = useState([]);

  // Function to get Apache Mesos Tasks
  const getMesosFrameworks = async () => {
    setLoading(true);

    const response = await fetch("http://localhost:5050/frameworks?order=dsc&limit=-1");
    const data = await response.json();
    setFrameworks(data.frameworks);
    console.log(data);
    setLoading(false);
  };  

  useEffect(() => {
    getMesosFrameworks();
  }, []); 

  return (
    <Box style={{ textAlign: 'center', marginBottom: '20px' }}>
      <Box>
        <div className="frameworks">
        {loading ? (<h4>Loading...</h4>) :
          <FrameworksTable frameworks={frameworks}/>
        }    
        </div>    
      </Box>
    </Box>
  );
}
