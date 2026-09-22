import { useCallback, useEffect, useState } from "react";
import ArticleIcon from "@mui/icons-material/Article";
import { Alert, Box, Button, CircularProgress, Grid, Paper, Stack, Typography } from "@mui/material";
import { useAuth } from "./auth/AuthContext";
import LogViewerDialog from "./logs/LogViewerDialog";
import MasterDetailsDialog from "./dialogs/MasterDetailsDialog";
import { formatClusterInfo } from "./masterUtils";
import { UTILIZATION_TYPES, utilizationColor } from "./utilization";

export default function ClusterInfo() {
  const [loading, setLoading] = useState(false);
  const [stateData, setStateData] = useState(null);
  const [error, setError] = useState("");
  const [logsOpen, setLogsOpen] = useState(false);
  const [clusterInfo, setClusterInfo] = useState(null);
  const [metrics, setMetrics] = useState({});
  const [selectedMaster, setSelectedMaster] = useState(null);
  const { request } = useAuth();

  const getMesosState = useCallback(async () => {
    setLoading(true);
    try {
      const [data, metricData] = await Promise.all([request("/state"), request("/metrics/snapshot")]);
      setStateData(data);
      setMetrics(metricData || {});
      setError("");

      // Format the cluster information for better display
      const formattedInfo = formatClusterInfo(data);
      setClusterInfo(formattedInfo);
    } catch (stateError) {
      setError(stateError.message || "Manager details could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    getMesosState();
    const timer = window.setInterval(getMesosState, 5000);
    return () => window.clearInterval(timer);
  }, [getMesosState]);

  useEffect(() => {
    if (!clusterInfo?.masters) return;
    setSelectedMaster((current) => {
      if (!current) return current;
      const refreshedMaster = clusterInfo.masters.find((master) => String(master.id) === String(current.id));
      return refreshedMaster
        ? { ...refreshedMaster, isLeader: clusterInfo.currentLeaderId === refreshedMaster.id }
        : current;
    });
  }, [clusterInfo]);

  return (
    <>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Manager details</Typography>
            <Typography color="text.secondary">ClusterD Manager information and logs</Typography>
          </Box>
          <Button startIcon={<ArticleIcon />} variant="contained" onClick={() => setLogsOpen(true)}>View Manager log</Button>
        </Stack>
        {error && <Alert severity="error">{error}</Alert>}
        {loading && !stateData ? (
          <Box className="centered"><CircularProgress /></Box>
        ) : stateData && clusterInfo && (
          <Paper className="table-card" elevation={0} sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" fontWeight={700} gutterBottom>Leader Live utilization</Typography>
                <Grid container spacing={1.5}>
                  {UTILIZATION_TYPES.map(({ name, label }) => {
                    const value = Number(metrics[`master/${name}_utilization`]);
                    const valid = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : null;
                    return <Grid item xs={6} sm={4} md={2.4} key={name}>
                      <Paper variant="outlined" sx={{ p: 1.5, textAlign: "center", borderTop: 5, borderColor: utilizationColor(valid) }}>
                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                        <Typography variant="h6" fontWeight={700}>{valid === null ? "—" : `${valid.toFixed(1)}%`}</Typography>
                      </Paper>
                    </Grid>;
                  })}
                </Grid>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography color="text.secondary" variant="caption">Server</Typography>
                <Typography fontWeight={600}>{stateData.hostname || "—"}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography color="text.secondary" variant="caption">Status</Typography>
                <Typography fontWeight={600}>
                  {clusterInfo.isLeader ? (
                    <span style={{ color: '#4caf50' }}>Leader</span>
                  ) : (
                    <span style={{ color: '#ff9800' }}>Follower</span>
                  )}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography color="text.secondary" variant="caption">Version</Typography>
                <Typography fontWeight={600}>ClusterD {stateData.version || "—"}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography color="text.secondary" variant="caption">Cluster</Typography>
                <Typography fontWeight={600}>{clusterInfo.cluster || "—"}</Typography>
              </Grid>
              {clusterInfo.masterCount > 0 && (
                <Grid item xs={12}>
                  <Typography color="text.secondary" variant="caption">Manager Servers ({clusterInfo.masterCount})</Typography>
                  <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>Click a manager to view its details.</Typography>
                  <Box sx={{ mt: 1 }}>
                    {clusterInfo.masters.map((master) => (
                      <Paper
                        key={master.id || master.hostname}
                        elevation={0}
                        onClick={() => setSelectedMaster({ ...master, isLeader: clusterInfo.currentLeaderId === master.id })}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedMaster({ ...master, isLeader: clusterInfo.currentLeaderId === master.id });
                          }
                        }}
                        sx={{
                          p: 2,
                          mb: 1,
                          backgroundColor: "background.default",
                          border: 1,
                          borderColor: "divider",
                          cursor: "pointer",
                          transition: "background-color 120ms ease, border-color 120ms ease, box-shadow 120ms ease",
                          "&:hover": { backgroundColor: "action.hover", borderColor: "primary.main", boxShadow: 2 },
                          "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 },
                        }}
                      >
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6} md={4}>
                            <Typography color="text.secondary" variant="caption">ID</Typography>
                            <Typography fontWeight={600} fontSize="small">
                              {master.id || "—" }
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <Typography color="text.secondary" variant="caption">Hostname</Typography>
                            <Typography fontWeight={600} fontSize="small">
                              {master.hostname || "—" }
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={4}>
                            <Typography color="text.secondary" variant="caption">Status</Typography>
                            <Typography fontWeight={600} fontSize="small">
                              {clusterInfo.currentLeaderId === master.id ? (
                                <span style={{ color: '#4caf50' }}>Leader</span>
                              ) : (
                                <span style={{ color: '#ff9800' }}>Follower</span>
                              )}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography color="text.secondary" variant="caption">PID/StartTime</Typography>
                            <Typography fontWeight={600} fontSize="small">
                              {master.pid || "—"} / {master.start_time ? new Date(master.start_time * 1000).toLocaleString() : "—"}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        )}
      </Stack>
      <LogViewerDialog open={logsOpen} onClose={() => setLogsOpen(false)} kind="master" title="ClusterD Manager log" />
      <MasterDetailsDialog open={Boolean(selectedMaster)} master={selectedMaster} onClose={() => setSelectedMaster(null)} />
    </>
  );
}