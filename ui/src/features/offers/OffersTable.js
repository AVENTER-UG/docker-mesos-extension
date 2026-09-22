import React from "react";
import {
  Box,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { formatFrameworkResource } from "../../dialogs/frameworkDetails";
import { PAGE_SIZE, PaginationControls, pageCountFor } from "../../components/PaginationControls";

export default function OffersTable({ offers = [] }) {
  const sortedOffers = Array.isArray(offers) ? [...offers] : [];
  const [page, setPage] = React.useState(1);
  const pageCount = pageCountFor(sortedOffers.length);
  const pagedOffers = sortedOffers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  React.useEffect(() => setPage((current) => Math.min(current, pageCount)), [pageCount]);

  return (
    <Paper elevation={0}>
      <Typography variant="h6" sx={{ p: 2 }}>Outstanding Offers</Typography>
      <TableContainer component={Box}>
        <Table sx={{ minWidth: 900 }} size="small" aria-label="Outstanding offers">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Framework</TableCell>
              <TableCell>Host</TableCell>
              <TableCell align="right">CPUs</TableCell>
              <TableCell align="right">GPUs</TableCell>
              <TableCell align="right">Memory</TableCell>
              <TableCell align="right">Disk</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedOffers.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4, color: "text.secondary" }}>No offers.</TableCell>
              </TableRow>
            )}
            {pagedOffers.map((offer) => (
              <TableRow
                hover
                key={offer.id}
              >
                <TableCell className="id-cell" title={offer.id}>{offer.id || "—"}</TableCell>
                <TableCell>{offer.allocation_info?.role || "—"}</TableCell>
                <TableCell>
                  {offer.framework_id ? (
                    <Link href={`#/frameworks/${encodeURIComponent(offer.framework_id)}`}>
                      {offer.framework_name || offer.framework_id}
                    </Link>
                  ) : "unknown"}
                </TableCell>
                <TableCell>
                  {offer.slave_id ? <Link href={`#/agents/${encodeURIComponent(offer.slave_id)}`}>{offer.hostname || offer.slave_id}</Link> : (offer.hostname || "—")}
                </TableCell>
                <TableCell align="right">{formatFrameworkResource("cpus", offer.resources?.cpus)}</TableCell>
                <TableCell align="right">{formatFrameworkResource("gpus", offer.resources?.gpus)}</TableCell>
                <TableCell align="right">{formatFrameworkResource("mem", offer.resources?.mem)}</TableCell>
                <TableCell align="right">{formatFrameworkResource("disk", offer.resources?.disk)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <PaginationControls page={page} pageCount={pageCount} onPageChange={setPage} />
      </TableContainer>
    </Paper>
  );
}