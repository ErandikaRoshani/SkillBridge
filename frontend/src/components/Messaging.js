import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
  Button,
  Paper
} from "@mui/material";
import axios from "axios";

export default function Messaging({ token, userId }) {
  const [chats, setChats] = useState([]);        // list of conversations
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const API_BASE = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    async function fetchChats() {
      const res = await axios.get(`${API_BASE}/messages/chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChats(res.data.chats || []);
    }
    fetchChats();
  }, [token]);

  async function openChat(chatId) {
    setSelectedChat(chatId);
    const res = await axios.get(`${API_BASE}/messages/${chatId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setMessages(res.data.messages || []);
  }

  async function sendMessage() {
    if (!text || !selectedChat) return;
    const res = await axios.post(
      `${API_BASE}/messages`,
      {
        chatId: selectedChat,
        senderId: userId,
        content: text
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setMessages((prev) => [...prev, res.data]);
    setText("");
  }

  return (
    <Box sx={{ display: "flex", height: "600px", border: "1px solid #ccc" }}>
      {/* Left: chat list */}
      <Box sx={{ width: "30%", borderRight: "1px solid #ccc", overflowY: "auto" }}>
        <Typography variant="h6" sx={{ p: 2 }}>Chats</Typography>
        <Divider />
        <List>
          {chats.map((chat) => (
            <ListItem
              button
              key={chat.chatId}
              onClick={() => openChat(chat.chatId)}
              selected={selectedChat === chat.chatId}
            >
              <ListItemText
                primary={chat.otherUserName}
                secondary={chat.lastMessage?.content}
              />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Right: messages */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
          {messages.map((msg, i) => (
            <Paper
              key={i}
              sx={{
                p: 1,
                mb: 1,
                maxWidth: "60%",
                alignSelf: msg.senderId === userId ? "flex-end" : "flex-start",
                backgroundColor: msg.senderId === userId ? "#DCF8C6" : "#fff"
              }}
            >
              <Typography>{msg.content}</Typography>
            </Paper>
          ))}
        </Box>
        <Divider />
        <Box sx={{ display: "flex", p: 1 }}>
          <TextField
            fullWidth
            placeholder="Type a message"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button onClick={sendMessage} variant="contained" sx={{ ml: 1 }}>
            Send
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
