const express = require("express");
const verifyToken = require("../../middleware/auth");
const { createUser } = require("../controllers/user.controller");
const { getMentorAvailability, getCurrentUser, getMentorPriceRate, getUserById, getAllMentors, getMentorById, updateAvailability } = require("../controllers/user.controller");

const router = express.Router();

// Protected route: only logged-in users can create profile
router.post("/", verifyToken, createUser);
router.get("/me", verifyToken, getCurrentUser);
router.get("/:mentorId/availability", verifyToken, getMentorAvailability);
router.get("/:mentorId", verifyToken, getMentorPriceRate);
router.get("/getUserById/:userId", verifyToken, getUserById);
router.get("/mentors/all", verifyToken, getAllMentors);
router.get("/mentor/profile/:mentorId", verifyToken, getMentorById);
router.put("/update-availability", verifyToken, updateAvailability);

module.exports = router;