import { Box } from "@mui/material";
import { useLocation } from "react-router-dom";

import ProfileContent from "../../components/profileSections/placeholder_content";
import Sidebar from "../../components/sidebar/sidebar";

export default function ProfilePage({ user, logout }) {
  const location = useLocation();
  const [activeSection, setActiveSection] = React.useState("general");

  // If navigated from another page with a section in state, set it
  React.useEffect(() => {
    if (location.state?.section) {
      setActiveSection(location.state.section);
    }
  }, [location.state?.section]);

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
            <Sidebar user={user} logout={logout} activeSection={activeSection} onSectionChange={setActiveSection} />
            <ProfileContent user={user} activeSection={activeSection} />
        </Box>
    </Box>
  );
}
