import { Box } from '@mui/material';
import { useState, useEffect } from 'react';

export default function Data(props: DataProps) {
  const [loading, setLoading] = useState(false);  
  const [home, setHome] = useState([]);

  const homeStyle = {
    marginTop: '1em',
    marginLeft: '1.75em',
    width: '90%',
    fontSize: '15px',
    textAlign: 'left'
  };


  return (
    <Box style={{ textAlign: 'center', marginBottom: '20px' }}>
      <Box>
        <div className="home" style={homeStyle}>
          <h4>Notice:</h4>
          'Mini Cluster' is a simple single agent Apache Mesos® installation. Like in every Apache Mesos® environment, 
          there have to be a framework to deploy workload on it. The goal of this 'Docker Extension' is, to give you 
          (the developer) a easy way to test and develop your own framework.
          <h4>How to deploy workload in Mini Cluster:</h4>
          There are plenty of frameworks to deploy workload on 'Mini Cluster'. As example we will use 'mesos-compose' 
          to deploy a simple container.
    
          <ul>
            <li>Checkout 'mesos-compose': <pre>git clone https://github.com/AVENTER-UG/mesos-compose.git</pre></li>
            <li>Run a Redis Database: <pre>docker run --rm --name minicluster-redis -d -p 6379:6379 redis</pre></li>
            <li>Run 'mesos-compose': 
                <pre>cd mesos-compose</pre>
                <pre>PORTRANGE_TO=31005 LOGLEVEL=debug go run . </pre></li>
            <li>Deploy workload: <pre>curl -k -X PUT http://user:password@localhost:10000/api/compose/v0/test --data-binary @docs/example/test-extension.yaml</pre></li>
            <li>Now we can check under "SHOW TASKS" in the UI if the container is running and which random network port it got.</li>
          </ul>
          
        </div>    
      </Box>
    </Box>
  );
}
