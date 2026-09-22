import {
  attachInputBody,
  consumeRecordIO,
  createSessionContainerId,
  decodeRecordIO,
  launchTaskShell,
  launchShellCall,
  parseProcessIORecord,
  readProcessIOStream,
  recordIOEncode,
  sendTaskShellInput,
  TASK_SHELLS,
} from "./taskExecApi";

const parent = { value: "synthetic-parent" };
const session = { value: "synthetic-session", parent };

test("builds a nested interactive shell session under the task container", () => {
  expect(launchShellCall(session)).toEqual({
    type: "LAUNCH_NESTED_CONTAINER_SESSION",
    launch_nested_container_session: {
      container_id: session,
      command: {
        value: "/bin/sh",
        arguments: ["/bin/sh", "-i"],
        shell: false,
      },
      container: { type: "MESOS", tty_info: {} },
    },
  });
});

test("creates a unique nested session id without losing the task container hierarchy", () => {
  expect(createSessionContainerId(parent, "synthetic-uuid")).toEqual({
    value: "webui-shell-synthetic-uuid",
    parent,
  });
});

test("builds a bash shell command when bash is selected", () => {
  expect(TASK_SHELLS).toEqual(["/bin/sh", "/bin/bash"]);
  expect(launchShellCall(session, "/bin/bash").launch_nested_container_session.command).toEqual({
    value: "/bin/bash",
    arguments: ["/bin/bash", "-i"],
    shell: false,
  });
  expect(launchShellCall(session, "/bin/zsh").launch_nested_container_session.command.value).toBe("/bin/sh");
});

test("encodes the container handshake and stdin as RecordIO", () => {
  const body = attachInputBody(session, "printf synthetic\\n");
  const records = decodeRecordIO(body).map(JSON.parse);

  expect(records).toEqual([
    {
      type: "ATTACH_CONTAINER_INPUT",
      attach_container_input: { type: "CONTAINER_ID", container_id: session },
    },
    {
      type: "ATTACH_CONTAINER_INPUT",
      attach_container_input: {
        type: "PROCESS_IO",
        process_io: { type: "DATA", data: { type: "STDIN", data: "cHJpbnRmIHN5bnRoZXRpY1xu" } },
      },
    },
  ]);
});

test("decodes stdout and ignores control records", () => {
  expect(parseProcessIORecord(JSON.stringify({
    type: "DATA",
    data: { type: "STDOUT", data: "c3ludGhldGljLW91dHB1dA==" },
  }))).toEqual({ stream: "stdout", data: "synthetic-output" });
  expect(parseProcessIORecord(JSON.stringify({ type: "CONTROL" }))).toBeNull();
});

test("uses UTF-8 byte lengths for RecordIO framing", () => {
  expect(recordIOEncode("ä")).toBe("2\nä");
});

test("keeps incomplete streaming RecordIO data for the next chunk", () => {
  expect(consumeRecordIO("5\nhello4\nte")).toEqual({ records: ["hello"], remainder: "4\nte" });
});

test("launches and writes to a shell through the unauthenticated agent API", async () => {
  const response = { ok: true, body: {} };
  const request = jest.fn().mockResolvedValue(response);
  const signal = {};

  await expect(launchTaskShell(request, "/agent/api/v1", "Basic synthetic", session, signal)).resolves.toBe(response);
  expect(request).toHaveBeenCalledWith("/agent/api/v1", {
    method: "POST",
    headers: {
      Accept: "application/recordio",
      "Content-Type": "application/json",
      "Message-Accept": "application/json",
    },
    body: JSON.stringify(launchShellCall(session)),
    signal,
  });

  request.mockClear();
  await sendTaskShellInput(request, "/agent/api/v1", "Basic synthetic", session, "id\n", signal);
  expect(request).toHaveBeenCalledWith("/agent/api/v1", expect.objectContaining({
    method: "POST",
    headers: expect.objectContaining({
      Accept: "application/json",
      "Content-Type": "application/recordio",
      "Message-Content-Type": "application/json",
    }),
    body: attachInputBody(session, "id\n"),
    signal,
  }));
});

test("reads ProcessIO output across streamed RecordIO chunk boundaries", async () => {
  const payload = recordIOEncode(JSON.stringify({
    type: "DATA",
    data: { type: "STDERR", data: "c3ludGhldGljLWVycm9y" },
  }));
  const chunks = [payload.slice(0, 7), payload.slice(7)];
  const reader = {
    read: jest.fn()
      .mockResolvedValueOnce({ done: false, value: Uint8Array.from(chunks[0], (character) => character.charCodeAt(0)) })
      .mockResolvedValueOnce({ done: false, value: Uint8Array.from(chunks[1], (character) => character.charCodeAt(0)) })
      .mockResolvedValueOnce({ done: true }),
  };
  const output = jest.fn();

  await readProcessIOStream({ getReader: () => reader }, output);

  expect(output).toHaveBeenCalledWith({ stream: "stderr", data: "synthetic-error" });
});
