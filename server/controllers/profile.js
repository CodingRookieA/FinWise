import { createProfileService } from '../services/profile/profileService.js'

function getUserId(req) {
  const userId = req.session?.userId;
  if (!userId) return null;
  return userId;
}
export function createProfileController(profileService = createProfileService()) {
  return {
  async getProfile(req, res) {
    try {
      const userId = getUserId(req);
      
      if (!userId) return res.status(401).json({ error: "Not logged in" });
      const profile = await profileService.getProfile(userId);

      return res.status(200).json(profile);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to get profile." });
    }
  },

  async patchProfile(req, res) {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Not logged in" });
      const updated = await profileService.patchProfile(userId, req.body);

      return res.status(200).json(updated);
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ error: err.message });
      }
      console.error(err);
      return res.status(500).json({ error: "Failed to update profile." });
    }
  },

  async getRandomUnanswered(req, res) {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Not logged in" });

      const result = await profileService.getRandomUnanswered(userId)

      return res.status(200).json(result);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to pick questions." });
    }
  },


  async getAllFields(req, res) {
  try {
    const result = profileService.getAllFields()
    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to get questions." });
  }
},


  }
}

export default createProfileController()
