const { saveUser } = require("../services/user.service");
const { getUser, getMentors, getUsers } = require("../services/user.service");

async function createUser(req, res) {
  try {
    const { sub, email } = req.user;
    const {
      role,
      name,
      domains,
      seniority,
      badges,
      interests,
      goals,
      experienceLevel,
      availabilitySlots,
      hourlyRate,
    } = req.body;

    const user = {
      userId: sub,
      email,
      role,
      name,
      domains,
      seniority,
      badges,
      interests,
      goals,
      experienceLevel,
      availabilitySlots,
      hourlyRate,
      createdAt: new Date().toISOString(),
    };

    await saveUser(user);
    res.status(201).json({ message: "User stored successfully", user });
  } catch (err) {
    if (err.message === "User already exists") {
      return res.status(409).json({ error: "User already exists" });
    }
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Could not save user" });
  }
}

async function getMentorAvailability(req, res) {
  try {
    const { mentorId } = req.params;
    const mentor = await getUser(mentorId);

    if (!mentor || mentor.role !== "mentor") {
      return res.status(404).json({ error: "Mentor not found" });
    }

    res.json({ availabilitySlots: mentor.availabilitySlots || [] });
  } catch (err) {
    console.error("Error fetching availability:", err);
    res.status(500).json({ error: "Could not fetch availability" });
  }
}

async function getUserById(req, res) {
  try {
    const { userId } = req.params;
    const user = await getUser(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Could not fetch user" });
  }
}

async function getMentorPriceRate(req, res) {
  try {
    const { mentorId } = req.params;
    const mentor = await getUser(mentorId);

    if (!mentor || mentor.role !== "mentor") {
      return res.status(404).json({ error: "Mentor not found" });
    }

    res.json({ data: mentor || [] });
  } catch (err) {
    console.error("Error fetching availability:", err);
    res.status(500).json({ error: "Could not fetch availability" });
  }
}

async function getCurrentUser(req, res) {
  try {
    const { sub } = req.user; // Cognito sub from verifyToken
    const user = await getUser(sub);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      userId: user.userId,
      email: user.email,
      role: user.role,
      name: user.name,
      domains: user.domains,
      seniority: user.seniority,
      badges: user.badges,
      interests: user.interests,
      goals: user.goals,
      experienceLevel: user.experienceLevel,
      availabilitySlots: user.availabilitySlots,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Could not fetch user" });
  }
}

// Get all mentors with filtering
async function getAllMentors(req, res) {
  try {
    const mentors = await getMentors();

    // Format the response
    const formattedMentors = mentors.map((mentor) => ({
      id: mentor.userId,
      name: mentor.name || "Unknown",
      email: mentor.email,
      title: mentor.title,
      company: mentor.company,
      bio: mentor.bio,
      domains: Array.isArray(mentor.domains) ? mentor.domains : [],
      seniority: mentor.seniority,
      badges: Array.isArray(mentor.badges) ? mentor.badges : [],
      rating: mentor.rating || 0,
      profilePicture: mentor.profilePicture,
      availabilitySlots: Array.isArray(mentor.availabilitySlots)
        ? mentor.availabilitySlots
        : [],
      hourlyRate: mentor.hourlyRate,
    }));

    res.json(formattedMentors);
  } catch (error) {
    console.error("Error fetching all mentors:", error);
    res
      .status(500)
      .json({ message: "Error fetching mentors", error: error.message });
  }
}

// Get specific mentor by ID
async function getMentorById(req, res) {
  try {
    const { mentorId } = req.params;

    const mentor = await getUser(mentorId);

    if (!mentor || mentor.role !== "mentor") {
      return res.status(404).json({ message: "Mentor not found" });
    }

    // Format the response
    const formattedMentor = {
      id: mentor.userId,
      name: mentor.name,
      email: mentor.email,
      title: mentor.title,
      company: mentor.company,
      bio: mentor.bio,
      domains: mentor.domains || [],
      seniority: mentor.seniority,
      badges: mentor.badges || [],
      rating: mentor.rating || 0,
      profilePicture: mentor.profilePicture,
      availabilitySlots: mentor.availabilitySlots || [],
      hourlyRate: mentor.hourlyRate,
    };

    res.json(formattedMentor);
  } catch (error) {
    console.error("Error fetching mentor:", error);
    res.status(500).json({ message: "Error fetching mentor" });
  }
}

// Add to user.controller.js
async function updateAvailability(req, res) {
  try {
    const { sub } = req.user;
    const { availabilitySlots } = req.body;

    // Get current user
    const user = await getUser(sub);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update availability slots
    const updatedUser = {
      ...user,
      availabilitySlots: availabilitySlots || [],
    };

    // Save updated user
    await saveUser(updatedUser);

    res.json({
      message: "Availability updated successfully",
      availabilitySlots: updatedUser.availabilitySlots,
    });
  } catch (error) {
    console.error("Error updating availability:", error);
    res.status(500).json({ error: "Failed to update availability" });
  }
}

async function getAllUsers(req, res) {
  try {
    const users = await getUsers();

    // Format the response - exclude current user and sensitive information
    const currentUserId = req.user.sub;
    const formattedUsers = users
      .filter((user) => user.userId !== currentUserId) // Exclude current user
      .map((user) => ({
        id: user.userId,
        name: user.name || "Unknown",
        email: user.email,
        role: user.role,
        title: user.title,
        company: user.company,
        bio: user.bio,
        domains: Array.isArray(user.domains) ? user.domains : [],
        seniority: user.seniority,
        badges: Array.isArray(user.badges) ? user.badges : [],
        rating: user.rating || 0,
        profilePicture: user.profilePicture,
        availabilitySlots: Array.isArray(user.availabilitySlots)
          ? user.availabilitySlots
          : [],
        hourlyRate: user.hourlyRate,
      }));

    res.json(formattedUsers);
  } catch (error) {
    console.error("Error fetching all users:", error);
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
}

module.exports = {
  createUser,
  getMentorAvailability,
  getCurrentUser,
  getMentorPriceRate,
  getUserById,
  getAllMentors,
  getMentorById,
  updateAvailability,
  getAllUsers,
};
