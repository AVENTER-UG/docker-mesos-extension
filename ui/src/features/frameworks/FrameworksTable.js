import React, { useState } from "react";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Box,
  Chip,
  IconButton,
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
import FrameworkDetailsDialog from "../../dialogs/FrameworkDetailsDialog";
import {
  formatFrameworkResource,
  formatFrameworkTimestamp,
  frameworkStatus,
  frameworkTaskCounts,
  normalizeFrameworkRoles,
} from "../../dialogs/frameworkDetails";
import { sortByTimestamp } from "../../libs/sortingHelpers";
import { resourceIdFromHash } from "../../app/hashNavigation";
import { PAGE_SIZE, PaginationControls, pageCountFor } from "../../components/PaginationControls";

export default function FrameworksTable({ frameworks = [], title }) {
  const [selectedFramework, setSelectedFramework] = useState(null);
  const [page, setPage] = useState(1);

  React.useEffect(() => {
    if (!selectedFramework) return;
    const refreshedFramework = frameworks.find((framework) => String(framework.id) === String(selectedFramework.id));
    if (refreshedFramework && JSON.stringify(refreshedFramework) !== JSON.stringify(selectedFramework)) setSelectedFramework(refreshedFramework);
  }, [frameworks, selectedFramework]);

  // Sort frameworks by newest-to-oldest based on registered_time
  const sortedFrameworks = sortByTimestamp(frameworks, 'registered_time');
  const pageCount = pageCountFor(sortedFrameworks.length);
  const pagedFrameworks = sortedFrameworks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  React.useEffect(() => setPage((current) => Math.min(current, pageCount)), [pageCount]);

  React.useEffect(() => {
    const selectFromHash = () => {
      const id = resourceIdFromHash(window.location.hash, "frameworks");
      if (id) {
        const framework = frameworks.find((candidate) => String(candidate.id) === id);
        if (framework) setSelectedFramework(framework);
      }
    };
    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);
    return () => window.removeEventListener("hashchange", selectFromHash);
  }, [frameworks]);

  return (
    <>
      <Paper className="table-card" elevation={0}>
        <Typography className="table-title" variant="h6">{title}</Typography>
        <TableContainer component={Box}>
          <Table sx={{ minWidth: 1050 }} size="small" aria-label={title}>
            <TableHead>
              <TableRow>
                <TableCell width={52} aria-label="Actions" />
                <TableCell>Name</TableCell>
                <TableCell>Framework ID</TableCell>
                <TableCell>Host</TableCell>
                <TableCell>Roles</TableCell>
                <TableCell align="right">Active tasks</TableCell>
                <TableCell align="right">CPU</TableCell>
                <TableCell align="right">Memory</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Registered</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedFrameworks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4, color: "text.secondary" }}>No frameworks.</TableCell>
                </TableRow>
              )}
              {pagedFrameworks.map((framework) => {
                const status = frameworkStatus(framework);
                const counts = frameworkTaskCounts(framework);
                return (
                  <TableRow
                    hover
                    key={framework.id}
                    onClick={() => setSelectedFramework(framework)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>
                      <Tooltip title="View framework details">
                        <IconButton
                          aria-label={`View details for ${framework.name || framework.id}`}
                          size="small"
                          onClick={() => setSelectedFramework(framework)}
                        >
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{framework.name || "—"}</TableCell>
                    <TableCell className="id-cell" title={framework.id}>{framework.id || "—"}</TableCell>
                    <TableCell>{framework.hostname || "—"}</TableCell>
                    <TableCell>{normalizeFrameworkRoles(framework)}</TableCell>
                    <TableCell align="right">{counts.active}</TableCell>
                    <TableCell align="right">{formatFrameworkResource("cpus", framework.resources?.cpus)}</TableCell>
                    <TableCell align="right">{formatFrameworkResource("mem", framework.resources?.mem)}</TableCell>
                    <TableCell><Chip label={status.label} color={status.color} size="small" /></TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{formatFrameworkTimestamp(framework.registered_time)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <PaginationControls page={page} pageCount={pageCount} onPageChange={setPage} />
      </Paper>

      <FrameworkDetailsDialog
        open={Boolean(selectedFramework)}
        framework={selectedFramework}
        onClose={() => setSelectedFramework(null)}
      />
    </>
  );
}
