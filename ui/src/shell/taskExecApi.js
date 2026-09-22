function utf8ToBase64(value) {
  return btoa(unescape(encodeURIComponent(String(value))));
}

function base64ToUtf8(value) {
  const binary = atob(value || "");
  return decodeURIComponent(escape(binary));
}

export function recordIOEncode(value) {
  const payload = String(value);
  return `${unescape(encodeURIComponent(payload)).length}\n${payload}`;
}

export function consumeRecordIO(value) {
  const input = String(value || "");
  const records = [];
  let offset = 0;
  while (offset < input.length) {
    const newline = input.indexOf("\n", offset);
    if (newline < 0) break;
    const length = Number(input.slice(offset, newline));
    if (!Number.isInteger(length) || length < 0) throw new Error("Invalid RecordIO length header.");

    const start = newline + 1;
    let end = start;
    let bytes = 0;
    while (end < input.length && bytes < length) {
      const character = String.fromCodePoint(input.codePointAt(end));
      bytes += unescape(encodeURIComponent(character)).length;
      end += character.length;
    }
    if (bytes !== length) break;
    records.push(input.slice(start, end));
    offset = end;
  }
  return { records, remainder: input.slice(offset) };
}

export function decodeRecordIO(value) {
  const result = consumeRecordIO(value);
  if (result.remainder) throw new Error("Incomplete RecordIO payload.");
  return result.records;
}

export function createSessionContainerId(parent, uuid) {
  return { value: `webui-shell-${uuid}`, parent };
}

export const TASK_SHELLS = ["/bin/sh", "/bin/bash"];

export function launchShellCall(containerId, shellPath = "/bin/sh") {
  const selectedShell = TASK_SHELLS.includes(shellPath) ? shellPath : "/bin/sh";
  return {
    type: "LAUNCH_NESTED_CONTAINER_SESSION",
    launch_nested_container_session: {
      container_id: containerId,
      command: {
        value: selectedShell,
        arguments: [selectedShell, "-i"],
        shell: false,
      },
      container: { type: "MESOS", tty_info: {} },
    },
  };
}

export function attachInputBody(containerId, data) {
  const handshake = {
    type: "ATTACH_CONTAINER_INPUT",
    attach_container_input: { type: "CONTAINER_ID", container_id: containerId },
  };
  const input = {
    type: "ATTACH_CONTAINER_INPUT",
    attach_container_input: {
      type: "PROCESS_IO",
      process_io: {
        type: "DATA",
        data: { type: "STDIN", data: utf8ToBase64(data) },
      },
    },
  };
  return recordIOEncode(JSON.stringify(handshake)) + recordIOEncode(JSON.stringify(input));
}

export function parseProcessIORecord(record) {
  const processIO = typeof record === "string" ? JSON.parse(record) : record;
  if (processIO?.type !== "DATA" || !processIO.data?.data) return null;
  const type = String(processIO.data.type || "").toLowerCase();
  if (type !== "stdout" && type !== "stderr") return null;
  return { stream: type, data: base64ToUtf8(processIO.data.data) };
}

async function requireSuccessfulResponse(response) {
  if (response.ok) return response;
  let message = response.statusText || `HTTP ${response.status}`;
  try {
    message = (await response.text()) || message;
  } catch (_) {
    // Preserve the HTTP status when the response body cannot be read.
  }
  throw new Error(message);
}

export async function launchTaskShell(request, endpoint, authHeader, containerId, signal, shellPath = "/bin/sh") {
  const response = await request(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/recordio",
      "Content-Type": "application/json",
      "Message-Accept": "application/json",
    },
    body: JSON.stringify(launchShellCall(containerId, shellPath)),
    signal,
  });
  return requireSuccessfulResponse(response);
}

export async function sendTaskShellInput(request, endpoint, authHeader, containerId, data, signal) {
  const response = await request(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/recordio",
      "Message-Content-Type": "application/json",
    },
    body: attachInputBody(containerId, data),
    signal,
  });
  return requireSuccessfulResponse(response);
}

export async function readProcessIOStream(body, onOutput) {
  if (!body?.getReader) throw new Error("The browser did not provide a streaming response body.");
  const reader = body.getReader();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const byte of value || []) buffer += String.fromCharCode(byte);
    const decoded = consumeRecordIO(buffer);
    buffer = decoded.remainder;
    decoded.records.forEach((record) => {
      const output = parseProcessIORecord(record);
      if (output) onOutput(output);
    });
  }
  if (buffer) throw new Error("The shell output ended with an incomplete RecordIO record.");
}
