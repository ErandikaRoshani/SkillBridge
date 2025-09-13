const { dynamoDB } = require("../../aws");
const { v4: uuidv4 } = require("uuid");
const {
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
require("dotenv").config();
const axios = require("axios");

const MESSAGES_TABLE = process.env.MESSAGING_TABLE || "Messages";

// Get messages for a specific chat
async function getMessagesByChatId(chatId, limit = 50) {
  const params = {
    TableName: MESSAGES_TABLE,
    KeyConditionExpression: "chatId = :chatId",
    ExpressionAttributeValues: {
      ":chatId": chatId,
    },
    Limit: limit,
    ScanIndexForward: false, // Get latest messages first
  };

  try {
    const result = await dynamoDB.send(new QueryCommand(params));
    return result.Items.reverse();
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw new Error("Failed to fetch messages");
  }
}

async function getChatsByUser(userId, token) {
  try {
    // Scan the table and filter by participants
    const params = {
      TableName: MESSAGES_TABLE,
      FilterExpression: "contains(participants, :userId)",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    };

    const result = await dynamoDB.send(new ScanCommand(params));

    // Process to get unique chats with latest message
    const chatMap = new Map();

    if (result.Items) {
      // First, process all items to get chat information
      for (const item of result.Items) {
        if (
          !chatMap.has(item.chatId) ||
          new Date(item.createdAt) >
            new Date(chatMap.get(item.chatId).createdAt)
        ) {
          const otherParticipant = item.participants.find((p) => p !== userId);

          // Determine if the current user is participant1 or participant2
          const isParticipant1 = item.participants[0] === userId;

          // Try to get name and role from the message data first
          let name = isParticipant1 ? item.otherUserName : item.senderName;
          let role = isParticipant1 ? item.otherUserRole : item.senderRole;

          // If name is not available in the message, fetch from user service
          if (!name || name.startsWith("User ")) {
            try {
              const userResponse = await axios.get(
                `http://localhost:8090/users/getUserById/${otherParticipant}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (userResponse.data) {
                name = userResponse.data.name || `User ${otherParticipant}`;
                role = userResponse.data.role || "User";
              }
            } catch (error) {
              console.error(
                `Error fetching user details for ${otherParticipant}:`,
                error
              );
              name = name || `User ${otherParticipant}`;
              role = role || "User";
            }
          }

          chatMap.set(item.chatId, {
            id: item.chatId,
            name: name,
            role: role,
            lastMessage: item.content,
            createdAt: item.createdAt,
            unread:
              item.sender !== userId &&
              (!item.readBy || !item.readBy.includes(userId))
                ? 1
                : 0,
            avatar: name
              ? name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()
              : "U",
          });
        }
      }
    }

    const chats = Array.from(chatMap.values()).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return chats;
  } catch (error) {
    console.error("Error fetching chats:", error);
    throw error;
  }
}

async function sendMessage(messageData) {
  try {
    const {
      chatId,
      sender,
      content,
      participants,
      otherUserName,
      otherUserRole,
      senderName,
      senderRole,
    } = messageData;

    const message = {
      chatId,
      createdAt: new Date().toISOString(),
      messageId: uuidv4(),
      sender,
      content,
      participants,
      otherUserName,
      otherUserRole,
      senderName,
      senderRole,
      readBy: [sender],
    };

    const params = {
      TableName: MESSAGES_TABLE,
      Item: message,
    };

    await dynamoDB.send(new PutCommand(params));

    return message;
  } catch (error) {
    console.error("Error sending message:", error);
    throw new Error("Failed to send message");
  }
}

async function createChat(chatData) {
  try {
    const {
      participant1,
      participant2,
      participant1Name,
      participant2Name,
      participant1Role,
      participant2Role,
    } = chatData;

    const message = {
      chatId: `${participant1}_${participant2}`,
      createdAt: new Date().toISOString(),
      messageId: uuidv4(),
      sender: participant1,
      content: "Chat started",
      participants: [participant1, participant2],
      otherUserName: participant2Name,
      otherUserRole: participant2Role,
      senderName: participant1Name,
      senderRole: participant1Role,
      readBy: [participant1],
    };

    const params = {
      TableName: MESSAGES_TABLE,
      Item: message,
    };

    await dynamoDB.send(new PutCommand(params));

    return message;
  } catch (error) {
    console.error("Error creating chat:", error);
    throw new Error("Failed to create chat");
  }
}

async function markMessagesAsRead(chatId, userId) {
  try {
    // First get all unread messages for this chat
    const params = {
      TableName: MESSAGES_TABLE,
      FilterExpression: "chatId = :chatId AND NOT contains(readBy, :userId)",
      ExpressionAttributeValues: {
        ":chatId": chatId,
        ":userId": userId,
      },
    };

    const result = await dynamoDB.send(new ScanCommand(params));

    // Update each message to mark as read
    for (const message of result.Items) {
      const updateParams = {
        TableName: MESSAGES_TABLE,
        Key: {
          chatId: message.chatId,
          createdAt: message.createdAt,
        },
        UpdateExpression:
          "SET readBy = list_append(if_not_exists(readBy, :emptyList), :userId)",
        ExpressionAttributeValues: {
          ":userId": [userId],
          ":emptyList": [],
        },
      };

      await dynamoDB.send(new UpdateCommand(updateParams));
    }
  } catch (error) {
    console.error("Error marking messages as read:", error);
    throw new Error("Failed to mark messages as read");
  }
}

module.exports = {
  getChatsByUser,
  getMessagesByChatId,
  sendMessage,
  createChat,
  markMessagesAsRead,
};
