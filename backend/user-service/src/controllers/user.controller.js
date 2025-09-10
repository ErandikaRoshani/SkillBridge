const { saveUser } = require("../services/user.service");
const { getUser , getMentors} = require("../services/user.service");

async function createUser(req, res) {
  try {
    const { sub, email } = req.user;
    const { role, name, domains, seniority, badges, interests, goals, experienceLevel, availabilitySlots, hourlyRate } = req.body;

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
      createdAt: new Date().toISOString()
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
    console.log(userId)
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
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Could not fetch user" });
  }
}

// Get all mentors with filtering
async function getAllMentors(req, res) {
  try {
    const { domain, seniority, badge, availability } = req.query;
    
    const filters = {};
    if (domain) filters.domain = domain;
    if (seniority) filters.seniority = seniority;
    if (badge) filters.badge = badge;
    if (availability) filters.availability = availability;
    
    const mentors = await getMentors(filters);
    
    // Format the response
    const formattedMentors = mentors.map(mentor => ({
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
      hourlyRate: mentor.hourlyRate
    }));
    
    res.json(formattedMentors);
  } catch (error) {
    console.error('Error fetching mentors:', error);
    res.status(500).json({ message: 'Error fetching mentors' });
  }
}

// Get specific mentor by ID
async function getMentorById(req, res) {
  try {
    const { mentorId } = req.params;
    
    const mentor = await getUser(mentorId);
    
    if (!mentor || mentor.role !== 'mentor') {
      return res.status(404).json({ message: 'Mentor not found' });
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
      hourlyRate: mentor.hourlyRate
    };
    
    res.json(formattedMentor);
  } catch (error) {
    console.error('Error fetching mentor:', error);
    res.status(500).json({ message: 'Error fetching mentor' });
  }
}

module.exports = { createUser, getMentorAvailability, getCurrentUser, getMentorPriceRate,getUserById, getAllMentors, getMentorById };
