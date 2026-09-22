import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Grid,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { masterHttpEndpoint } from "../masterUtils";
import { normalizeMetricsResponse } from "../utilization";
import { UTILIZATION_TYPES, utilizationColor } from "../utilization";

export default function MasterDetailsDialog({ open, master, onClose }) {
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({});
  const [error, setError] = useState("");
  const metricsMasterRef = useRef(null);
  const { request } = useAuth();


  // Get metrics for a specific master server
  const fetchMasterMetrics = useCallback(async () => {
    const masterId = master?.id || master?.hostname;
    const firstSnapshotForMaster = metricsMasterRef.current !== masterId;
    if (firstSnapshotForMaster) {
      metricsMasterRef.current = masterId;
      setLoading(true);
    }
    setError("");
    
    try {
      const endpoint = masterHttpEndpoint(master);
      if (!endpoint) throw new Error("Manager metrics endpoint is unavailable");
      const metricData = await request(endpoint);
      setMetrics(normalizeMetricsResponse(metricData));
    } catch (err) {
      setError(err.message || `Failed to fetch metrics for manager ${master.id}`);
      console.error("Master metrics error:", err);
    } finally {
      if (firstSnapshotForMaster) setLoading(false);
    }
  }, [master, request]);

  useEffect(() => {
    if (open && master) {
      fetchMasterMetrics();
      const timer = window.setInterval(fetchMasterMetrics, 5000);
      return () => window.clearInterval(timer);
    }
    return undefined;
  }, [open, master, fetchMasterMetrics]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl" scroll="paper">
      <DialogTitle sx={{ pr: 7 }}>
        <Typography variant="overline" color="primary.light">Manager details</Typography>
        <Typography variant="h5" fontWeight={700} sx={{ overflowWrap: "anywhere" }}>
          {master?.hostname || master?.id || "Manager"}
        </Typography>
        <IconButton aria-label="Close manager details" onClick={onClose} sx={{ position: "absolute", right: 12, top: 16 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error">{error}</Alert>}
        
        {master ? (
          <Stack spacing={3}>
            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>Overview</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography color="text.secondary">ID</Typography>
                    <Typography fontWeight={600}>{master.id || "—"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography color="text.secondary">Hostname</Typography>
                    <Typography fontWeight={600}>{master.hostname || "—"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography color="text.secondary">Status</Typography>
                    <Typography fontWeight={600}>
                      {master.isLeader ? (
                        <span style={{ color: '#4caf50' }}>Leader</span>
                      ) : (
                        <span style={{ color: '#ff9800' }}>Follower</span>
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography color="text.secondary">PID</Typography>
                    <Typography fontWeight={600}>{master.pid || "—"}</Typography>
                  </Grid>
                </Grid>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>Live utilization</Typography>
              {loading ? (
                <Box className="centered"><CircularProgress /></Box>
              ) : (
                <Grid container spacing={1.5}>
                  {UTILIZATION_TYPES.map(({ name, label }) => {
                    const value = Number(metrics[`master/${name}_utilization`]);
                    const valid = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : null;
                    return (
                      <Grid item xs={6} sm={4} md={2.4} key={name}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 1.5,
                            textAlign: "center",
                            borderTop: 5,
                            borderColor: utilizationColor(valid),
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">{label}</Typography>
                          <Typography variant="h6" fontWeight={700}>
                            {valid === null ? "—" : `${valid.toFixed(1)}%`}
                          </Typography>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Box>
          </Stack>
        ) : (
          <Box className="centered">
            <Typography>No manager details available</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
  );
}