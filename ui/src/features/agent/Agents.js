import { Box } from '@mui/material';
import { useCallback, useState, useEffect } from 'react';
import AgentsTable from './AgentsTable.js';
import { useAuth } from "../../auth/AuthContext";
import { attachTasksToAgents } from "../../dialogs/agentDetails";
import { agentHttpEndpoint } from "../../logs/logApi";
import { normalizeMetricsResponse } from "../../utilization";

export default function Data() {
  const [loading, setLoading] = useState(false);  
  const [agents, setAgents] = useState([]);
	const { request } = useAuth();

  // Function to get Apache Mesos Agents
  const getMesosAgents = useCallback(async () => {
    setLoading(true);

    const [agentData, frameworkData] = await Promise.all([
      request("/slaves"),
      request("/frameworks?order=dsc&limit=-1"),
    ]);
    const enriched = await Promise.all((agentData.slaves || []).map(async (agent) => {
      const endpoint = agentHttpEndpoint(agent, "/metrics/snapshot");
      if (!endpoint) return agent;
      try { return { ...agent, _metrics: normalizeMetricsResponse(await request(endpoint)) }; } catch (_) { return agent; }
    }));
    setAgents(attachTasksToAgents(enriched, frameworkData.frameworks));
    setLoading(false);
  }, [request]);

  useEffect(() => {
    getMesosAgents();
    const timer = window.setInterval(getMesosAgents, 5000);
    return () => window.clearInterval(timer);
  }, [getMesosAgents]);

  return (
    <Box style={{ textAlign: 'center', marginBottom: '20px' }}>
      <Box>
        <div className="tasks">
        {loading && agents.length === 0 ? (<h4>Loading...</h4>) :
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
