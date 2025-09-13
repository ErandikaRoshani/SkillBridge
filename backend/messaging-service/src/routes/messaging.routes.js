const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messaging.controller");

// Get all chats for a user
router.get("/user/:userId/chats", messageController.getChats);

// Get messages for a specific chat
router.get("/:chatId/messages", messageController.getMessages);

// Send a new message
router.post("/send", messageController.sendMessage);

// Create a new chat
router.post("/create", messageController.createChat);

// mark as read
router.post("/mark-read", messageController.markAsRead);

module.exports = router;
