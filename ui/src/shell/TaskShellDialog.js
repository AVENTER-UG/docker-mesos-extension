import React from "react";
import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "../auth/AuthContext";
import { agentApiEndpoint, latestTaskContainer } from "../logs/logApi";
import {
  createSessionContainerId,
  launchTaskShell,
  readProcessIOStream,
  sendTaskShellInput,
  TASK_SHELLS,
} from "./taskExecApi";

function sessionUuid() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function TaskShellDialog({ open, task, onClose }) {
  const { authHeader } = useAuth();
  const [output, setOutput] = React.useState("");
  const [command, setCommand] = React.useState("");
  const [error, setError] = React.useState("");
  const [connecting, setConnecting] = React.useState(false);
  const [connected, setConnected] = React.useState(false);
  const [shellPath, setShellPath] = React.useState("/bin/sh");
  const sessionRef = React.useRef(null);
  const controllerRef = React.useRef(null);
  const outputRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return undefined;
    const endpoint = agentApiEndpoint(task?._agent);
    const parent = latestTaskContainer(task);
    if (!endpoint || !parent) {
      setError("The task shell is unavailable because agent or container information is missing.");
      return undefined;
    }

    const controller = new AbortController();
    const session = createSessionContainerId(parent, sessionUuid());
    controllerRef.current = controller;
    sessionRef.current = { endpoint, containerId: session };
    setOutput("");
    setError("");
    setConnecting(true);
    setConnected(false);

    launchTaskShell(fetch, endpoint, authHeader, session, controller.signal, shellPath)
      .then((response) => {
        if (controller.signal.aborted) return;
        setConnecting(false);
        setConnected(true);
        const outputPromise = readProcessIOStream(response.body, ({ data }) => {
          setOutput((current) => current + data);
        });
        sendTaskShellInput(
          fetch,
          endpoint,
          authHeader,
          session,
          "printf 'ClusterD task shell ready\\n'\n",
          controller.signal,
        ).catch((shellError) => {
          if (!controller.signal.aborted) setError(shellError.message || "The task shell input could not be initialized.");
        });
        return outputPromise;
      })
      .then(() => {
        if (!controller.signal.aborted) setConnected(false);
      })
      .catch((shellError) => {
        if (controller.signal.aborted) return;
        setConnecting(false);
        setConnected(false);
        setError(shellError.message || "The task shell could not be opened.");
      });

    return () => {
      controller.abort();
      controllerRef.current = null;
      sessionRef.current = null;
    };
  }, [authHeader, open, shellPath, task]);

  React.useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  const sendCommand = async () => {
    const session = sessionRef.current;
    const value = command;
    if (!session || !value || !connected) return;
    setCommand("");
    try {
      await sendTaskShellInput(
        fetch,
        session.endpoint,
        authHeader,
        session.containerId,
        `${value}\n`,
        controllerRef.current?.signal,
      );
    } catch (inputError) {
      setError(inputError.message || "Shell input could not be sent.");
    }
  };

  const close = () => {
    controllerRef.current?.abort();
    onClose();
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="lg" scroll="paper">
      <DialogTitle>
        <IconButton aria-label="Close task shell" onClick={close} sx={{ position: "absolute", right: 12, top: 16 }}>
          <CloseIcon />
        </IconButton>
        <Typography variant="overline" color="primary.light">Task shell</Typography>
        <Typography variant="h5" fontWeight={700}>{task?.name || task?.id || "Task"}</Typography>
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box
          ref={outputRef}
          component="pre"
          aria-label="Task shell output"
          sx={{ bgcolor: "#080b14", color: "#dce6f7", fontFamily: "monospace", fontSize: 13, lineHeight: 1.5, m: 0, minHeight: 360, maxHeight: "60vh", overflow: "auto", p: 2, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
        >
          {output || (connecting ? "Connecting to task shell…" : "No shell output.")}
        </Box>
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="task-shell-path-label">Shell</InputLabel>
            <Select
              labelId="task-shell-path-label"
              label="Shell"
              value={shellPath}
              disabled={connecting || connected}
              onChange={(event) => setShellPath(event.target.value)}
            >
              {TASK_SHELLS.map((path) => <MenuItem key={path} value={path}>{path}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            size="small"
            label="Shell input"
            value={command}
            disabled={!connected}
            onChange={(event) => setCommand(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                sendCommand();
              }
            }}
          />
          <Button variant="contained" onClick={sendCommand} disabled={!connected || !command}>
            {connecting ? <CircularProgress size={20} /> : "Send"}
          </Button>
        </Stack>
        <Typography color="text.secondary" variant="caption" component="div" sx={{ mt: 1 }}>
          Commands run in an interactive /bin/sh session. Closing this dialog terminates the session.
        </Typography>
      </DialogContent>
      <DialogActions><Button onClick={close}>Close</Button></DialogActions>
    </Dialog>
  );
}
