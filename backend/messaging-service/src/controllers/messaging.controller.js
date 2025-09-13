const messageService = require("../services/messaging.service");

// Get all chats for a user
async function getChats(req, res) {
  try {
    const { userId } = req.params;
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const chats = await messageService.getChatsByUser(userId, token);
    res.json(chats);
  } catch (error) {
    console.error("Error in getChats:", error);
    res.status(500).json({ error: error.message });
  }
}

// Get messages for a chat
async function getMessages(req, res) {
  try {
    const { chatId } = req.params;
    const { limit } = req.query;

    if (!chatId) {
      return res.status(400).json({ error: "chatId is required" });
    }

    const messages = await messageService.getMessagesByChatId(
      chatId,
      parseInt(limit) || 50
    );
    res.json(messages);
  } catch (error) {
    console.error("Error in getMessages:", error);
    res.status(500).json({ error: error.message });
  }
}

// Send a message
async function sendMessage(req, res) {
  try {
    const {
      chatId,
      sender,
      content,
      participants,
      otherUserName,
      otherUserRole,
    } = req.body;

    if (!chatId || !sender || !content || !participants) {
      return res.status(400).json({
        error: "chatId, sender, content, and participants are required",
      });
    }

    const message = await messageService.sendMessage({
      chatId,
      sender,
      content,
      participants,
      otherUserName,
      otherUserRole,
    });

    res.status(201).json(message);
  } catch (error) {
    console.error("Error in sendMessage:", error);
    res.status(500).json({ error: error.message });
  }
}

// Create a new chat
async function createChat(req, res) {
  try {
    const {
      participant1,
      participant2,
      participant1Name,
      participant2Name,
      participant1Role,
      participant2Role,
    } = req.body;

    if (!participant1 || !participant2) {
      return res.status(400).json({
        error: "Both participants are required",
      });
    }

    const chatId = `${participant1}_${participant2}`;

    const chat = await messageService.createChat({
      chatId,
      participant1,
      participant2,
      participant1Name,
      participant2Name,
      participant1Role,
      participant2Role,
    });

    res.status(201).json(chat);
  } catch (error) {
    console.error("Error in createChat:", error);
    res.status(500).json({ error: error.message });
  }
}

// Mark a message as read
async function markAsRead(req, res) {
  try {
    const { chatId, userId } = req.body;

    if (!chatId || !userId) {
      return res.status(400).json({ error: "chatId and userId are required" });
    }

    await messageService.markMessagesAsRead(chatId, userId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error in markAsRead:", error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getChats,
  getMessages,
  sendMessage,
  createChat,
  markAsRead,
};
