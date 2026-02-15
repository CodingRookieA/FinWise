import * as React from "react";
import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import theme from "../../theme";

import ProfileContent from "../../components/profileSections/placeholder_content";
import Sidebar from "../../components/profileSections/sidebar";

export default function ProfilePage() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

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
          <Sidebar />
          <ProfileContent />
        </Box>
      </Box>
    </ThemeProvider>
  );
}
