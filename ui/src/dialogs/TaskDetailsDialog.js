import React from "react";
import ArticleIcon from "@mui/icons-material/Article";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import LogViewerDialog from "../logs/LogViewerDialog";
import TaskShellDialog from "../shell/TaskShellDialog";
import FrameworkDetailsDialog from "./FrameworkDetailsDialog";
import AgentDetailsDialog from "./AgentDetailsDialog";
import SandboxDialog from "./SandboxDialog";
import { agentHttpEndpoint, latestTaskContainerId } from "../logs/logApi";
import { StateBadge } from "../libs/functions";
import { useAuth } from "../auth/AuthContext";
import { PAGE_SIZE, PaginationControls, pageCountFor } from "../components/PaginationControls";
import {
  formatTaskResource,
  formatTaskTimestamp,
  normalizeTaskRoles,
  sortTaskStatuses,
  taskAdvancedDetails,
  agentHref,
  frameworkHref,
  taskHealth,
  taskHost,
  taskExecutorId,
  executorNameFromState,
  truncateExecutorName,
} from "./taskDetails";

const EMPTY = "—";

function DetailField({ label, children, mono = false }) {
  return (
    <Box>
      <Typography color="text.secondary" variant="caption">{label}</Typography>
      <Typography
        component="div"
        fontFamily={mono ? "monospace" : "inherit"}
        fontWeight={500}
        sx={{ mt: 0.25, overflowWrap: "anywhere" }}
      >
        {children || EMPTY}
      </Typography>
    </Box>
  );
}

function ResourceTile({ label, allocated, limit }) {
  return (
    <Paper variant="outlined" sx={{ height: "100%", p: 2 }}>
      <Typography color="text.secondary" variant="caption">{label}</Typography>
      <Typography variant="h6" fontWeight={700}>{allocated}</Typography>
      {limit !== EMPTY && <Typography color="text.secondary" variant="body2">Limit {limit}</Typography>}
    </Paper>
  );
}

