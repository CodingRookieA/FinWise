import * as React from "react";
import { Paper, Stack, Avatar, Typography, Chip, Divider, Box } from "@mui/material";

function initialsFromName(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export default function AccountInfo({
  name,
  email,
}) {
  const initials = initialsFromName(name);

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        p: { xs: 2, md: 2.25 },
        border: "1px solid",
        borderColor: "divider",
        background:
          "radial-gradient(900px 500px at 10% -20%, rgba(14,165,233,0.16) 0%, rgba(0,0,0,0) 60%)",
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar
          sx={{
            width: 44,
            height: 44,
            bgcolor: "rgba(14,165,233,0.18)",
            color: "text.primary",
            fontWeight: 900,
            border: "1px solid rgba(14,165,233,0.35)",
          }}
        >
          {initials}
        </Avatar>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
            {name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-word" }}>
            {email}
          </Typography>
        </Box>

        <Chip
          label="Account"
          size="small"
          sx={{
            bgcolor: "rgba(16,185,129,0.12)",
            border: "1px solid rgba(16,185,129,0.35)",
            color: "text.primary",
            fontWeight: 700,
          }}
        />
      </Stack>



    </Paper>
  );
}
