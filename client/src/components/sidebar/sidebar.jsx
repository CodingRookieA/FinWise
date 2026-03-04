import * as React from "react";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import { useLocation, useNavigate } from "react-router-dom";

import {
  Box,
  Paper,
  Typography,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
} from "@mui/material";

import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";

const NAV = [
  { label: "Profile", path: "/profile", icon: <PersonRoundedIcon /> },
  { label: "Portfolio", path: "/portfolio", icon: <FolderRoundedIcon /> }, // keeping your spelling
];

export default function Sidebar({ user, logout }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>

    <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            position: { md: "sticky" },
            top: { md: 24 },

            minHeight: { md: "calc(100vh - 48px)" },
            maxHeight: { md: "calc(100vh - 48px)" },
            display: "flex",
            flexDirection: "column",
          }}
        >
          
          <Box sx={{ p: 2.25 }}>
            {/* Underlined Chat link at the top-left INSIDE the sidebar (no overlap) */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <ChatRoundedIcon fontSize="small" sx={{ color: "primary.main" }} />
              <Typography
                component="button"
                onClick={() => navigate("/chat")}
                sx={{
                  p: 0,
                  m: 0,
                  border: "none",
                  background: "transparent",
                  color: "primary.main",
                  fontWeight: 700,
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontSize: "0.95rem",
                  "&:hover": { opacity: 0.85 },
                }}
              >
                Chat
              </Typography>
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              FinWise
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Navigate
            </Typography>
          </Box>

          <Divider />

          <List sx={{ p: 1, flex: 1 }}>
            {NAV.map((item) => {
              const active = location.pathname === item.path;

              return (
                <ListItemButton
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  selected={active}
                  sx={{
                    borderRadius: 2,
                    mb: 0.75,
                    "&.Mui-selected": {
                      bgcolor: "rgba(14, 165, 233, 0.14)",
                      border: "1px solid rgba(14, 165, 233, 0.35)",
                    },
                    "&.Mui-selected:hover": {
                      bgcolor: "rgba(14, 165, 233, 0.18)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: active ? "primary.main" : "text.secondary",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      sx: { fontWeight: active ? 800 : 600 },
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>

          <Divider />

          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
            <Button variant="outlined" color="error" sx={{marginBottom: '0.5rem'}} onClick={logout}>
              Logout
            </Button>
            <Typography variant="caption" color="text.secondary">
              <b>{user.name}</b>: {user.email}
            </Typography>
          </Box>
        </Paper>
    </>
  );
}
