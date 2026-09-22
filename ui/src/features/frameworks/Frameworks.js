import { Box } from "@mui/material";
import { useAuth } from "../../auth/AuthContext";
import FrameworksTable from './FrameworksTable.js';
import { attachAgentsToFramework } from "../../dialogs/taskDetails";
import { QueryClient, QueryClientProvider, useQuery} from "@tanstack/react-query";

const queryClient = new QueryClient();

const useMesosFrameworks = (request, authenticated) => {
  return useQuery({
    queryKey: ["mesosFrameworks", authenticated],
    enabled: authenticated,
    queryFn: async () => {
      const [frameworkData, agentData] = await Promise.all([
        request("/frameworks?order=dsc&limit=-1"),
        request("/slaves"),
      ]);
      return { ...frameworkData, agents: agentData.slaves ?? [] };
    },
    refetchInterval: 5000,
    staleTime: 4000,
    keepPreviousData: true,
  });
};

function DataInner() {
  const { request, isAuthenticated } = useAuth();
  const { data, isLoading, error } = useMesosFrameworks(request, isAuthenticated);

  const agents = data?.agents ?? [];
  const frameworks = (data?.frameworks ?? []).map((framework) => attachAgentsToFramework(framework, agents));
  const active = frameworks.filter(f => f.active === true);
  const inactive = frameworks.filter(f => f.active === false);
  const completed = (data?.completed_frameworks ?? []).map((framework) => attachAgentsToFramework(framework, agents));

  return (
    <Box sx={{ p: 2 }}>
      {isLoading && <Box>…Loading…</Box>}

      {error && (
        <Box sx={{ color: "red" }}>
          Error: {error}
        </Box>
      )}

      <p></p>
      <FrameworksTable frameworks={active} title="Active Frameworks" />
      <p></p>
      <FrameworksTable frameworks={inactive} title="Inactive Frameworks" />
      <p></p>
      <FrameworksTable frameworks={completed} title="Completed Frameworks" />

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

