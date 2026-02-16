import * as React from "react";
import { Paper, Typography, Divider, Stack } from "@mui/material";
import AccountInfo from "./account_info";
import Fields from "./fields";


export default function ProfileContent({ user }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        p: { xs: 2.25, md: 3 },
        minHeight: 420,
        background:
          "radial-gradient(800px 500px at 20% -10%, rgba(14,165,233,0.18) 0%, rgba(0,0,0,0) 60%)",
      }}
    >
      <Stack spacing={2}>
        <Stack spacing={1}>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Profile
          </Typography>
        </Stack>

        {/* NEW: account info panel */}
        <AccountInfo username={user.name} email={user.email} picture={user.picture} />
      </Stack>

      <Divider sx={{ my: 2.5 }} />
      <Fields />


    </Paper>
  );
}