export default function TaskDetailsDialog({ open, task, onClose }) {
  const { request } = useAuth();
  const [logsOpen, setLogsOpen] = React.useState(false);
  const [shellOpen, setShellOpen] = React.useState(false);
  const [relatedFramework, setRelatedFramework] = React.useState(null);
  const [relatedAgent, setRelatedAgent] = React.useState(null);
  const [sandboxOpen, setSandboxOpen] = React.useState(false);
  const [executorName, setExecutorName] = React.useState(null);
  const [statusPage, setStatusPage] = React.useState(1);

  const statuses = sortTaskStatuses(task?.statuses);
  const advanced = taskAdvancedDetails(task);
  const latestState = task?.state || statuses.at(-1)?.state || EMPTY;
  const statusPageCount = pageCountFor(statuses.length);
  const pagedStatuses = statuses.slice((statusPage - 1) * PAGE_SIZE, statusPage * PAGE_SIZE);

  React.useEffect(() => setStatusPage((current) => Math.min(current, statusPageCount)), [statusPageCount]);

  const canReadLogs = Boolean(task?._agent && latestTaskContainerId(task));
  const canOpenShell = canReadLogs && Boolean(task?._agent?.hostname && task?._agent?.port);

  React.useEffect(() => {
    if (!open || !task || !task._agent) {
      setExecutorName(null);
      return undefined;
    }

    const endpoint = agentHttpEndpoint(task._agent, "/state");
    if (!endpoint) {
      setExecutorName(null);
      return undefined;
    }

    let active = true;
    request(endpoint)
      .then((state) => {
        if (active) setExecutorName(executorNameFromState(task, state));
      })
      .catch(() => {
        if (active) setExecutorName(null);
      });

    return () => { active = false; };
  }, [open, request, task]);

  const openFramework = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      const data = await request("/frameworks?order=dsc&limit=-1");
      const frameworks = [...(data?.frameworks || []), ...(data?.completed_frameworks || [])];
      setRelatedFramework(frameworks.find((framework) => String(framework.id) === String(task.framework_id)) || null);
    } catch (_) {
      setRelatedFramework(null);
    }
  };

  const openAgent = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (task._agent) {
      setRelatedAgent(task._agent);
      return;
    }
    try {
      const data = await request("/slaves");
      setRelatedAgent((data?.slaves || []).find((agent) => String(agent.id) === String(task.slave_id)) || null);
    } catch (_) {
      setRelatedAgent(null);
    }
  };

  return (
    <>
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" scroll="paper">
      <DialogTitle sx={{ pr: 7 }}>
        <Typography variant="overline" color="primary.light">Task details</Typography>
        <Typography variant="h5" fontWeight={700} sx={{ overflowWrap: "anywhere" }}>
          {task?.name || task?.id || "Task"}
        </Typography>
        <IconButton aria-label="Close task details" onClick={onClose} sx={{ position: "absolute", right: 12, top: 16 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {!task ? (
          <Typography color="text.secondary">No task details available.</Typography>
        ) : (
          <Stack spacing={3}>
            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>Overview</Typography>
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6} md={3}><DetailField label="State"><StateBadge state={latestState === EMPTY ? null : latestState} /></DetailField></Grid>
                <Grid item xs={12} sm={6} md={3}><DetailField label="Health">{taskHealth(task)}</DetailField></Grid>
                <Grid item xs={12} sm={6} md={3}><DetailField label="Role">{normalizeTaskRoles(task.role)}</DetailField></Grid>
                <Grid item xs={12} sm={6} md={3}><DetailField label="Statuses">{statuses.length}</DetailField></Grid>
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>Identifiers</Typography>
              <Grid container spacing={2.5}>
                <Grid item xs={12}><DetailField label="Task ID" mono>{task.id}</DetailField></Grid>
                <Grid item xs={12} md={3}><DetailField label="Framework ID" mono>{frameworkHref(task.framework_id) ? <Link href={frameworkHref(task.framework_id)} onClick={openFramework}>{task.framework_id}</Link> : EMPTY}</DetailField></Grid>
                <Grid item xs={12} md={3}><DetailField label="Agent ID" mono>{agentHref(task.slave_id) ? <Link href={agentHref(task.slave_id)} onClick={openAgent}>{task.slave_id}</Link> : EMPTY}</DetailField></Grid>
                <Grid item xs={12} md={3}><DetailField label="Host">{taskHost(task)}</DetailField></Grid>
                <Grid item xs={12} md={3}><DetailField label="Executor ID" mono>{taskExecutorId(task)}</DetailField></Grid>
                <Grid item xs={12} md={3}>
                  <DetailField label="Executor Name" mono>
                    {executorName ? (
                      <Tooltip title={executorName}>
                        <Box component="span" sx={{ cursor: "help" }}>{truncateExecutorName(executorName)}</Box>
                      </Tooltip>
                    ) : EMPTY}
                  </DetailField>
                </Grid>
                <Grid item xs={12} md={3}><DetailField label="Container Type">{task?.container?.type || EMPTY}</DetailField></Grid>
                <Grid item xs={12}>
                  <Button startIcon={<ArticleIcon />} variant="outlined" disabled={!canReadLogs} onClick={() => setLogsOpen(true)}>
                    View task logs
                  </Button>
                  <Button startIcon={<ArticleIcon />} variant="outlined" disabled={!canOpenShell} onClick={() => setShellOpen(true)}>
                    Open task shell
                  </Button>
                  <Button startIcon={<ArticleIcon />} variant="outlined" disabled={!task?._agent} onClick={() => setSandboxOpen(true)}>
                    Open sandbox
                  </Button>
                  {!canReadLogs && <Typography color="text.secondary" variant="caption" sx={{ ml: 1 }}>No active container log is available.</Typography>}
                </Grid>
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>Resources & limits</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}><ResourceTile label="CPU" allocated={formatTaskResource("cpus", task.resources?.cpus)} limit={formatTaskResource("cpus", task.limits?.cpus)} /></Grid>
                <Grid item xs={6} md={3}><ResourceTile label="Memory" allocated={formatTaskResource("mem", task.resources?.mem)} limit={formatTaskResource("mem", task.limits?.mem)} /></Grid>
                <Grid item xs={6} md={3}><ResourceTile label="Disk" allocated={formatTaskResource("disk", task.resources?.disk)} limit={EMPTY} /></Grid>
                <Grid item xs={6} md={3}><ResourceTile label="GPUs" allocated={formatTaskResource("gpus", task.resources?.gpus)} limit={EMPTY} /></Grid>
                <Grid item xs={12}><DetailField label="Ports" mono>{formatTaskResource("ports", task.resources?.ports)}</DetailField></Grid>
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>Status history</Typography>
              {statuses.length ? (
                <Paper variant="outlined" sx={{ overflowX: "auto" }}>
                  <Table size="small" aria-label="Task status history">
                    <TableHead><TableRow><TableCell>Time</TableCell><TableCell>State</TableCell><TableCell>Health</TableCell><TableCell>Message</TableCell></TableRow></TableHead>
                    <TableBody>
                      {pagedStatuses.map((status, index) => (
                        <TableRow key={`${status.timestamp || "unknown"}-${index}`}>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>{formatTaskTimestamp(status.timestamp)}</TableCell>
                          <TableCell>{status.state?.replace("TASK_", "") || EMPTY}</TableCell>
                          <TableCell>{status.healthy === true ? "Healthy" : status.healthy === false ? "Unhealthy" : EMPTY}</TableCell>
                          <TableCell sx={{ minWidth: 180 }}>{status.message || EMPTY}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <PaginationControls page={statusPage} pageCount={statusPageCount} onPageChange={setStatusPage} />
                </Paper>
              ) : <Typography color="text.secondary">No status history available.</Typography>}
            </Box>

            <Box component="details" className="advanced-details">
              <Box component="summary">Advanced container data</Box>
              <Box component="pre">{JSON.stringify(advanced, null, 2)}</Box>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
    <LogViewerDialog
      open={logsOpen}
      onClose={() => setLogsOpen(false)}
      kind="task"
      title={`${task?.name || task?.id || "Task"} logs`}
      agent={task?._agent}
      task={task}
    />
    <TaskShellDialog open={shellOpen} task={task} onClose={() => setShellOpen(false)} />
    <FrameworkDetailsDialog open={Boolean(relatedFramework)} framework={relatedFramework} onClose={() => setRelatedFramework(null)} />
    <AgentDetailsDialog open={Boolean(relatedAgent)} agent={relatedAgent} onClose={() => setRelatedAgent(null)} />
    <SandboxDialog open={sandboxOpen} task={task} agent={task?._agent} onClose={() => setSandboxOpen(false)} />

    </>
  );
}
