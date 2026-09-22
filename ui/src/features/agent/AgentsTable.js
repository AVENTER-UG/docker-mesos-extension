import React, { useState } from "react";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Box,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import AgentDetailsDialog from "../../dialogs/AgentDetailsDialog";
import { sortByTimestamp } from "../../libs/sortingHelpers";
import { resourceIdFromHash } from "../../app/hashNavigation";
import { UTILIZATION_TYPES, utilizationColor, utilizationValue } from "../../utilization";
import { PAGE_SIZE, PaginationControls, pageCountFor } from "../../components/PaginationControls";

function StatusChip({ agent }) {
  if (agent.active) return <Chip label="Active" color="success" size="small" />;
  if (agent.deactivated) return <Chip label="Deactivated" color="warning" size="small" />;
  return <Chip label="Inactive" size="small" />;
}

function UtilizationCell({ agent }) {
  return (
    <Box
      sx={{
        minWidth: 380,
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        columnGap: 2,
        rowGap: 0.75,
      }}
    >
      {UTILIZATION_TYPES.map(({ name, shortLabel }) => {
        const value = utilizationValue(agent?._metrics, "slave", name);
        return (
          <Box key={name} sx={{ minWidth: 0, display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography variant="caption" sx={{ minWidth: 34, textAlign: "left" }}>{shortLabel}</Typography>
            <LinearProgress
              aria-label={`${shortLabel} utilization`}
              variant="determinate"
              value={value || 0}
              sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: utilizationColor(value) } }}
            />
            <Typography variant="caption" sx={{ minWidth: 34, textAlign: "right" }}>
              {value === null ? "—" : `${value.toFixed(0)}%`}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

export default function AgentsTable({ agents = [] }) {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [page, setPage] = useState(1);
  const sortedAgents = sortByTimestamp(agents, "registered_time");
  const pageCount = pageCountFor(sortedAgents.length);
  const pagedAgents = sortedAgents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  React.useEffect(() => setPage((current) => Math.min(current, pageCount)), [pageCount]);

  React.useEffect(() => {
    if (!selectedAgent) return;
    const refreshedAgent = agents.find((agent) => String(agent.id) === String(selectedAgent.id));
    if (refreshedAgent && JSON.stringify(refreshedAgent) !== JSON.stringify(selectedAgent)) setSelectedAgent(refreshedAgent);
  }, [agents, selectedAgent]);

  React.useEffect(() => {
    const selectFromHash = () => {
      const id = resourceIdFromHash(window.location.hash, "agents");
      if (id) {
        const agent = agents.find((candidate) => String(candidate.id) === id);
        if (agent) setSelectedAgent(agent);
      }
    };
    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);
    return () => window.removeEventListener("hashchange", selectFromHash);
  }, [agents]);

  return (
    <>
      <Paper className="table-card" elevation={0}>
        <Typography className="table-title" variant="h6">Agents</Typography>
        <TableContainer component={Box}>
          <Table sx={{ minWidth: 980 }} size="small" aria-label="Agents">
            <TableHead>
              <TableRow>
                <TableCell width={52} aria-label="Actions" />
                <TableCell>Agent ID</TableCell>
                <TableCell>Hostname</TableCell>
                <TableCell sx={{ width: 110, whiteSpace: "nowrap" }}>Version</TableCell>
                <TableCell sx={{ width: 110, whiteSpace: "nowrap" }}>Status</TableCell>
                <TableCell sx={{ width: 400, whiteSpace: "nowrap" }}>Utilization</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {agents.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>No agents.</TableCell></TableRow>
              )}
              {pagedAgents.map((agent) => (
                <TableRow
                  hover
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    <Tooltip title="View agent details">
                      <IconButton
                        aria-label={`View details for ${agent.hostname || agent.id}`}
                        size="small"
                        onClick={() => setSelectedAgent(agent)}
                      >
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="id-cell" title={agent.id}>{agent.id || "—"}</TableCell>
                  <TableCell>{agent.hostname || "—"}</TableCell>
                  <TableCell>{agent.version || "—"}</TableCell>
                  <TableCell><StatusChip agent={agent} /></TableCell>
                  <TableCell><UtilizationCell agent={agent} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <PaginationControls page={page} pageCount={pageCount} onPageChange={setPage} />
      </Paper>

      <AgentDetailsDialog
        open={Boolean(selectedAgent)}
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
      />
    </>
  );
}