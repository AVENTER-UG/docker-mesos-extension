import { Box } from '@mui/material';
import { useState, useEffect } from 'react';

export default function Data(props: DataProps) {
  const [tasks, setTasks] = useState(false);
  const [isLoading, setIsLoading] = useState(true);  

  // Function to get Apache Mesos Tasks
  const getMesosTasks = async () => {
    const response = await fetch("http://localhost:5050/tasks?order=asc&limit=-1")
      .then((response) => response.json())
      .then((data) => { 
        setIsLoading(false);
        setTasks(data);
      });

  };  

  useEffect(() => {
    getMesosTasks();
  }, []);  

  if (isLoading) {
    return <div>Loading...</div>;
  }  

  return (
    <Box style={{ textAlign: 'center', marginBottom: '20px' }}>
      <Box>
<div className="app">
        {tasks.tasks[0].id}
</div>    
      </Box>
    </Box>
  );
}
