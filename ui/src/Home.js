import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useAuth } from "./auth/AuthContext";
import { deriveDashboard, formatDashboardResource, aggregateAgentUtilization } from "./dashboard";
import { agentHttpEndpoint } from "./logs/logApi";
import { UTILIZATION_TYPES, normalizeMetricsResponse, utilizationColor } from "./utilization";

function CountCard({ label, value, detail, tone = "primary", route }) {
  return (
    <Card className="metric-card">
      <CardActionArea component="a" href={route} aria-label={`Open ${label}`}>
        <CardContent>
        <Typography color="text.secondary" variant="body2">{label}</Typography>
        <Typography color={`${tone}.main`} variant="h3" fontWeight={700}>{value}</Typography>
        <Typography color="text.secondary" variant="caption">{detail}</Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function ResourceCard({ label, resource }) {
  return (
    <Card className="resource-card">
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
          <Typography fontWeight={700}>{label}</Typography>
          <Typography color="primary" fontWeight={700}>{resource.percent.toFixed(1)}%</Typography>
        </Stack>
        <LinearProgress variant="determinate" value={resource.percent} sx={{ my: 2, height: 8, borderRadius: 4 }} />
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2">Used {formatDashboardResource(resource.used, label)}</Typography>
          <Typography color="text.secondary" variant="body2">Total {formatDashboardResource(resource.total, label)}</Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

function UtilizationHeatmap({ values }) {
  return (
    <Box>
      <Typography className="section-title" variant="h6">Live agent utilization heatmap</Typography>
      <Grid container spacing={1.5}>
        {UTILIZATION_TYPES.map(({ name, label }) => {
          const value = values[name];
          return <Grid item xs={6} sm={4} md={2.4} key={name}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: "center", borderTop: 6, borderColor: utilizationColor(value) }}>
              <Typography color="text.secondary" variant="caption">{label}</Typography>
              <Typography variant="h4" fontWeight={700}>{value === null ? "—" : `${value.toFixed(1)}%`}</Typography>
            </Paper>
          </Grid>;
        })}
      </Grid>
    </Box>
  );
}

function MiniClusterGuide() {
  return (
    <Paper className="table-card" elevation={0} sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Box>
          <Typography className="section-title" variant="h6">Mini Cluster</Typography>
          <Typography color="text.secondary" variant="body2">
            How to deploy workload in the Apache Mesos® Mini Cluster
          </Typography>
        </Box>
        <Typography>
          <strong>Notice:</strong> &apos;Mini Cluster&apos; is a simple single agent Apache Mesos® installation. Like in every Apache Mesos® environment,
          there have to be a framework to deploy workload on it. The goal of this &apos;Docker Extension&apos; is, to give you
          (the developer) a easy way to test and develop your own framework.
        </Typography>
        <Typography>
          There are plenty of frameworks to deploy workload on &apos;Mini Cluster&apos;. As example we will use &apos;mesos-compose&apos;
          to deploy a simple container.
        </Typography>
        <Box component="ol" sx={{ pl: 3, my: 0 }}>
          <li><Typography>Checkout &apos;mesos-compose&apos;:</Typography><Box component="pre" sx={{ overflowX: "auto", mb: 1 }}>git clone https://github.com/AVENTER-UG/mesos-compose.git</Box></li>
          <li><Typography>Run a Redis Database:</Typography><Box component="pre" sx={{ overflowX: "auto", mb: 1 }}>docker run --rm --name minicluster-redis -d -p 6379:6379 redis</Box></li>
          <li>
            <Typography>Run &apos;mesos-compose&apos;:</Typography>
            <Box component="pre" sx={{ overflowX: "auto", mb: 1 }}>{`cd mesos-compose\nPORTRANGE_TO=31005 LOGLEVEL=debug go run .`}</Box>
          </li>
          <li><Typography>Deploy workload:</Typography><Box component="pre" sx={{ overflowX: "auto", mb: 1 }}>curl -k -X PUT http://user:password@localhost:10000/api/compose/v0/test --data-binary @docs/example/test-extension.yaml</Box></li>
          <li><Typography>Now we can check under &quot;SHOW TASKS&quot; in the UI if the container is running and which random network port it got.</Typography></li>
        </Box>
      </Stack>
    </Paper>
  );
}

function Dashboard() {
  const { request } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [summary, state, metrics, agentData] = await Promise.all([
        request("/master/state-summary"),
        request("/state").catch(() => ({})),
        request("/metrics/snapshot"),
        request("/slaves"),
      ]);
      const agentMetrics = await Promise.all((agentData?.slaves || []).map(async (agent) => {
        const endpoint = agentHttpEndpoint(agent, "/metrics/snapshot");
        if (!endpoint) return null;
        try { return normalizeMetricsResponse(await request(endpoint)); } catch (_) { return null; }
      }));
      setDashboard(deriveDashboard(summary, state, metrics, aggregateAgentUtilization(agentMetrics.filter(Boolean))));
      setUpdatedAt(new Date());
      setError("");
    } catch (refreshError) {
      setError(refreshError.message || "Dashboard data could not be loaded.");
    } finally {
      setRefreshing(false);
    }
  }, [request]);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  if (!dashboard && refreshing) return <Box className="centered"><CircularProgress /></Box>;
  if (!dashboard) return <Alert severity="error">{error}</Alert>;

  const { cluster, counts, resources, monitoring } = dashboard;
  return (
    <Stack spacing={3}>
      {error && <Alert severity="warning">Refresh failed: {error}. Showing the last successful snapshot.</Alert>}
      <Paper className="cluster-hero" elevation={0}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h4" fontWeight={700}>{cluster.name}</Typography>
              <Chip color={cluster.healthy ? "success" : "warning"} label={cluster.healthy ? "Leader elected" : "No elected leader"} size="small" />
            </Stack>
            <Typography color="text.secondary">{cluster.hostname} · Mesos {cluster.version}</Typography>
            <Typography color="text.secondary" variant="body2">Leader: {cluster.leader}</Typography>
          </Box>
          <Box textAlign={{ md: "right" }}>
            <Typography variant="h5" fontWeight={700}>{cluster.uptime}</Typography>
            <Typography color="text.secondary" variant="body2">Manager uptime</Typography>
            <Typography color="text.secondary" variant="caption">
              {refreshing ? "Refreshing…" : `Updated ${updatedAt?.toLocaleTimeString()}`}
            </Typography>
          </Box>
        </Stack>
      </Paper>
      <MiniClusterGuide />
      <UtilizationHeatmap values={dashboard.utilization} />

      <Box>
        <Typography className="section-title" variant="h6">Workloads</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}><CountCard label="Active agents" value={counts.agents} detail={`${counts.unreachableAgents} unreachable`} route="#/agents" /></Grid>
          <Grid item xs={6} md={3}><CountCard label="Active frameworks" value={counts.frameworks} detail={`${counts.connectedFrameworks} connected`} route="#/frameworks" /></Grid>
          <Grid item xs={6} md={3}><CountCard label="Running tasks" value={counts.runningTasks} detail={`${counts.pendingTasks} pending`} tone="success" route="#/tasks" /></Grid>
          <Grid item xs={6} md={3}><CountCard label="Failed tasks" value={counts.failedTasks} detail={`${counts.finishedTasks} finished`} tone={counts.failedTasks ? "error" : "success"} route="#/tasks" /></Grid>
        </Grid>
      </Box>

      <Box>
        <Typography className="section-title" variant="h6">Cluster capacity</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}><ResourceCard label="CPU" resource={resources.cpu} /></Grid>
          <Grid item xs={12} md={3}><ResourceCard label="Memory" resource={resources.memory} /></Grid>
          <Grid item xs={12} md={3}><ResourceCard label="Disk" resource={resources.disk} /></Grid>
          <Grid item xs={12} md={3}><ResourceCard label="GPUs" resource={resources.gpu} /></Grid>
        </Grid>
      </Box>

      <Box>
        <Typography className="section-title" variant="h6">Leader monitoring</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}><CountCard label="Queued messages" value={monitoring.queuedMessages} detail={`${monitoring.queuedHttpRequests} HTTP requests queued`} /></Grid>
          <Grid item xs={6} md={3}><CountCard label="Outstanding offers" value={monitoring.outstandingOffers} detail={`${monitoring.dispatches.toLocaleString()} dispatches`} /></Grid>
          <Grid item xs={6} md={3}><CountCard label="Allocator p95" value={`${monitoring.allocatorP95.toFixed(1)} ms`} detail="Allocation run latency" /></Grid>
          <Grid item xs={6} md={3}><CountCard label="System load" value={monitoring.load1m.toFixed(2)} detail={`5 min ${monitoring.load5m.toFixed(2)} · ${monitoring.droppedMessages} dropped messages`} /></Grid>
        </Grid>
      </Box>
    </Stack>
  );
}

export { AuthProvider, useAuth } from "./auth/AuthContext";

export default function Home() {
  return <Dashboard />;
}
