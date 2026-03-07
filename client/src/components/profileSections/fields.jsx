import * as React from "react";
import {
  Paper,
  Typography,
  Divider,
  Box,
  Stack,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";

import Field from "./field";

export default function Fields({ activeSection = "general" }) {
  const [meta, setMeta] = React.useState([]);      // questions array from /meta
  const [values, setValues] = React.useState({});  // profile values from /api/profile
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(null);

const isYes = (v) => typeof v === "string" && v.trim().toLowerCase() === "yes";

const clearFields = (keys) => {
  setValues((prev) => {
    const next = { ...prev };
    for (const k of keys) next[k] = null;
    return next;
  });
};

const DEPENDENCIES = {
  // mutual fund detail fields depend on has_mutual_funds
  where_mutual_funds: ["has_mutual_funds"],
  type_mutual_funds: ["has_mutual_funds"],
  fee_level_mutual_funds: ["has_mutual_funds"],
  mutual_funds_amount: ["has_mutual_funds"],

  // ETF detail fields depend on has_ETFs
  where_ETFs: ["has_ETFs"],
  type_ETFs: ["has_ETFs"],
  ETFs_amount: ["has_ETFs"],
  frequency_ETFs: ["has_ETFs"],
};

const shouldDisableField = (field, currentValues) => {
  const prereqs = DEPENDENCIES[field];
  if (!prereqs) return false; // not a dependent field

  // Disable if any prereq is NOT "yes"
  return !prereqs.every((p) => isYes(currentValues[p]));
};


  // load profile values + meta definitions
  React.useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        const [metaRes, profileRes] = await Promise.all([
          fetch("http://localhost:9000/api/profile/meta", {
            headers: { "x-demo-user": "demo" },
            credentials: 'include'
          }),
          fetch("http://localhost:9000/api/profile", {
            headers: { "x-demo-user": "demo" },
            credentials: 'include'
          }),
        ]);

        if (!metaRes.ok) throw new Error("Failed to load profile fields (meta).");
        if (!profileRes.ok) throw new Error("Failed to load profile.");

        const metaData = await metaRes.json();
        const profileData = await profileRes.json();

        setMeta(metaData.questions || []);
        setValues(profileData || {});
      } catch (e) {
        console.error(e);
        setError(e.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const handleChange = (field, rawValue) => {
    setValues((prev) => ({ ...prev, [field]: rawValue }));

    // Clear dependent fields if prerequisite is set to "no"
    if (field === "has_ETFs" && !isYes(rawValue)) {
      clearFields(["where_ETFs", "type_ETFs", "ETFs_amount", "frequency_ETFs"]);
    }

    if (field === "has_mutual_funds" && !isYes(rawValue)) {
      clearFields([
        "where_mutual_funds",
        "type_mutual_funds",
        "fee_level_mutual_funds",
        "mutual_funds_amount",
      ]);
    }
  };


  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Build payload ONLY for known fields from meta
      const payload = {};
      for (const q of meta) {
        const key = q.field;
        if (!key) continue;

        let v = values[key];

        // Convert numeric fills to Number (or null if empty)
        if (q.type !== "mcq" && q.inputType === "number") {
          if (v === "" || v == null) v = null;
          else v = Number(v);
        } else {
          // For selects/text: empty string => null
          if (v === "") v = null;
        }

        payload[key] = v;
      }

      const res = await fetch("http://localhost:9000/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-demo-user": "demo",
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save profile.");

      setSuccess("Saved!");
    } catch (e) {
      console.error(e);
      setError(e.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };


  const getSectionFields = (section) => {
    return meta.filter((q) => q.section === section);
  };


  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        p: { xs: 2.25, md: 3 },
        background:
          "radial-gradient(800px 500px at 20% -10%, rgba(14,165,233,0.18) 0%, rgba(0,0,0,0) 60%)",
      }}
    >
      <Stack spacing={1}>
        <Typography variant="h5" sx={{ fontWeight: 700, textTransform: "capitalize" }}>
          {activeSection === "general" ? "Profile" : activeSection.replace("_", " ")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Edit your info and click Save.
        </Typography>
      </Stack>

      <Divider sx={{ my: 2.5 }} />

      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography color="text.secondary">Loading…</Typography>
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error" variant="outlined" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && success && (
        <Alert severity="success" variant="outlined" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {!loading && !error && meta.length > 0 && (
        <>
          {/* RENDER ACTIVE SECTION FIELDS */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sd: "1fr 1fr", md: "1fr 1fr 1fr" },
              gap: 2,
              alignItems: "start",
              mb: 3,
            }}
          >
            {getSectionFields(activeSection).map((q) => (
              <Field
                key={q.field}
                meta={q}
                value={values[q.field]}
                onChange={handleChange}
                disabled={shouldDisableField(q.field, values)}
              />
            ))}
          </Box>

          <Divider sx={{ my: 2.5 }} />

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              startIcon={
                saving ? <CircularProgress size={18} color="inherit" /> : <SaveRoundedIcon />
              }
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </Box>
        </>
      )}

      {!loading && !error && getSectionFields(activeSection).length === 0 && (
        <Alert severity="info" variant="outlined">
          No fields available.
        </Alert>
      )}
    </Paper>
  );
}
