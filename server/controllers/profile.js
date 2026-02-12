import { Profile } from "../models/profile.js"; 

// create a profile for the user when they register

//await Profile.create({ userId: String(user._id) });

await Profile.create({ userId: userIdString }); // for demo only...


export default {
    async getProfile(req, res) {
        
        
    },
    async patchProfile(req, res) {

    },
    async getRandomUnanswered(req, res) {

    }
}
