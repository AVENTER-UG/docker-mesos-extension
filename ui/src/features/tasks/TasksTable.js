import React, { useState } from "react";
import clusterdLogo from "../../images/clusterd.png";
import ArticleIcon from "@mui/icons-material/Article";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Box,
  Button,
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
import TaskDetailsDialog from "../../dialogs/TaskDetailsDialog";
import SandboxDialog from "../../dialogs/SandboxDialog";
import { FormatTimeDifference, HealthBadge, StateBadge } from "../../libs/functions";
import { sortByTimestampWithFallback } from "../../libs/sortingHelpers";
import "../../app/App.css";
import { PAGE_SIZE, PaginationControls, pageCountFor } from "../../components/PaginationControls";

export function taskContainerizer(task) {
  return String(task?.container?.type || "MESOS").toUpperCase() === "DOCKER" ? "DOCKER" : "MESOS";
}

function DockerIcon() {
  return (
    <Box component="svg" viewBox="0 0 48 32" role="img" aria-hidden="true" sx={{ width: 24, height: 18 }}>
      <path fill="#2496ed" d="M2 18h7v6H2zm8-8h7v6h-7zm8 0h7v6h-7zm8 0h7v6h-7zm8 4h7v6h-7zM10 18h7v6h-7zm8 0h7v6h-7zm8 0h7v6h-7z" />
      <path fill="#2496ed" d="M5 27c2.5 2.8 6.4 4 11 4h10c8 0 14-4.2 17-12H7c-.2 3 0 5.5-2 8z" />
    </Box>
  );
}

function ContainerizerIcon({ task }) {
  if (taskContainerizer(task) === "DOCKER") return <DockerIcon />;
  return <Box component="img" src={clusterdLogo} alt="" sx={{ width: 24, height: 24, objectFit: "contain" }} />;
}

function latestStatus(task) {
  return task.statuses?.at(-1);
}

function taskHealth(task) {
  const status = latestStatus(task);
  if (status?.healthy === true) return "Healthy";
  if (status?.healthy === false) return "Unhealthy";
  return null;
}

function taskStarted(task) {
  const timestamp = latestStatus(task)?.timestamp;
  return timestamp ? `${FormatTimeDifference(timestamp)} ago` : "—";
}

export default function TasksTable({ tasks = [], title, showFrameworkId = true, pageSize = PAGE_SIZE }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [sandboxTask, setSandboxTask] = useState(null);
  const [page, setPage] = useState(1);

  React.useEffect(() => {
    if (!selectedTask) return;
    const refreshedTask = tasks.find((task) => String(task.id) === String(selectedTask.id));
    if (refreshedTask && JSON.stringify(refreshedTask) !== JSON.stringify(selectedTask)) setSelectedTask(refreshedTask);
  }, [selectedTask, tasks]);

  // Sort tasks by newest-to-oldest based on latest status timestamp
  const sortedTasks = sortByTimestampWithFallback(tasks, (task) => latestStatus(task)?.timestamp);
  const pageCount = pageCountFor(sortedTasks.length, pageSize);
  const pagedTasks = sortedTasks.slice((page - 1) * pageSize, page * pageSize);
  React.useEffect(() => setPage((current) => Math.min(current, pageCount)), [pageCount]);

  return (
    <>
      <Paper className="table-card" elevation={0}>
        <Typography className="table-title" variant="h6">{title}</Typography>
        <TableContainer component={Box}>
          <Table sx={{ minWidth: showFrameworkId ? 1000 : 810 }} size="small" aria-label={title}>
            <TableHead>
              <TableRow>
                <TableCell width={52} aria-label="Actions" />
                <TableCell align="center" aria-label="Containerizer" />
                {showFrameworkId && <TableCell>Framework ID</TableCell>}
                <TableCell>Task ID</TableCell>
                <TableCell>Task name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>State</TableCell>
                <TableCell>Health</TableCell>
                <TableCell>Started</TableCell>
                <TableCell>Sandbox</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedTasks.length === 0 && (
                <TableRow><TableCell colSpan={showFrameworkId ? 10 : 9} align="center" sx={{ py: 4, color: "text.secondary" }}>No tasks.</TableCell></TableRow>
              )}
              {pagedTasks.map((task) => {
                return (
                  <TableRow
                    hover
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedTask(task);
                      }
                    }}
                    sx={{ cursor: "pointer" }}
                    tabIndex={0}
                    role="button"
                  >
                    <TableCell>
                      <Tooltip title="View task details">
                        <IconButton
                          aria-label={`View details for ${task.name || task.id}`}
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedTask(task);
                          }}
                        >
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center" aria-label="Containerizer">
                      <Tooltip title={taskContainerizer(task) === "DOCKER" ? "Docker" : "Mesos"}>
                        <Box
                          component="span"
                          aria-label={`${taskContainerizer(task)} containerizer`}
                          sx={{ display: "inline-flex", alignItems: "center" }}
                        >
                          <ContainerizerIcon task={task} />
                        </Box>
                      </Tooltip>
                    </TableCell>
                    {showFrameworkId && <TableCell className="id-cell" title={task.framework_id}>{task.framework_id || "—"}</TableCell>}
                    <TableCell className="id-cell" title={task.id}>{task.id || "—"}</TableCell>
                    <TableCell>{task.name || "—"}</TableCell>
                    <TableCell>{Array.isArray(task.role) ? task.role.join(", ") : task.role || "—"}</TableCell>
                    <TableCell><StateBadge state={task.state} /></TableCell>
                    <TableCell><HealthBadge health={taskHealth(task)} /></TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{taskStarted(task)}</TableCell>
                    <TableCell>
                      {task?._agent ? (
                        <Button
                          size="small"
                          startIcon={<ArticleIcon />}
                          onClick={(event) => {
                            event.stopPropagation();
                            setSandboxTask(task);
                          }}
                        >
                          Sandbox
                        </Button>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <PaginationControls page={page} pageCount={pageCount} onPageChange={setPage} />
      </Paper>

      <TaskDetailsDialog open={Boolean(selectedTask)} task={selectedTask} onClose={() => setSelectedTask(null)} />
      {sandboxTask && <SandboxDialog open task={sandboxTask} agent={sandboxTask._agent} onClose={() => setSandboxTask(null)} />}
    </>
  );
}