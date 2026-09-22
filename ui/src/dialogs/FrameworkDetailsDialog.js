import React from "react";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  formatFrameworkResource,
  formatFrameworkTimestamp,
  frameworkAdvancedDetails,
  filterFrameworkTasks,
  frameworkRoles,
  frameworkStatus,
  frameworkTaskCounts,
  frameworkTasks,
  frameworkWebUiUrl,
} from "./frameworkDetails";
import TasksTable from "../features/tasks/TasksTable";

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
        {children ?? EMPTY}
      </Typography>
    </Box>
  );
}

function ResourceTile({ framework, name, label }) {
  return (
    <Paper variant="outlined" sx={{ height: "100%", p: 2 }}>
      <Typography color="text.secondary" variant="caption">{label}</Typography>
      <Typography variant="h6" fontWeight={700}>{formatFrameworkResource(name, framework.resources?.[name])}</Typography>
      <Grid container spacing={1} sx={{ mt: 0.5 }}>
        <Grid item xs={6}><DetailField label="Used">{formatFrameworkResource(name, framework.used_resources?.[name])}</DetailField></Grid>
        <Grid item xs={6}><DetailField label="Offered">{formatFrameworkResource(name, framework.offered_resources?.[name])}</DetailField></Grid>
      </Grid>
    </Paper>
  );
}

