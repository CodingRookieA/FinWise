import * as React from "react";
import { Box } from "@mui/material";

import ProfileContent from "../../components/profileSections/placeholder_content";
import Sidebar from "../../components/sidebar/sidebar";

export default function ProfilePage({ user, logout }) {
  return (
    <Box
        sx={{
            minHeight: "100vh",
            bgcolor: "background.default",
            px: { xs: 1, md: 4 },
            py: { xs: 2, md: 3 },
        }}
    >
        <Box
            sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 3fr" }, // left ~1/4, right ~3/4
            gap: 3,
            alignItems: "stretch",
            maxWidth: "none",
            mx: 0,
            }}
        >
            <Sidebar user={user} logout={logout} />
            <ProfileContent user={user} />
        </Box>
    </Box>
  );
}
