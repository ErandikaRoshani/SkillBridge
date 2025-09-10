const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 5005 });

const rooms = {}; // roomId => {sockets, users}

wss.on("connection", (ws) => {
  let currentRoom = null;
  let currentUser = null;

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      const { type, roomId, signal, candidate, code, user } = data;

      if (type === "join") {
        currentRoom = roomId;
        currentUser = user;
        
        if (!rooms[roomId]) {
          rooms[roomId] = { sockets: [], users: [] };
        }
        
        rooms[roomId].sockets.push(ws);
        rooms[roomId].users.push(user);
        
        // Notify all users in the room about the new user
        rooms[roomId].sockets.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ 
              type: "user-joined", 
              user: currentUser 
            }));
          }
        });
        
        console.log(`User ${user} joined room ${roomId}`);
      }

      if (type === "signal") {
        rooms[roomId]?.sockets.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "signal", signal }));
          }
        });
      }

      if (type === "ice-candidate") {
        rooms[roomId]?.sockets.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "ice-candidate", candidate }));
          }
        });
      }

      if (type === "code-change") {
        rooms[roomId]?.sockets.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "code-change", code }));
          }
        });
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  ws.on("close", () => {
    if (currentRoom && rooms[currentRoom]) {
      // Remove socket from room
      rooms[currentRoom].sockets = rooms[currentRoom].sockets.filter((s) => s !== ws);
      
      // Notify other users about disconnection
      rooms[currentRoom].sockets.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ 
            type: "user-left", 
            user: currentUser 
          }));
        }
      });
      
      // Remove user from room
      rooms[currentRoom].users = rooms[currentRoom].users.filter(u => u !== currentUser);
      
      // Clean up empty rooms
      if (rooms[currentRoom].sockets.length === 0) {
        delete rooms[currentRoom];
      }
      
      console.log(`User ${currentUser} left room ${currentRoom}`);
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

console.log("Signaling server running on ws://localhost:5005");