import React from "react";
import { Box, Divider, Grid, Paper, Stack, TextField, Typography } from "@mui/material";
import { useAuth } from "../../auth/AuthContext";
import TasksTable from "./TasksTable";
import { attachAgentsToTasks } from "../../dialogs/taskDetails";
import { filterFrameworkTasks, filterActiveTasks } from "../../dialogs/frameworkDetails";
import { deriveTaskOverview, formatOverviewResource, RESOURCE_TYPES } from "./taskOverview";
import { QueryClient, QueryClientProvider, useQuery} from "@tanstack/react-query";

const queryClient = new QueryClient();

function TaskOverview({ overview }) {
  return (
    <Paper className="table-card" elevation={0} sx={{ p: 2, mb: 2 }}>
      <Stack spacing={1.5}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
          <Box>
            <Typography variant="h6" fontWeight={700}>Cluster quick overview</Typography>
            <Typography color="text.secondary" variant="body2">Current task and agent capacity</Typography>
          </Box>
          <Typography color="text.secondary" variant="body2" sx={{ alignSelf: { sm: "center" } }}>
            {overview.counts.agents} active agents
          </Typography>
        </Stack>
        <Divider />
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography color="text.secondary" variant="caption">Tasks</Typography>
            <Stack direction="row" flexWrap="wrap" columnGap={2} rowGap={0.5}>
              <Typography><strong>{overview.counts.active}</strong> active</Typography>
              <Typography><strong>{overview.counts.unreachable}</strong> unreachable</Typography>
              <Typography><strong>{overview.counts.completed}</strong> completed</Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography color="text.secondary" variant="caption">Resources</Typography>
            <Grid container spacing={1}>
              {RESOURCE_TYPES.map(({ name, label }) => {
                const resource = overview.resources[name];
                return (
                  <Grid item xs={6} sm={3} key={name}>
                    <Typography variant="body2" fontWeight={600}>{label}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {formatOverviewResource(name, resource.used)} used · {formatOverviewResource(name, resource.offered)} offered
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {formatOverviewResource(name, resource.available)} available / {formatOverviewResource(name, resource.total)} total
                    </Typography>
                  </Grid>
                );
              })}
            </Grid>
          </Grid>
        </Grid>
      </Stack>
    </Paper>
  );
}

const useMesosTasks = (request, authenticated) => {
  return useQuery({
    queryKey: ["mesosTasks", authenticated],
    enabled: authenticated,
    queryFn: async () => {
      const [frameworkData, agentData] = await Promise.all([
        request("/frameworks?order=dsc&limit=-1"),
        request("/slaves"),
      ]);
      return { frameworks: frameworkData.frameworks ?? [], agents: agentData.slaves ?? [] };
    },
    refetchInterval: 5000,
    staleTime: 4000,
    keepPreviousData: true,
  });
};

function DataInner() {
  const [search, setSearch] = React.useState("");
  const { request, isAuthenticated } = useAuth();
  const { data, isLoading, error } = useMesosTasks(request, isAuthenticated);

  const frameworks = data?.frameworks ?? [];
  const agents = data?.agents ?? [];
  const tasks = attachAgentsToTasks(frameworks.flatMap((framework) => framework.tasks ?? []), agents);
  const unreachable = attachAgentsToTasks(frameworks.flatMap((framework) => framework.unreachable_tasks ?? []), agents);
  const completed = attachAgentsToTasks(frameworks.flatMap((framework) => framework.completed_tasks ?? []), agents);
  const visibleTasks = filterFrameworkTasks(tasks, search);
  const visibleUnreachable = filterFrameworkTasks(unreachable, search);
  const visibleCompleted = filterFrameworkTasks(completed, search);

  // Filter active tasks to remove terminal states from the "Active Tasks" table
  const visibleActiveTasks = filterActiveTasks(visibleTasks);
  const overview = deriveTaskOverview({ active: filterActiveTasks(tasks), unreachable, completed, agents });

  return (
    <Box sx={{ p: 2 }}>
      {isLoading && <Box>…Loading…</Box>}

      {error && (
        <Box sx={{ color: "red" }}>
          Error: {error}
        </Box>
      )}

      <TextField
        fullWidth
        size="small"
        label="Search tasks by name or ID"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        inputProps={{ "aria-label": "Search tasks by name or ID" }}
        sx={{ mb: 2 }}
      />
      <TaskOverview overview={overview} />
      <TasksTable tasks={visibleActiveTasks} title="Active Tasks"/>
      <p></p>
      <TasksTable tasks={visibleUnreachable} title="Unreachable Tasks"/>
      <p></p>
      <TasksTable tasks={visibleCompleted} title="Completed Tasks"/>

    </Box>
  );
}

export default function Data() {
  return (
    <QueryClientProvider client={queryClient}>
      <DataInner />
    </QueryClientProvider>
  );
}

