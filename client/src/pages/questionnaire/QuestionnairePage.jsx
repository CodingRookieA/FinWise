import QuestionnaireCard from "../../components/questionnaireSections/card";

export function QuestionnairePage() {
  return (
    <QuestionnaireCard
      title="Questionnaire"
      prompt="This is a demo card. Next step: fetch 3 questions from backend."
      type="mcq"
      options={["Option A", "Option B", "Option C"]}
      onSubmit={(answer) => {
        console.log("Submitted:", answer);
      }}
    />
  );
}

// import { useEffect, useState } from "react";
// import QuestionnaireCard from "../../components/questionnaireSections/card";

// const DEMO_HEADERS = { "x-demo-user": "demo" };

// export function QuestionnairePage() {
//   const [loading, setLoading] = useState(true);
//   const [questions, setQuestions] = useState([]);
//   const [idx, setIdx] = useState(0);
//   const [error, setError] = useState("");

//   async function loadQuestions() {
//     try {
//       setError("");
//       setLoading(true);

//       const res = await fetch("http://localhost:9000/api/profile/questionnaire", {
//         headers: DEMO_HEADERS,
//       });

//       if (!res.ok) {
//         throw new Error(`Failed to load: ${res.status}`);
//       }

//       const data = await res.json();
//       setQuestions(data.questions || []);
//       setIdx(0);
//     } catch (e) {
//       setError(e.message || "Failed to fetch questions.");
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     loadQuestions();
//   }, []);

//   async function handleSubmit(answer) {
//     const q = questions[idx];
//     if (!q) return;

//     // Send PATCH to save answer (even if stubbed)
//     try {
//       const res = await fetch("http://localhost:9000/profile", {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//           ...DEMO_HEADERS,
//         },
//         body: JSON.stringify({ [q.field]: answer }),
//       });

//       if (!res.ok) {
//         throw new Error(`Save failed: ${res.status}`);
//       }

//       // Go next
//       setIdx((prev) => prev + 1);
//     } catch (e) {
//       setError(e.message || "Failed to save answer.");
//     }
//   }

//   if (loading) {
//     return (
//       <div style={{ textAlign: "center", marginTop: 60 }}>
//         Loading questionnaire...
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div style={{ textAlign: "center", marginTop: 60 }}>
//         <div style={{ color: "salmon", marginBottom: 12 }}>{error}</div>
//         <button onClick={loadQuestions}>Retry</button>
//       </div>
//     );
//   }

//   // finished 3
//   if (idx >= questions.length) {
//     return (
//       <div style={{ textAlign: "center", marginTop: 60 }}>
//         <h1>Questionnaire</h1>
//         <p>All questions completed 🎉</p>
//         <button onClick={loadQuestions}>Get 3 more unanswered</button>
//       </div>
//     );
//   }

//   const q = questions[idx];

//   return (
//     <div>
//       <QuestionnaireCard
//         title={`Questionnaire (${idx + 1} / ${questions.length})`}
//         prompt={q.prompt}
//         type={q.type}
//         options={q.options}
//         placeholder={q.placeholder}
//         onSubmit={handleSubmit}
//       />
//     </div>
//   );
// }
