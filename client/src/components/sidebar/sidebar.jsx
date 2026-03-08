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
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";

import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

const NAV = [
  { label: "Chat", path: "/chat", icon: <ChatRoundedIcon /> },
  { label: "Profile", path: "/profile", icon: <PersonRoundedIcon /> },
  { label: "Portfolio", path: "/portfolio", icon: <FolderRoundedIcon /> },
  { label: "Plaid", path: "/connect-plaid", icon: <AccountBalanceRoundedIcon /> },
];

const PROFILE_SECTIONS = [
  { label: "Profile", value: "general", icon: <PersonRoundedIcon /> },
  { label: "ETFs", value: "etfs", icon: <TrendingUpIcon /> },
  { label: "Mutual Funds", value: "mutual_funds", icon: <AccountBalanceIcon /> },
];

export default function Sidebar({ user, logout, activeSection, onSectionChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isProfilePage = location.pathname === "/profile";

  // Always show all items consistently
  const itemsToShow = [
    // Profile sections
    ...PROFILE_SECTIONS.map(section => ({
      ...section,
      isSection: true,
      onClick: () => {
        if (isProfilePage) {
          // Already on profile page, just change section
          onSectionChange?.(section.value);
        } else {
          // Navigate to profile with section
          navigate("/profile", { state: { section: section.value } });
        }
      },
      isActive: isProfilePage && activeSection === section.value,
    })),
    // Portfolio
    {
      label: "Portfolio",
      icon: <FolderRoundedIcon />,
      onClick: () => navigate("/portfolio"),
      isActive: location.pathname === "/portfolio",
    },
  ];

  // Chat item for use in the list
  const chatItem = {
    label: "Chat",
    icon: <ChatRoundedIcon />,
    onClick: () => navigate("/chat"),
    isActive: location.pathname === "/chat",
  };

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
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              FinWise
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Navigate
            </Typography>
          </Box>

          <Divider />

          <List sx={{ p: 1, flex: 1 }}>
            {/* SHOW ITEMS CONSISTENTLY */}
            {itemsToShow.map((item) => (
              <ListItemButton
                key={item.label}
                onClick={item.onClick}
                selected={item.isActive}
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
                    color: item.isActive ? "primary.main" : "text.secondary",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    sx: { fontWeight: item.isActive ? 800 : 600 },
                  }}
                />
              </ListItemButton>
            ))}

            {/* Chat under Portfolio */}
            <ListItemButton
              onClick={chatItem.onClick}
              selected={chatItem.isActive}
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
                  color: chatItem.isActive ? "primary.main" : "text.secondary",
                }}
              >
                {chatItem.icon}
              </ListItemIcon>
              <ListItemText
                primary={chatItem.label}
                primaryTypographyProps={{
                  sx: { fontWeight: chatItem.isActive ? 800 : 600 },
                }}
              />
            </ListItemButton>
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
