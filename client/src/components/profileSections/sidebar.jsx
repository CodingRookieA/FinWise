import * as React from "react";
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
} from "@mui/material";

import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";

const NAV = [
  { label: "Profile", path: "/profile", icon: <PersonRoundedIcon /> },
  { label: "Portfolio", path: "/portfolio", icon: <FolderRoundedIcon /> }, // keeping your spelling
  { label: "Chat", path: "/chat", icon: <ChatRoundedIcon /> },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        overflow: "hidden",
        position: { md: "sticky" },
        top: { md: 24 },
        
        minHeight: { md: "calc(100vh - 48px)" },
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ p: 2.25 }}>
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

      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Demo user: <b>demo</b>
        </Typography>
      </Box>
    </Paper>
  );
}
