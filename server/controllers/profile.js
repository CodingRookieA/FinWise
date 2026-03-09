import { Profile } from "../models/profile.js";

// Define which section each field belongs to
const SECTION_MAPPING = {
  general: [
    "income_stability",
    "employment_status",
    "risk_tolerance",
    "investment_experience",
    "financial_goal",
    "housing_status",
    "monthly_income",
    "savings_balance",
    "debt_amount",
    "has_TFSA",
  ],
  mutual_funds: [
    "has_mutual_funds",
    "where_mutual_funds",
    "type_mutual_funds",
    "fee_level_mutual_funds",
    "mutual_funds_amount",
  ],
  etfs: [
    "has_ETFs",
    "where_ETFs",
    "type_ETFs",
    "ETFs_amount",
    "frequency_ETFs",
  ],
};

// Flatten to get all fields and track which section they belong to
const ALL_FIELDS = Object.values(SECTION_MAPPING).flat();

// Create reverse mapping: field => section
const FIELD_TO_SECTION = {};
for (const [section, fields] of Object.entries(SECTION_MAPPING)) {
  fields.forEach((field) => {
    FIELD_TO_SECTION[field] = section;
  });
}

const DEPENDENCIES = {
  // Mutual funds details only make sense if user has mutual funds
  where_mutual_funds: ["has_mutual_funds"],
  type_mutual_funds: ["has_mutual_funds"],
  fee_level_mutual_funds: ["has_mutual_funds"],
  mutual_funds_amount: ["has_mutual_funds"],

  // ETFs details only make sense if user has ETFs
  where_ETFs: ["has_ETFs"],
  type_ETFs: ["has_ETFs"],
  ETFs_amount: ["has_ETFs"],
  frequency_ETFs: ["has_ETFs"],
  // (If you later add fee_level_ETFs, add it here too)
};


function isTruthyYes(value) {
  // adapt to your enum values
  // If your schema stores "yes"/"no"/"not sure", this works.
  if (typeof value !== "string") return false;
  return value.toLowerCase() === "yes";
}

function prereqsSatisfied(profile, field) {
  const prereqs = DEPENDENCIES[field];
  if (!prereqs) return true;

  // All prereqs must be "yes"
  return prereqs.every((p) => isTruthyYes(profile[p]));
}

function isUnanswered(profile, field) {
  const v = profile[field];
  return v == null || (typeof v === "string" && v.trim() === "");
}





// function getDemoUserId(req) {
  // Temporary until login exists:
  // Frontend sends headers: { "x-demo-user": "demo" }
  // return "698f832ec32381ba1242cfb6";
// }


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
  // General fields
  income_stability: { 
    prompt: "How stable is your income?" 
  },
  employment_status: { 
    prompt: "What is your current employment status?" 
  },
  risk_tolerance: { 
    prompt: "How much risk are you comfortable with?" 
  },
  investment_experience: { 
    prompt: "What is your level of investing experience?" 
  },
  financial_goal: { 
    prompt: "What is your primary financial goal?" 
  },
  housing_status: { 
    prompt: "What is your current housing situation?" 
  },
  monthly_income: {
    prompt: "What is your approximate monthly income (CAD)?",
    placeholder: "e.g., 3000",
  },
  savings_balance: {
    prompt: "What is your current savings balance (CAD)?",
    placeholder: "e.g., 5000",
  },
  debt_amount: {
    prompt: "What is your total debt amount (CAD)?",
    placeholder: "e.g., 10000",
  },

  // Mutual Funds fields
  has_mutual_funds: { 
    prompt: "Do you currently have any mutual funds?" 
  },
  where_mutual_funds: { 
    prompt: "Where are your mutual funds held?" 
  },
  type_mutual_funds: { 
    prompt: "What type of mutual funds do you have?" 
  },
  fee_level_mutual_funds: { 
    prompt: "What is the approximate fee level of your mutual funds?" 
  },
  mutual_funds_amount: {
    prompt: "What is the total amount invested in mutual funds (CAD)?",
    placeholder: "e.g., 5000",
  },

  // ETFs fields
  has_ETFs: { 
    prompt: "Do you currently have any ETFs?" 
  },
  where_ETFs: { 
    prompt: "Where are your ETFs held?" 
  },
  type_ETFs: { 
    prompt: "What type of ETFs do you have?" 
  },
  ETFs_amount: {
    prompt: "What is the total amount invested in ETFs (CAD)?",
    placeholder: "e.g., 5000",
  },
  frequency_ETFs: { 
    prompt: "How frequently do you contribute to your ETFs?" 
  },
};

function buildQuestionFromSchema(field) {
  const path = Profile.schema.path(field);
  if (!path) return null;

  const title = QUESTION_META[field]?.title || titleFromField(field);
  const prompt = QUESTION_META[field]?.prompt || defaultPrompt(title);
  const section = FIELD_TO_SECTION[field] || "general"; // default to general

  const enumValues = Array.isArray(path.enumValues) ? path.enumValues : [];
  const isNumber = path.instance === "Number";

  // If it has enum => MCQ
  if (enumValues.length > 0) {
    return {
      field,
      type: "mcq",
      title,
      prompt,
      section,
      options: enumValues,
    };
  }

  // Otherwise => fill input
  return {
    field,
    type: "fill",
    title,
    prompt,
    section,
    inputType: isNumber ? "number" : "text",
    placeholder:
      QUESTION_META[field]?.placeholder ||
      (isNumber ? "e.g., 3000" : "Type your answer..."),
  };
}

export default {
  async getProfile(req, res) {
    try {
      //const userId = getDemoUserId(req);
      const userId = getUserId(req);
      
      if (!userId) return res.status(401).json({ error: "Not logged in" });
      const profile = await findOrCreateProfile(userId);

      return res.status(200).json(profile);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to get profile." });
    }
  },

  async patchProfile(req, res) {
    try {
      //const userId = getDemoUserId(req);
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Not logged in" });

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
      //const userId = getDemoUserId(req);
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Not logged in" });

      const profile = await findOrCreateProfile(userId);

      // const unanswered = ALL_FIELDS.filter((f) => {
      //   const v = profile[f];
      //   return v == null || (typeof v === "string" && v.trim() === "");
      // });

      const unanswered = ALL_FIELDS.filter((f) => isUnanswered(profile, f));

      // only pick from unanswered fields that are currently eligible
      const eligibleUnanswered = unanswered.filter((f) => prereqsSatisfied(profile, f));

      const pickedFields = pickRandom(eligibleUnanswered, Math.min(3, unanswered.length));
      const questions = pickedFields.map(buildQuestionFromSchema).filter(Boolean);

      return res.status(200).json({
        questions,
        pickedFields,
        remainingUnansweredCount: unanswered.length,
        eligibleUnansweredCount: eligibleUnanswered.length,
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
