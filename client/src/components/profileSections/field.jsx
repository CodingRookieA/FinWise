import * as React from "react";
import {
  Box,
  Typography,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";

/**
 * meta example:
 * {
 *   field: "income_stability",
 *   type: "mcq" | "fill",
 *   title: "Income Stability",
 *   prompt: "...",
 *   options?: ["stable","unstable"...],
 *   inputType?: "number" | "text",
 *   placeholder?: "e.g., 3000"
 * }
 */
export default function Field({ meta, value, onChange }) {
  const { field, title, type, options = [], inputType, placeholder } = meta;

  const label = title || field;

  // Ensure controlled input (never undefined)
  const safeValue = value ?? "";

  return (
  <Box
    sx={{
      display: "grid",
      gap: 1.25,
      maxWidth: 420,   // ✅ slimmer
      width: "100%",
      mx: "auto",      // ✅ centered in its grid cell
    }}
  >
    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
      {label}
    </Typography>

    {/* MCQ => dropdown */}
    {type === "mcq" ? (
      <FormControl fullWidth>
        <Select
          value={value ?? ""}
          onChange={(e) => onChange(field, e.target.value)}
          displayEmpty
          renderValue={(selected) => {
            if (!selected) return <span style={{ opacity: 0.7 }}>Not set</span>;
            return selected;
          }}
          sx={{
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.03)",
            "& .MuiSelect-select": { py: 1.25, px: 2 }, // ✅ shorter height
          }}
        >
          <MenuItem value="">
            <em>Not set</em>
          </MenuItem>

          {options.map((opt) => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    ) : (
      <TextField
        fullWidth
        value={safeValue}
        onChange={(e) => onChange(field, e.target.value)}
        placeholder={placeholder || (inputType === "number" ? "e.g., 3000" : "")}
        type={inputType === "number" ? "number" : "text"}
        InputLabelProps={{ shrink: true }}
        sx={{
          "& .MuiOutlinedInput-root": {
            backgroundColor: "rgba(255,255,255,0.03)",
            borderRadius: 999, // ✅ match pill style
          },
          "& .MuiOutlinedInput-input": { py: 1.25, px: 2 }, // ✅ shorter height
          "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
            { WebkitAppearance: "none", margin: 0 },
          "& input[type=number]": { MozAppearance: "textfield" },
        }}
      />
    )}
  </Box>
);

}