export default function FrameworkDetailsDialog({ open, framework, onClose }) {
  const [allTasksOpen, setAllTasksOpen] = React.useState(false);
  const [taskSearch, setTaskSearch] = React.useState("");
  const status = frameworkStatus(framework);
  const counts = frameworkTaskCounts(framework);
  const tasks = frameworkTasks(framework);
  const runningTasks = tasks.filter((task) =>
    ["TASK_RUNNING", "TASK_STAGING", "TASK_STARTING"].includes(task?.state)
  );

  const filteredTasks = filterFrameworkTasks(tasks, taskSearch);
  const roles = frameworkRoles(framework);
  const capabilities = Array.isArray(framework?.capabilities) ? framework.capabilities : [];
  const webUiUrl = frameworkWebUiUrl(framework?.webui_url);

  return (
    <>
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl" scroll="paper">
      <DialogTitle sx={{ pr: 7 }}>
        <Typography variant="overline" color="primary.light">Framework details</Typography>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <Typography variant="h5" fontWeight={700} sx={{ overflowWrap: "anywhere" }}>
            {framework?.name || framework?.id || "Framework"}
          </Typography>
          {framework && <Chip label={status.label} color={status.color} size="small" />}
        </Stack>
        <IconButton aria-label="Close framework details" onClick={onClose} sx={{ position: "absolute", right: 12, top: 16 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {!framework ? (
          <Typography color="text.secondary">No framework details available.</Typography>
        ) : (
          <Stack spacing={3}>
            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>Overview</Typography>
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6} md={3}><DetailField label="Status"><Chip label={status.label} color={status.color} size="small" /></DetailField></Grid>
                <Grid item xs={12} sm={6} md={3}><DetailField label="Host">{framework.hostname || EMPTY}</DetailField></Grid>
                <Grid item xs={12} sm={6} md={3}><DetailField label="User">{framework.user || EMPTY}</DetailField></Grid>
                <Grid item xs={12} sm={6} md={3}><DetailField label="Principal">{framework.principal || EMPTY}</DetailField></Grid>
                <Grid item xs={12} sm={6} md={3}><DetailField label="Registered">{formatFrameworkTimestamp(framework.registered_time)}</DetailField></Grid>
                <Grid item xs={12} sm={6} md={3}><DetailField label="Reregistered">{formatFrameworkTimestamp(framework.reregistered_time)}</DetailField></Grid>
                <Grid item xs={12} sm={6} md={3}><DetailField label="Unregistered">{formatFrameworkTimestamp(framework.unregistered_time)}</DetailField></Grid>
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>Identifiers & configuration</Typography>
              <Grid container spacing={2.5}>
                <Grid item xs={12}><DetailField label="Framework ID" mono>{framework.id || EMPTY}</DetailField></Grid>
                <Grid item xs={12} sm={6} md={3}><DetailField label="Checkpointing">{framework.checkpoint === true ? "Enabled" : framework.checkpoint === false ? "Disabled" : EMPTY}</DetailField></Grid>
                <Grid item xs={12} sm={6} md={3}><DetailField label="Failover timeout">{Number.isFinite(Number(framework.failover_timeout)) ? `${Number(framework.failover_timeout).toLocaleString()} s` : EMPTY}</DetailField></Grid>
                <Grid item xs={12} sm={6} md={3}><DetailField label="Recovered">{framework.recovered === true ? "Yes" : framework.recovered === false ? "No" : EMPTY}</DetailField></Grid>
                <Grid item xs={12} sm={6} md={3}><DetailField label="Connected">{framework.connected === true ? "Yes" : framework.connected === false ? "No" : EMPTY}</DetailField></Grid>
              </Grid>
              {webUiUrl && (
                <Button component="a" href={webUiUrl} target="_blank" rel="noopener noreferrer" variant="outlined" sx={{ mt: 2 }}>
                  Open framework Web UI
                </Button>
              )}
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>Resources & Allocation</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} lg={3}><ResourceTile framework={framework} name="cpus" label="CPU" /></Grid>
                <Grid item xs={12} sm={6} lg={3}><ResourceTile framework={framework} name="mem" label="Memory" /></Grid>
                <Grid item xs={12} sm={6} lg={3}><ResourceTile framework={framework} name="disk" label="Disk" /></Grid>
                <Grid item xs={12} sm={6} lg={3}><ResourceTile framework={framework} name="gpus" label="GPUs" /></Grid>
                <Grid item xs={12}><DetailField label="Allocated ports" mono>{formatFrameworkResource("ports", framework.resources?.ports)}</DetailField></Grid>
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>Workload</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}><Paper variant="outlined" sx={{ p: 2 }}><DetailField label="Active tasks">{counts.active}</DetailField></Paper></Grid>
                <Grid item xs={6} md={3}><Paper variant="outlined" sx={{ p: 2 }}><DetailField label="Completed tasks">{counts.completed}</DetailField></Paper></Grid>
                <Grid item xs={6} md={3}><Paper variant="outlined" sx={{ p: 2 }}><DetailField label="Unreachable tasks">{counts.unreachable}</DetailField></Paper></Grid>
                <Grid item xs={6} md={3}><Paper variant="outlined" sx={{ p: 2 }}><DetailField label="Executors">{counts.executors}</DetailField></Paper></Grid>
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1} sx={{ mb: 1 }}>
                <Typography variant="h6" fontWeight={700}>Running tasks</Typography>
                <Button variant="outlined" onClick={() => setAllTasksOpen(true)}>View all tasks</Button>
              </Stack>
              {runningTasks.length ? (
                <Box>
                  <TasksTable
                    tasks={runningTasks}
                    title={`Running tasks (${runningTasks.length})`}
                    showFrameworkId={false}
                    pageSize={10}
                  />
                </Box>
              ) : (
                <Typography color="text.secondary">No running tasks reported for this framework.</Typography>
              )}
            </Box>

            <Divider />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight={700} gutterBottom>Roles</Typography>
                {roles.length ? (
                  <Stack direction="row" gap={1} flexWrap="wrap">
                    {roles.map((role) => <Chip key={role} label={role} size="small" />)}
                  </Stack>
                ) : <Typography color="text.secondary">No roles reported.</Typography>}
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight={700} gutterBottom>Capabilities</Typography>
                {capabilities.length ? (
                  <Stack direction="row" gap={1} flexWrap="wrap">
                    {capabilities.map((capability) => <Chip key={capability} label={capability} size="small" />)}
                  </Stack>
                ) : <Typography color="text.secondary">No capabilities reported.</Typography>}
              </Grid>
            </Grid>

            <Box component="details" className="advanced-details">
              <Box component="summary">Advanced framework data</Box>
              <Box component="pre">{JSON.stringify(frameworkAdvancedDetails(framework), null, 2)}</Box>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
    <Dialog open={allTasksOpen} onClose={() => setAllTasksOpen(false)} fullWidth maxWidth="xl" scroll="paper">
      <DialogTitle>All tasks for {framework?.name || framework?.id || "framework"}</DialogTitle>
      <DialogContent dividers>
        <TextField
          fullWidth
          size="small"
          label="Search by task name or ID"
          value={taskSearch}
          onChange={(event) => setTaskSearch(event.target.value)}
          inputProps={{ "aria-label": "Search all framework tasks" }}
          sx={{ mb: 2 }}
        />
        {tasks.length ? (
          <TasksTable
            tasks={filteredTasks}
            title={`All tasks (${filteredTasks.length}${taskSearch.trim() ? ` of ${tasks.length}` : ""})`}
            showFrameworkId={false}
          />
        ) : (
          <Typography color="text.secondary">No tasks reported for this framework.</Typography>
        )}
      </DialogContent>
      <DialogActions><Button onClick={() => setAllTasksOpen(false)}>Close</Button></DialogActions>
    </Dialog>
    </>
  );
}
