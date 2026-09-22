import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useAuth } from "../auth/AuthContext";
import { latestTaskContainerId, readAgentLogTail, readMasterLogTail } from "./logApi";
import SyntaxHighlightedText from "../components/SyntaxHighlightedText";

function formatBytes(value) {
  const bytes = Math.max(0, Number(value) || 0);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
}

export default function LogViewerDialog({ open, onClose, kind, title, agent = null, task = null }) {
  const { request } = useAuth();
  const [streams, setStreams] = useState({});
  const [activeStream, setActiveStream] = useState("stdout");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const requestGeneration = useRef(0);
  const logElement = useRef(null);

  const containerId = useMemo(() => latestTaskContainerId(task), [task]);

  const loadLogs = useCallback(async () => {
    const generation = ++requestGeneration.current;
    setLoading(true);
    setError("");
    try {
      let result;
      if (kind === "master") {
        result = await readMasterLogTail(request);
      } else if (kind === "agent") {
        result = await readAgentLogTail(request, agent, "AGENT");
      } else if (kind === "task") {
        if (!containerId) throw new Error("No container ID is available for this task.");
        result = await readAgentLogTail(request, agent, "CONTAINER", containerId);
      } else {
        throw new Error("Unknown log source.");
      }
      if (generation !== requestGeneration.current) return;
      setStreams(result);
      setActiveStream((current) => result[current] ? current : "stdout");
      setUpdatedAt(new Date());
    } catch (loadError) {
      if (generation !== requestGeneration.current) return;
      setStreams({});
      setError(loadError.message || "Logs could not be loaded.");
    } finally {
      if (generation === requestGeneration.current) setLoading(false);
    }
  }, [agent, containerId, kind, request]);

  useEffect(() => {
    if (!open) {
      requestGeneration.current += 1;
      return undefined;
    }
    loadLogs();
    return undefined;
  }, [loadLogs, open]);

  useEffect(() => {
    if (!open || !autoRefresh) return undefined;
    const timer = window.setInterval(loadLogs, 5000);
    return () => window.clearInterval(timer);
  }, [autoRefresh, loadLogs, open]);

  useEffect(() => {
    if (logElement.current) logElement.current.scrollTop = logElement.current.scrollHeight;
  }, [activeStream, streams]);

  const streamNames = Object.keys(streams).filter((name) => streams[name]);
  const current = streams[activeStream];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl" scroll="paper">
      <DialogTitle sx={{ pr: 7 }}>
        <Typography variant="overline" color="primary.light">Logs</Typography>
        <Typography variant="h5" fontWeight={700} sx={{ overflowWrap: "anywhere" }}>{title || "ClusterD logs"}</Typography>
        <IconButton aria-label="Close log viewer" onClick={onClose} sx={{ position: "absolute", right: 12, top: 16 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1} sx={{ px: 2, py: 1, borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={activeStream} onChange={(_event, value) => setActiveStream(value)} aria-label="Log streams">
            {(streamNames.length ? streamNames : ["stdout"]).map((name) => <Tab key={name} value={name} label={kind === "master" || kind === "agent" ? "Log" : name} />)}
          </Tabs>
          <Stack direction="row" alignItems="center" spacing={1}>
            {updatedAt && <Typography color="text.secondary" variant="caption">Updated {updatedAt.toLocaleTimeString()}</Typography>}
            <FormControlLabel control={<Switch size="small" checked={autoRefresh} onChange={(event) => setAutoRefresh(event.target.checked)} />} label="Auto-refresh" />
            <Button startIcon={<RefreshIcon />} onClick={loadLogs} disabled={loading}>Refresh</Button>
          </Stack>
        </Stack>

        {error ? (
          <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
        ) : loading && !current ? (
          <Box className="centered" sx={{ minHeight: 360 }}><CircularProgress /></Box>
        ) : (
          <Box>
            <Typography color="text.secondary" variant="caption" component="div" sx={{ px: 2, py: 1 }}>
              {current ? `Showing from ${formatBytes(current.offset)} of ${formatBytes(current.size)} (last ${formatBytes(Math.max(current.size - current.offset, 0))})` : "No log data available."}
              {loading && " · Refreshing…"}
            </Typography>
            <Box
              ref={logElement}
              component="pre"
              aria-label={`${activeStream} log output`}
              sx={{ bgcolor: "#080b14", color: "#dce6f7", fontFamily: "monospace", fontSize: 13, lineHeight: 1.55, m: 0, minHeight: 420, maxHeight: "65vh", overflow: "auto", p: 2, tabSize: 4, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            >
              <SyntaxHighlightedText text={current?.data || "No log output."} language="log" showLineNumbers />
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
  );
}
