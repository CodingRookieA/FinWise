import { Profile } from "../models/profile.js";

const ALL_FIELDS = [
  "income_stability",
  "employment_status",
  "risk_tolerance",
  "investment_experience",
  "financial_goal",
  "housing_status",
  "monthly_income",
  "savings_balance",
  "debt_amount",
];

function getDemoUserId(req) {
  // Temporary until login exists:
  // Frontend sends headers: { "x-demo-user": "demo" }
  return req.header("x-demo-user") || "demo";
}

function pickRandom(items, k) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, k);
}

export default {
  async getProfile(req, res) {
    try {
      const userId = getDemoUserId(req);

      let profile = await Profile.findOne({ userId });
      if (!profile) {
        profile = await Profile.create({ userId }); // defaults -> null
      }

      return res.status(200).json(profile);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to get profile." });
    }
  },

  async patchProfile(req, res) {
    try {
      const userId = getDemoUserId(req);

      // Only allow updates to known fields
      const updates = {};
      for (const key of ALL_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(req.body, key)) {
          updates[key] = req.body[key];
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No valid fields provided." });
      }

      const updated = await Profile.findOneAndUpdate(
        { userId },
        { $set: updates },
        { new: true, upsert: true, runValidators: true }
      );

      return res.status(200).json(updated);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to update profile." });
    }
  },

  // async getRandomUnanswered(req, res) {

  //   try {
  //     const userId = getDemoUserId(req);

  //     let profile = await Profile.findOne({ userId });
  //     if (!profile) profile = await Profile.create({ userId });

  //     const unanswered = ALL_FIELDS.filter((f) => {
  //       const v = profile[f];
  //       // null/undefined OR empty string
  //       return v == null || (typeof v === "string" && v.trim() === "");
  //     });

  //     const pickedFields = pickRandom(unanswered, Math.min(3, unanswered.length));
  //         console.log("userId:", userId);
  //         console.log("unanswered:", unanswered);
  //         console.log("pickedFields:", pickedFields);

  //     return res.status(200).json({
  //       pickedFields,
  //       remainingUnansweredCount: unanswered.length,
  //     });
  //   } catch (err) {
  //     console.error(err);
  //     return res.status(500).json({ error: "Failed to pick questions." });
  //   }
  // },


  // For demo purposes, just return 3 random fields without checking profile
async getRandomUnanswered(req, res) {
  return res.json({
    questions: [
      {
        field: "risk_tolerance",
        type: "mcq",
        title: "Risk tolerance",
        prompt: "How much risk are you comfortable with?",
        options: ["low", "medium", "high"],
      },
      {
        field: "monthly_income",
        type: "fill",
        title: "Monthly income",
        prompt: "What is your approximate monthly income (CAD)?",
        placeholder: "e.g., 3000",
      },
      {
        field: "housing_status",
        type: "mcq",
        title: "Housing status",
        prompt: "What is your housing status?",
        options: ["rent", "own_with_mortgage", "own_no_mortgage", "live_with_family", "student_housing"],
      },
    ],
  });
}

};
