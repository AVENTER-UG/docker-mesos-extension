import { Box } from '@mui/material';
import { useState, useEffect } from 'react';
import AgentsTable from './AgentsTable.js';

export default function Data(props: DataProps) {
  const [loading, setLoading] = useState(false);  
  const [agents, setAgents] = useState([]);

  // Function to get Apache Mesos Agents
  const getMesosAgents = async () => {
    setLoading(true);

    const response = await fetch("http://localhost:5050/slaves");
    const data = await response.json();
    setAgents(data.slaves);
    setLoading(false);
  };  

  useEffect(() => {
    getMesosAgents();
  }, []); 

  return (
    <Box style={{ textAlign: 'center', marginBottom: '20px' }}>
      <Box>
        <div className="tasks">
        {loading ? (<h4>Loading...</h4>) :
          <div>
            <p></p>
            <AgentsTable agents={agents}/>
          </div>
        }    
        </div>    
      </Box>
    </Box>
  );
}
