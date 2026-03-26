import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import QuestionnaireCard from "../../components/questionnaireSections/card";

import { ThemeProvider } from "@mui/material/styles";
import theme from "../../theme";

import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";

export function QuestionnairePage() {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const response = await fetch(
            "http://localhost:9000/api/profile/questionnaire",
            {
                method: "GET",
                headers: { "x-demo-user": "demo" },
                credentials: 'include'
            }
        );

        if (!response.ok) throw new Error("Failed to fetch questions");

        const data = await response.json();
        const qs = data.questions || [];

        // ✅ if no questions, go to chat
        if (qs.length === 0) {
          navigate("/chat", { replace: true });
          return;
        }

        setQuestions(qs);
        setCurrentIndex(0);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [navigate]);

  const handleSubmit = async (answer) => {
    if (currentIndex >= questions.length) return;

    const currentQuestion = questions[currentIndex];
    const payload = { [currentQuestion.field]: answer };

    try {
      setSubmitting(true);

      const response = await fetch("http://localhost:9000/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-demo-user": "demo",
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save answer");

      // ✅ last question => go to chat
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        navigate("/chat", { replace: true });
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestion = questions[currentIndex];
  const questionType = currentQuestion?.type === "fill" ? "number" : "mcq";

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          display: "flex",
          alignItems: "center",
          py: { xs: 6, md: 10 },
          position: "relative",
          overflow: "hidden",
          "&:before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(800px 400px at 50% 20%, rgba(14,165,233,0.16), transparent 60%), radial-gradient(900px 500px at 15% 80%, rgba(16,185,129,0.10), transparent 55%)",
            pointerEvents: "none",
          },
        }}
      >
        <Container maxWidth="md" sx={{ position: "relative" }}>
          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
              Tell us about{" "}
              <Box component="span" sx={{ color: "secondary.main" }}>
                yourself
              </Box>
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
              We collect some necessary information to enhance your experience
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography
                component="button"
                onClick={() => navigate("/chat", { replace: true })}
                sx={{
                  background: "none",
                  border: "none",
                  color: "secondary.main",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: 800,
                  letterSpacing: 0.2,
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                  "&:hover": { color: "#34d399" },
                }}
              >
                Skip for now
              </Typography>
            </Box>
          </Box>

          {/* States */}
          {loading && (
            <Box sx={{ display: "grid", placeItems: "center", mt: 6 }}>
              <CircularProgress />
              <Typography sx={{ mt: 2, color: "text.secondary" }}>
                Loading questions...
              </Typography>
            </Box>
          )}

          {!loading && error && (
            <Box sx={{ maxWidth: 720, mx: "auto" }}>
              <Alert severity="error" variant="outlined">
                {error}
              </Alert>
            </Box>
          )}

          {!loading && !error && questions.length > 0 && (
            <QuestionnaireCard
              key={currentQuestion.field}
              title={currentQuestion.title}
              prompt={currentQuestion.prompt}
              type={questionType}
              options={currentQuestion.options || []}
              placeholder={currentQuestion.placeholder}
              loading={submitting}
              onSubmit={handleSubmit}
              currentIndex={currentIndex}
              total={questions.length}
              onPrev={currentIndex > 0 ? () => setCurrentIndex((i) => i - 1) : null}
            />
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}
