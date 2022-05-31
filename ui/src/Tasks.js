import { Box } from '@mui/material';
import { useState, useEffect } from 'react';
import TasksTable from './TasksTable.js';

export default function Data(props: DataProps) {
  const [loading, setLoading] = useState(false);  
  const [tasks, setTasks] = useState([]);

  // Function to get Apache Mesos Tasks
  const getMesosTasks = async () => {
    setLoading(true);

    const response = await fetch("http://localhost:5050/tasks?order=dsc&limit=-1");
    const data = await response.json();
    setTasks(data.tasks);
    setLoading(false);
  };  

  useEffect(() => {
    getMesosTasks();
  }, []); 

  return (
    <Box style={{ textAlign: 'center', marginBottom: '20px' }}>
      <Box>
        <div className="tasks">
        {loading ? (<h4>Loading...</h4>) :
          <div>
            <p></p>
            <TasksTable tasks={tasks}/>
          </div>
        }    
        </div>    
      </Box>
    </Box>
  );
}
