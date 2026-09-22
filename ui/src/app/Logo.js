import { Stack, Typography } from "@mui/material";
import logo from "../images/clusterd.png";

export default function Logo() {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <img src={logo} className="topbar-logo" alt="ClusterD" />
      <Typography variant="h6" fontWeight={700}>ClusterD</Typography>
    </Stack>
  );
}
