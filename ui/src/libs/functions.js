import React from "react";
import { Chip } from "@mui/material";

export function FormatTimeDifference(registeredTime) {
  const now = new Date();
  const registeredDate = new Date(Math.floor(registeredTime) * 1000);

  const diffMs = now - registeredDate;

	// min
  const diffMin = Math.floor(diffMs / (1000 * 60));
  if (diffMin <= 60) {
    return `${diffMin} min${diffMin !== 1 ? 's' : ''}`;
  }

	// hours
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours <= 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  }

	// days
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 30) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  }

  // months
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths <= 12) {
    return `${diffMonths} month${diffMonths !== 1 ? 's' : ''}`;
  }

  // years
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} year${diffYears !== 1 ? 's' : ''}`;
}

export function StateBadge({ state }) {
  if (!state) return null;
  const stateName = String(state).replace(/^TASK_/, "");
  const color = state === "TASK_RUNNING"
    ? "success"
    : ["TASK_FAILED", "TASK_ERROR", "TASK_KILLED", "TASK_LOST"].includes(state)
      ? "error"
      : ["TASK_STARTING", "TASK_STAGING", "TASK_UNREACHABLE"].includes(state)
        ? "warning"
        : "default";
  return <Chip label={stateName} color={color} size="small" />;
}


export function HealthBadge({ health }) {
  if (!health) return null;
  return (
    <span className={`health-badge health-${health.toLowerCase()}`}>
      {health}
    </span>
  );
}



