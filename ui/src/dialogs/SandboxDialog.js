import React from "react";
import {
  Alert,
  Breadcrumbs,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import FolderIcon from "@mui/icons-material/Folder";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import { agentHttpEndpoint } from "../logs/logApi";
import { useAuth } from "../auth/AuthContext";
import SyntaxHighlightedText, { detectSyntaxLanguage } from "../components/SyntaxHighlightedText";

export function findTaskDirectory(state, task) {
  if (task?.directory) return task.directory;
  const frameworks = [
    ...(state?.frameworks || []),
    ...(state?.completed_frameworks || []),
  ];
  const framework = frameworks.find((item) => String(item.id) === String(task?.framework_id));
  const executors = [
    ...(framework?.executors || []),
    ...(framework?.completed_executors || []),
  ];
  const executor = task?.executor_id
    ? executors.find((item) => String(item.id) === String(task.executor_id))
    : executors.find((item) => [
      ...(item.tasks || []),
      ...(item.queued_tasks || []),
      ...(item.completed_tasks || []),
    ].some((entry) => String(entry.id) === String(task?.id)));
  const tasks = [
    ...(executor?.tasks || []),
    ...(executor?.queued_tasks || []),
    ...(executor?.completed_tasks || []),
  ];
  return tasks.find((item) => String(item.id) === String(task?.id))?.directory || executor?.directory || null;
}

export function isDirectory(file) {
  return file?.type === "DIRECTORY" || file?.kind === "directory" || String(file?.mode || "").startsWith("d") || String(file?.path || "").endsWith("/");
}

export function normalizeListing(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.files)) return response.files;
  if (Array.isArray(response?.listing)) return response.listing;
  if (Array.isArray(response?.file_infos)) return response.file_infos;
  return [];
}

export function joinPath(parent, child) {
  if (String(child).startsWith("/")) return child;
  return `${String(parent).replace(/\/$/, "")}/${child}`;
}

export function relativeFileName(filePath, currentPath) {
  const value = String(filePath || "");
  const current = String(currentPath || "").replace(/\/$/, "");
  const prefix = current && current !== "/" ? `${current}/` : "";
  if (prefix && value.startsWith(prefix)) return value.slice(prefix.length);
  if (value === current) return value.split("/").filter(Boolean).pop() || "/";
  return value.split("/").filter(Boolean).pop() || value || "—";
}

