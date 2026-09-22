export const TAB_ROUTES = [
  { value: 0, hash: "#/home" },
  { value: 1, hash: "#/" },
  { value: 2, hash: "#/tasks" },
  { value: 3, hash: "#/frameworks" },
  { value: 4, hash: "#/agents" },
  { value: 5, hash: "#/master" },
  { value: 6, hash: "#/offers" },
];

function firstRouteSegment(hash) {
  return String(hash || "")
    .trim()
    .replace(/^#/, "")
    .replace(/^\/+|\/+$/g, "")
    .split("/")[0]
    .toLowerCase();
}

export function tabValueFromHash(hash) {
  switch (firstRouteSegment(hash)) {
    case "home":
      return 0;
    case "tasks":
      return 2;
    case "frameworks":
      return 3;
    case "agents":
      return 4;
    case "master":
      return 5;
    case "offers":
      return 6;
    case "":
    case "index.html":
    default:
      return 1;
  }
}

export function hashFromTabValue(value) {
  return TAB_ROUTES.find((route) => route.value === value)?.hash || TAB_ROUTES[0].hash;
}

export function resourceIdFromHash(hash, resource) {
  const parts = String(hash || "")
    .replace(/^#\/?/, "")
    .split("/");
  if (parts[0].toLowerCase() !== String(resource || "").toLowerCase()) return null;
  if (!parts[1]) return null;
  try {
    return decodeURIComponent(parts[1]);
  } catch (_) {
    return null;
  }
}
