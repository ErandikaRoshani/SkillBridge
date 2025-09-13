import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./ChatWidget.css";
import useUser from "../services/UserContext";

const BackArrowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);
const MinimizeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
const SendIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);
const ChatIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);
const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const messagesEndRef = useRef(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const { user } = useUser();

  // Fetch available users when new chat view is shown
  useEffect(() => {
    const fetchAvailableUsers = async () => {
      if (showNewChat && availableUsers.length === 0) {
        try {
          setLoadingUsers(true);
          const response = await axios.get(
            `${process.env.REACT_APP_BACKEND_URL}/users/all/users`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          setAvailableUsers(response.data);
        } catch (error) {
          console.error("Error fetching users:", error);
          setAvailableUsers([]);
        } finally {
          setLoadingUsers(false);
        }
      }
    };
    fetchAvailableUsers();
  }, [showNewChat, availableUsers.length]);

  // Fetch chat list when component mounts or opens
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_MESSAGE_SERVICE_URL}/user/${user}/chats`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setChats(response.data);
      } catch (error) {
        console.error("Error fetching chats:", error);
        setChats([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && !isMinimized) {
      fetchChats();
    }
  }, [isOpen, isMinimized, user, token]);

  // Fetch messages when active chat changes
  useEffect(() => {
    if (activeChat && !isMinimized) {
      const fetchMessages = async () => {
        try {
          setIsLoading(true);
          const response = await axios.get(
            `${process.env.REACT_APP_BACKEND_MESSAGE_SERVICE_URL}/${activeChat.id}/messages`
          );

          const formattedMessages = response.data.map((msg) => ({
            id: msg.messageId,
            sender: msg.sender,
            content: msg.content,
            time: new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isMe: msg.sender === user,
          }));

          setMessages(formattedMessages);
        } catch (error) {
          console.error("Error fetching messages:", error);
          setMessages([]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchMessages();
    }
  }, [activeChat, isMinimized, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleChat = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setActiveChat(null);
        setShowNewChat(false);
      }
    }
  };

  const minimizeChat = () => setIsMinimized(true);

  const selectChat = async (chat) => {
    setActiveChat(chat);
    setShowNewChat(false);

    // Mark messages as read when opening a chat
    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_MESSAGE_SERVICE_URL}/mark-read`,
        {
          chatId: chat.id,
          userId: user,
        }
      );

      // Update local state to remove unread badge
      setChats((prevChats) =>
        prevChats.map((c) => (c.id === chat.id ? { ...c, unread: 0 } : c))
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const startNewChat = async (selectedUser) => {
    try {
      // Create a new chat
      const chatId = `${user}_${selectedUser.id}`;

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_MESSAGE_SERVICE_URL}/create`,
        {
          participant1: user,
          participant2: selectedUser.id,
          participant1Name: localStorage.getItem("userName"),
          participant2Name: selectedUser.name,
          participant1Role: localStorage.getItem("signupRole"),
          participant2Role: selectedUser.role,
        }
      );

      const newChat = {
        id: chatId,
        name: selectedUser.name,
        role: selectedUser.role,
        lastMessage: "Chat started",
        unread: 0,
        time: "Now",
        avatar: selectedUser.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase(),
        isNew: true,
      };

      setActiveChat(newChat);
      setMessages([]);
      setShowNewChat(false);
      setChats((prev) => [newChat, ...prev]);
    } catch (error) {
      console.error("Error creating chat:", error);
      alert("Failed to start chat. Please try again.");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      // Get the other participant from chat ID
      const chatParts = activeChat.id.split("_");
      let otherUserId;

      if (chatParts.length === 2) {
        otherUserId = chatParts[0] === user ? chatParts[1] : chatParts[0];
      } else {
        throw new Error("Invalid chat ID format");
      }

      const requestData = {
        chatId: activeChat.id,
        sender: user,
        content: newMessage.trim(),
        participants: [user, otherUserId],
        otherUserName: activeChat.name,
        otherUserRole: activeChat.role,
        senderName: localStorage.getItem("userName"),
        senderRole: localStorage.getItem("signupRole"),
      };

      console.log(
        "Sending message payload:",
        JSON.stringify(requestData, null, 2)
      );

      // Send message to backend
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_MESSAGE_SERVICE_URL}/send`,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Add the new message to UI
      const newMessageObj = {
        id: response.data.messageId || `temp-${Date.now()}`,
        sender: user,
        content: newMessage.trim(),
        time: new Date(
          response.data.createdAt || new Date()
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isMe: true,
      };

      setMessages((prev) => [...prev, newMessageObj]);
      setNewMessage("");

      // Update the chat list with the new message
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === activeChat.id
            ? {
                ...chat,
                lastMessage: newMessage.trim(),
                time: "Just now",
                unread: 0,
                isNew: false,
              }
            : chat
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
      alert(
        `Failed to send message: ${
          error.response?.data?.error || error.message
        }`
      );
    }
  };

  const goBackToList = () => {
    setActiveChat(null);
    setShowNewChat(false);
  };

  const showNewChatView = () => {
    setShowNewChat(true);
    setActiveChat(null);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = (now - messageTime) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return messageTime.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
    }
  };

  return (
    <div className="chat-widget">
      {/* Chat Button */}
      <div
        className={`chat-button ${isOpen ? "hidden" : ""}`}
        onClick={toggleChat}
      >
        <div className="chat-icon">
          <ChatIcon />
        </div>
        {chats.filter((chat) => chat.unread > 0).length > 0 && (
          <span className="notification-badge">
            {chats.filter((chat) => chat.unread > 0).length}
          </span>
        )}
      </div>

      {/* Chat Container */}
      <div
        className={`chat-container ${isOpen ? "open" : ""} ${
          isMinimized ? "minimized" : ""
        }`}
      >
        {/* Chat Header */}
        <div className="chat-header">
          {activeChat ? (
            <>
              <button className="back-button" onClick={goBackToList}>
                <BackArrowIcon />
              </button>
              <div className="chat-header-info">
                <div className="avatar">{activeChat.avatar}</div>
                <div>
                  <h3>{activeChat.name}</h3>
                  <p>{activeChat.role}</p>
                </div>
              </div>
            </>
          ) : showNewChat ? (
            <>
              <button
                className="back-button"
                onClick={() => setShowNewChat(false)}
              >
                <BackArrowIcon />
              </button>
              <h3>New Message</h3>
            </>
          ) : (
            <h3>Messages</h3>
          )}
          <div className="header-controls">
            <button className="minimize-btn" onClick={minimizeChat}>
              <MinimizeIcon />
            </button>
            <button className="close-btn" onClick={toggleChat}>
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Chat Content */}
        <div className="chat-content">
          {activeChat ? (
            <div className="chat-messages">
              {isLoading ? (
                <div className="loading">Loading messages...</div>
              ) : (
                <>
                  {messages.length === 0 && activeChat.isNew ? (
                    <div className="empty-chat">
                      <div className="empty-chat-icon">
                        <ChatIcon />
                      </div>
                      <h3>No messages yet</h3>
                      <p>Send a message to start the conversation</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`message ${
                          message.isMe ? "sent" : "received"
                        }`}
                      >
                        <div className="message-content">
                          <p>{message.content}</p>
                          <span className="message-time">
                            {message.time}
                            {message.isMe && (
                              <span className="status-icon">✓✓</span>
                            )}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : showNewChat ? (
            <div className="new-chat-view">
              <div className="new-chat-header">
                <h4>Select a user to start chatting</h4>
              </div>
              <div className="user-list">
                {loadingUsers ? (
                  <div className="loading">Loading users...</div>
                ) : (
                  availableUsers.map((user) => (
                    <div
                      key={user.id}
                      className="user-list-item"
                      onClick={() => startNewChat(user)}
                    >
                      <div className="avatar">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div className="user-info">
                        <div className="user-name">{user.name}</div>
                        <div className="user-role">{user.role}</div>
                      </div>
                      <div className="user-status">
                        <span
                          className={`status-dot ${
                            user.online ? "online" : "offline"
                          }`}
                        ></span>
                        <span className="status-text">
                          {user.online ? "Online" : "Offline"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="chat-list">
              <div className="chat-list-header">
                <h4>Conversations</h4>
                <button className="new-chat-btn" onClick={showNewChatView}>
                  <PlusIcon />
                  <span>New Chat</span>
                </button>
              </div>

              {isLoading ? (
                <div className="loading">Loading chats...</div>
              ) : chats.length > 0 ? (
                chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`chat-list-item ${
                      chat.unread > 0 ? "unread" : ""
                    }`}
                    onClick={() => selectChat(chat)}
                  >
                    <div className="avatar">{chat.avatar}</div>
                    <div className="chat-info">
                      <div className="chat-name">{chat.name}</div>
                      <div className="chat-role">{chat.role}</div>
                      <div className="chat-last-message">
                        {chat.lastMessage || "No messages yet"}
                      </div>
                    </div>
                    <div className="chat-meta">
                      <div className="chat-time">
                        {formatTime(chat.createdAt) || chat.time}
                      </div>
                      {chat.unread > 0 && (
                        <div className="unread-badge">{chat.unread}</div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-chats">
                  <div className="no-chats-icon">
                    <ChatIcon />
                  </div>
                  <h3>No conversations yet</h3>
                  <p>Start a new chat to connect with others</p>
                  <button className="start-chat-btn" onClick={showNewChatView}>
                    Start a Chat
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Message Input */}
        {activeChat && (
          <form className="chat-input-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !newMessage.trim()}>
              <SendIcon />
            </button>
          </form>
        )}
      </div>

      {/* Minimized Chat */}
      {isMinimized && (
        <div
          className="minimized-chat-tab"
          onClick={() => setIsMinimized(false)}
        >
          <ChatIcon />
          <span>Messages</span>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
