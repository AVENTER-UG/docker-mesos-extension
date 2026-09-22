import React from "react";
import { Box, Button } from "@mui/material";

export const PAGE_SIZE = 15;

export function pageCountFor(length, pageSize = PAGE_SIZE) {
  return Math.max(1, Math.ceil((Number(length) || 0) / pageSize));
}

export function PaginationControls({ page, pageCount, onPageChange }) {
  if (pageCount <= 1) return null;
  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 0.5, flexWrap: "wrap", p: 1.5 }}>
      <Button size="small" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Prev</Button>
      {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
        <Button
          key={number}
          size="small"
          variant={number === page ? "contained" : "text"}
          aria-current={number === page ? "page" : undefined}
          onClick={() => onPageChange(number)}
        >
          {number}
        </Button>
      ))}
      <Button size="small" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>Next</Button>
    </Box>
  );
}
