import { Alert, Box, CircularProgress } from "@mui/material";
import { useAuth } from "../../auth/AuthContext";
import OffersTable from './OffersTable.js';
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";

const queryClient = new QueryClient();

export function flattenOffers(state) {
  const frameworks = Array.isArray(state?.frameworks) ? state.frameworks : [];
  const agents = new Map(
    (Array.isArray(state?.slaves) ? state.slaves : []).map((agent) => [agent?.id, agent])
  );

  return frameworks.flatMap((framework) => {
    const offers = Array.isArray(framework?.offers) ? framework.offers : [];
    return offers.map((offer) => ({
      ...offer,
      framework_id: offer?.framework_id || framework?.id || "",
      framework_name: framework?.name || "—",
      hostname: agents.get(offer?.slave_id)?.hostname || "—",
    }));
  });
}

export async function loadOffers(request) {
  const [frameworkData, agentData] = await Promise.all([
    request("/frameworks?order=dsc&limit=-1"),
    request("/slaves"),
  ]);

  return {
    frameworks: frameworkData?.frameworks ?? [],
    slaves: agentData?.slaves ?? [],
  };
}

const useMesosOffers = (request, authenticated) => {
  return useQuery({
    queryKey: ["mesosOffers", authenticated],
    enabled: authenticated,
    queryFn: () => loadOffers(request),
    refetchInterval: 5000,
    staleTime: 4000,
    keepPreviousData: true,
  });
};

function DataInner() {
  const { request, isAuthenticated } = useAuth();
  const { data, isLoading, error } = useMesosOffers(request, isAuthenticated);

  const offers = flattenOffers(data);

  return (
    <Box sx={{ p: 2 }}>
      {isLoading && <Box className="centered"><CircularProgress /></Box>}

      {error && (
        <Alert severity="error">Offers could not be loaded: {error.message}</Alert>
      )}

      {!isLoading && !error && (
        <OffersTable offers={offers} />
      )}
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