import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Divider,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Button,
  CircularProgress,
} from "@mui/material";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

export default function QuestionnaireCard({
  title = "Question",
  prompt,
  type, // "mcq" | "text" | "number"
  options = [],
  placeholder,
  onSubmit,
  loading = false,

  // optional extras (passed from QuestionnairePage)
  currentIndex,
  total,
  onPrev,
}) {
  const [value, setValue] = useState("");


  const canSubmit = useMemo(() => {
    if (type === "number") return value !== "" && !Number.isNaN(Number(value));
    return Boolean(value);
  }, [type, value]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    const finalValue = type === "number" ? Number(value) : value;
    onSubmit?.(finalValue);
  };

  return (
    <Box sx={{ maxWidth: 760, mx: "auto" }}>
      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          {/* Top row: title + progress */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              mb: 1,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {title}
            </Typography>

            {typeof currentIndex === "number" && typeof total === "number" && (
              <Chip
                label={`${currentIndex + 1} / ${total}`}
                variant="outlined"
                sx={{
                  borderColor: "divider",
                  color: "text.secondary",
                  bgcolor: "transparent",
                }}
              />
            )}
          </Box>

          <Typography variant="body1" sx={{ color: "text.secondary", mb: 3 }}>
            {prompt}
          </Typography>

          <Divider sx={{ mb: 3, borderColor: "divider" }} />

          <Box component="form" onSubmit={handleSubmit}>
            {/* MCQ */}
            {type === "mcq" && (
              <ToggleButtonGroup
                exclusive
                value={value}
                onChange={(_, v) => {
                  if (v !== null) setValue(v);
                }}
                orientation="vertical"
                fullWidth
                sx={{
                  gap: 1.25,
                  "& .MuiToggleButtonGroup-grouped": {
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    justifyContent: "center",
                    py: 1.3,
                    fontSize: "1rem",
                    color: "text.primary",
                    textTransform: "none",
                    "&.Mui-selected": {
                      borderColor: "primary.main",
                      backgroundColor: "rgba(14,165,233,0.18)",
                    },
                  },
                }}
              >
                {options.map((opt) => (
                  <ToggleButton key={opt} value={opt}>
                    {opt}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            )}

            {/* Text / Number */}
            {(type === "text" || type === "number") && (
              <TextField
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={
                  placeholder || (type === "number" ? "e.g., 3000" : "Type your answer…")
                }
                type={type === "number" ? "number" : "text"}
                fullWidth
                autoFocus
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "rgba(255,255,255,0.03)",
                    borderRadius: 2,
                  },
                  "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button": {
                    WebkitAppearance: "none",
                    margin: 0,
                  },
                  "& input[type=number]": {
                    MozAppearance: "textfield",
                  },
                }}
              />
            )}

            <CardActions
                sx={{
                  px: 0,
                  pt: 3,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={<ArrowBackRoundedIcon />}
                  onClick={onPrev || undefined}
                  disabled={!onPrev || loading}
                  sx={{ borderColor: "divider", color: "text.primary" }}
                >
                  Previous
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={!canSubmit || loading}
                  endIcon={
                    loading ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <ArrowForwardRoundedIcon />
                    )
                  }
                >
                  {loading ? "Saving..." : "Submit"}
                </Button>
            </CardActions>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