export function formatFileSize(size) {
  if (size === null || size === undefined || size === "") return "—";
  const value = Number(size);
  if (!Number.isFinite(value)) return String(size);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function fileReadQuery(path, size) {
  const length = Number.isFinite(Number(size)) && Number(size) >= 0 ? Number(size) : 64 * 1024;
  return `?path=${encodeURIComponent(path)}&offset=0&length=${length}`;
}

export function breadcrumbParts(root, current) {
  const sandbox = String(root || "/").replace(/\/$/, "") || "/";
  const location = String(current || sandbox).replace(/\/$/, "") || "/";
  if (location === sandbox) return [{ label: "Sandbox", path: sandbox }];

  const relative = location.startsWith(`${sandbox}/`)
    ? location.slice(sandbox.length + 1)
    : location.replace(/^\//, "");
  const parts = relative.split("/").filter(Boolean);
  return parts.reduce((result, label) => {
    const parent = result[result.length - 1].path;
    result.push({ label, path: `${parent === "/" ? "" : parent}/${label}` || "/" });
    return result;
  }, [{ label: "Sandbox", path: sandbox }]);
}

function parentPath(path) {
  const value = String(path || "/").replace(/\/$/, "") || "/";
  if (value === "/") return "/";
  return value.slice(0, value.lastIndexOf("/")) || "/";
}

export default function SandboxDialog({ open, task, agent, onClose }) {
  const { request } = useAuth();
  const [path, setPath] = React.useState(null);
  const [sandboxRoot, setSandboxRoot] = React.useState(null);
  const [files, setFiles] = React.useState([]);
  const [fileViewer, setFileViewer] = React.useState(null);
  const [fileContent, setFileContent] = React.useState("");
  const [fileLoading, setFileLoading] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!open || !task || !agent) return undefined;
    let active = true;
    setLoading(true);
    setError("");
    const endpoint = agentHttpEndpoint(agent, "/state");
    if (!endpoint) {
      setError("The agent API endpoint is unavailable.");
      setLoading(false);
      return undefined;
    }
    request(endpoint)
      .then((state) => {
        if (!active) return;
        const directory = findTaskDirectory(state, task);
        if (!directory) throw new Error("The task sandbox directory could not be found.");
        setSandboxRoot(directory);
        setPath(directory);
      })
      .catch((reason) => {
        if (active) {
          setError(reason.message || "The task sandbox could not be opened.");
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, [agent, open, request, task]);

  React.useEffect(() => {
    if (!open || !path || !agent) return undefined;
    let active = true;
    setLoading(true);
    setError("");
    const endpoint = agentHttpEndpoint(agent, "/files/browse");
    request(`${endpoint}?path=${encodeURIComponent(path)}`)
      .then((response) => {
        if (active) setFiles(normalizeListing(response));
      })
      .catch((reason) => {
        if (active) setError(reason.message || "The sandbox files could not be loaded.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [agent, open, path, request]);

  React.useEffect(() => {
    if (!fileViewer || !agent) return undefined;
    let active = true;
    setFileLoading(true);
    setFileContent("");
    const endpoint = agentHttpEndpoint(agent, "/files/read");
    if (!endpoint) {
      setFileContent("The agent API endpoint is unavailable.");
      setFileLoading(false);
      return undefined;
    }
    request(`${endpoint}${fileReadQuery(fileViewer.path, fileViewer.size)}`)
      .then((response) => {
        if (!active) return;
        const content = response?.data ?? response?.content ?? response?.text ?? response;
        setFileContent(typeof content === "string" ? content : JSON.stringify(content, null, 2));
      })
      .catch((reason) => {
        if (active) setFileContent(`Unable to read this file: ${reason.message || "unknown error"}`);
      })
      .finally(() => { if (active) setFileLoading(false); });
    return () => { active = false; };
  }, [agent, fileViewer, request]);

  const breadcrumbs = breadcrumbParts(sandboxRoot, path);

  return (
    <>
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Task sandbox</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {path && (
            <Paper variant="outlined" sx={{ px: 2, py: 1.25, bgcolor: "action.hover" }}>
              <Breadcrumbs aria-label="Sandbox location">
                {breadcrumbs.map((breadcrumb, index) => (
                  index === breadcrumbs.length - 1 ? (
                    <Typography key={breadcrumb.path} color="text.primary" variant="body2" fontWeight={600}>
                      {index === 0 && <HomeWorkIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: "middle" }} />}
                      {breadcrumb.label}
                    </Typography>
                  ) : (
                    <Button key={breadcrumb.path} color="inherit" size="small" onClick={() => setPath(breadcrumb.path)} sx={{ minWidth: 0, p: 0, textTransform: "none" }}>
                      {index === 0 && <HomeWorkIcon fontSize="small" sx={{ mr: 0.5 }} />}
                      {breadcrumb.label}
                    </Button>
                  )
                ))}
              </Breadcrumbs>
            </Paper>
          )}
          {error && <Alert severity="error">{error}</Alert>}
          {loading ? <Stack alignItems="center" sx={{ py: 5 }}><CircularProgress size={28} /></Stack> : (
            <Paper variant="outlined" sx={{ overflow: "hidden" }}>
              <Table size="small" aria-label="Sandbox files">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell align="right" sx={{ width: 140 }}>Size</TableCell>
                    <TableCell sx={{ width: 150 }}>Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {path && sandboxRoot && path !== sandboxRoot && (
                    <TableRow hover>
                      <TableCell colSpan={3} sx={{ py: 0 }}>
                        <Button size="small" startIcon={<ArrowUpwardIcon />} onClick={() => setPath(parentPath(path))}>
                          Parent directory
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                  {files.map((file) => {
                    const filePath = file.path || file.name || "";
                    const directory = isDirectory(file);
                    const displayName = relativeFileName(filePath, path);
                    return (
                      <TableRow key={filePath} hover>
                        <TableCell sx={{ maxWidth: 0, overflowWrap: "anywhere" }}>
                          {directory ? (
                            <Button color="inherit" sx={{ justifyContent: "flex-start", textTransform: "none", p: 0, minWidth: 0 }} onClick={() => setPath(joinPath(path, filePath))}>
                              <FolderIcon color="warning" sx={{ mr: 1 }} fontSize="small" />{displayName}
                            </Button>
                          ) : (
                            <Button color="inherit" sx={{ justifyContent: "flex-start", textTransform: "none", p: 0, minWidth: 0 }} onClick={() => setFileViewer({ path: filePath, name: displayName, size: file.size })}>
                              <InsertDriveFileIcon color="action" fontSize="small" />
                              <Typography variant="body2">{displayName}</Typography>
                            </Button>
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>{directory ? "—" : formatFileSize(file.size)}</TableCell>
                        <TableCell>{directory ? "Folder" : "File"}</TableCell>
                      </TableRow>
                    );
                  })}
                  {!files.length && <TableRow><TableCell colSpan={3}><Typography color="text.secondary" sx={{ py: 2 }}>This directory is empty.</Typography></TableCell></TableRow>}
                </TableBody>
              </Table>
            </Paper>
          )}
        </Stack>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
    <Dialog open={Boolean(fileViewer)} onClose={() => setFileViewer(null)} fullWidth maxWidth="xl">
      <DialogTitle>{fileViewer?.name || "Text file"}</DialogTitle>
      <DialogContent dividers>
        {fileLoading ? <Stack alignItems="center" sx={{ py: 5 }}><CircularProgress size={28} /></Stack> : (
          <Paper component="pre" variant="outlined" sx={{ bgcolor: "#080b14", color: "#dce6f7", m: 0, p: 1, maxHeight: "65vh", overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "monospace", fontSize: "0.8rem" }}>
            <SyntaxHighlightedText
              text={fileContent}
              language={detectSyntaxLanguage(fileViewer?.name)}
              showLineNumbers
            />
          </Paper>
        )}
      </DialogContent>
      <DialogActions><Button onClick={() => setFileViewer(null)}>Close</Button></DialogActions>
    </Dialog>
    </>
  );
}
