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


function getUserId(req){
  const userId = req.session?.userId;
  if (!userId) return null;
  return userId;
}

async function findOrCreateProfile(userId) {
  let profile = await Profile.findOne({ userId });
  if (!profile) profile = await Profile.create({ userId });
  return profile;
}



function pickRandom(items, k) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, k);
}

function titleFromField(field) {
  return field
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function defaultPrompt(title) {
  return `Please answer: ${title}`;
}

const QUESTION_META = {
  risk_tolerance: { prompt: "How much risk are you comfortable with?" },
  monthly_income: {
    prompt: "What is your approximate monthly income (CAD)?",
    placeholder: "e.g., 3000",
  },
};

function buildQuestionFromSchema(field) {
  const path = Profile.schema.path(field);
  if (!path) return null;

  const title = QUESTION_META[field]?.title || titleFromField(field);
  const prompt = QUESTION_META[field]?.prompt || defaultPrompt(title);

  const enumValues = Array.isArray(path.enumValues) ? path.enumValues : [];
  const isNumber = path.instance === "Number";

  // If it has enum => MCQ
  if (enumValues.length > 0) {
    return {
      field,
      type: "mcq",
      title,
      prompt,
      options: enumValues,
    };
  }

  // Otherwise => fill input
  return {
    field,
    type: "fill",
    title,
    prompt,
    inputType: isNumber ? "number" : "text",
    placeholder:
      QUESTION_META[field]?.placeholder ||
      (isNumber ? "e.g., 3000" : "Type your answer..."),
  };
}

export default {
  async getProfile(req, res) {
    try {
      const userId = getDemoUserId(req);
      // const userId = getUserId(req);
      // if (!userId) return res.status(401).json({ error: "Not logged in" });
      const profile = await findOrCreateProfile(userId);

      return res.status(200).json(profile);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to get profile." });
    }
  },

  async patchProfile(req, res) {
    try {
      const userId = getDemoUserId(req);
      // const userId = getUserId(req);
      // if (!userId) return res.status(401).json({ error: "Not logged in" });

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

  async getRandomUnanswered(req, res) {
    try {
      const userId = getDemoUserId(req);
      // const userId = getUserId(req);
      // if (!userId) return res.status(401).json({ error: "Not logged in" });

      const profile = await findOrCreateProfile(userId);

      const unanswered = ALL_FIELDS.filter((f) => {
        const v = profile[f];
        return v == null || (typeof v === "string" && v.trim() === "");
      });

      const pickedFields = pickRandom(unanswered, Math.min(3, unanswered.length));
      const questions = pickedFields.map(buildQuestionFromSchema).filter(Boolean);

      return res.status(200).json({
        questions,
        pickedFields,
        remainingUnansweredCount: unanswered.length,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to pick questions." });
    }
  },


  async getAllFields(req, res) {
  try {
    // keep ordering exactly as ALL_FIELDS
    const questions = ALL_FIELDS.map(buildQuestionFromSchema).filter(Boolean);

    return res.status(200).json({
      questions,
      total: questions.length,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to get questions." });
  }
},


};
