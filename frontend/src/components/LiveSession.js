import React, { useRef, useEffect, useState } from "react";
import { Box, Button, IconButton, Paper, Typography } from "@mui/material";
import {
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  ScreenShare,
  StopScreenShare,
  CallEnd
} from "@mui/icons-material";
import Editor from "@monaco-editor/react";

export default function LiveSession({ roomId, user }) {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const screenShareRef = useRef();
  const pcRef = useRef();
  const wsRef = useRef();
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [code, setCode] = useState("// Start coding together...\nfunction hello() {\n  console.log('Hello, pair programming!');\n}");
  const [language, setLanguage] = useState("javascript");
  const [remoteUser, setRemoteUser] = useState(null);

  useEffect(() => {
    const startSession = async () => {
      try {
        // Connect to WebSocket signaling server
        wsRef.current = new WebSocket(process.env.REACT_APP_WS_URL || "ws://localhost:5005");

        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" }
          ]
        });
        pcRef.current = pc;

        // Get local camera + mic
        const localStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        localVideoRef.current.srcObject = localStream;
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

        // Handle remote stream
        pc.ontrack = (event) => {
          remoteVideoRef.current.srcObject = event.streams[0];
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            wsRef.current.send(JSON.stringify({ 
              type: "ice-candidate", 
              roomId, 
              candidate: event.candidate 
            }));
          }
        };

        // WebSocket signaling
        wsRef.current.onopen = () => {
          console.log("WebSocket connected");
          wsRef.current.send(JSON.stringify({ 
            type: "join", 
            roomId, 
            user: user.username 
          }));
        };

        wsRef.current.onmessage = async (msg) => {
          try {
            const data = JSON.parse(msg.data);
            
            if (data.type === "user-joined") {
              setRemoteUser(data.user);
            }
            
            if (data.type === "user-left") {
              setRemoteUser(null);
            }
            
            if (data.type === "signal") {
              await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
              if (data.signal.type === "offer") {
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                wsRef.current.send(JSON.stringify({ 
                  type: "signal", 
                  roomId, 
                  signal: answer 
                }));
              }
            }
            
            if (data.type === "ice-candidate") {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
            
            if (data.type === "code-change") {
              setCode(data.code);
            }
          } catch (error) {
            console.error("Error handling message:", error);
          }
        };

        // Create offer (if first participant)
        setTimeout(async () => {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          wsRef.current.send(JSON.stringify({ 
            type: "signal", 
            roomId, 
            signal: offer 
          }));
        }, 1000);

        // Listen for code changes and broadcast them
        const codeChangeHandler = (newCode) => {
          if (wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: "code-change",
              roomId,
              code: newCode
            }));
          }
        };

        // Set up periodic connection check
        const connectionCheck = setInterval(() => {
          if (wsRef.current.readyState === WebSocket.CLOSED) {
            console.log("WebSocket connection lost. Attempting to reconnect...");
            startSession();
          }
        }, 5000);

        return () => clearInterval(connectionCheck);

      } catch (error) {
        console.error("Error starting session:", error);
      }
    };

    startSession();

    return () => {
      wsRef.current?.close();
      pcRef.current?.close();
    };
  }, [roomId, user]);

  const toggleAudio = () => {
    const localStream = localVideoRef.current.srcObject;
    const audioTracks = localStream.getAudioTracks();
    audioTracks.forEach(track => {
      track.enabled = !track.enabled;
    });
    setIsAudioMuted(!isAudioMuted);
  };

  const toggleVideo = () => {
    const localStream = localVideoRef.current.srcObject;
    const videoTracks = localStream.getVideoTracks();
    videoTracks.forEach(track => {
      track.enabled = !track.enabled;
    });
    setIsVideoOff(!isVideoOff);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen share
      const screenStream = screenShareRef.current;
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
      
      // Switch back to camera
      const localStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      localVideoRef.current.srcObject = localStream;
      
      // Replace tracks in peer connection
      const senders = pcRef.current.getSenders();
      const videoSender = senders.find(sender => 
        sender.track && sender.track.kind === 'video'
      );
      
      if (videoSender) {
        const videoTrack = localStream.getVideoTracks()[0];
        videoSender.replaceTrack(videoTrack);
      }
      
      setIsScreenSharing(false);
    } else {
      // Start screen share
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true 
        });
        screenShareRef.current = screenStream;
        
        // Replace video track with screen share
        const senders = pcRef.current.getSenders();
        const videoSender = senders.find(sender => 
          sender.track && sender.track.kind === 'video'
        );
        
        if (videoSender) {
          const videoTrack = screenStream.getVideoTracks()[0];
          videoSender.replaceTrack(videoTrack);
        }
        
        // Handle when user stops screen share
        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };
        
        setIsScreenSharing(true);
      } catch (error) {
        console.error("Error sharing screen:", error);
      }
    }
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    if (wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "code-change",
        roomId,
        code: newCode
      }));
    }
  };

  const endCall = () => {
    wsRef.current?.close();
    pcRef.current?.close();
    window.close(); // Close the tab/window
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", p: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: "center" }}>
        Live Pair Programming - Room: {roomId}
      </Typography>
      
      {remoteUser && (
        <Typography variant="subtitle1" sx={{ textAlign: "center", mb: 2 }}>
          Connected with: {remoteUser}
        </Typography>
      )}
      
      <Box sx={{ display: "flex", flex: 1, gap: 2 }}>
        {/* Video Section */}
        <Box sx={{ width: "30%", display: "flex", flexDirection: "column", gap: 2 }}>
          <Paper elevation={3} sx={{ p: 1 }}>
            <Typography variant="h6">You</Typography>
            <video 
              ref={localVideoRef} 
              autoPlay 
              muted 
              style={{ width: "100%", borderRadius: "8px" }} 
            />
          </Paper>
          
          <Paper elevation={3} sx={{ p: 1 }}>
            <Typography variant="h6">Partner</Typography>
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              style={{ width: "100%", borderRadius: "8px" }} 
            />
          </Paper>
        </Box>
        
        {/* Code Editor Section */}
        <Box sx={{ width: "70%" }}>
          <Paper elevation={3} sx={{ height: "100%", p: 2 }}>
            <Box sx={{ mb: 2, display: "flex", gap: 1, alignItems: "center" }}>
              <Typography variant="h6">Collaborative Code Editor</Typography>
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                style={{ marginLeft: "auto", padding: "5px" }}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="typescript">TypeScript</option>
              </select>
            </Box>
            
            <Editor
              height="75vh"
              language={language}
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                wordWrap: "on"
              }}
            />
          </Paper>
        </Box>
      </Box>
      
      {/* Controls */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 2 }}>
        <IconButton 
          onClick={toggleAudio} 
          color={isAudioMuted ? "error" : "primary"}
          sx={{ bgcolor: isAudioMuted ? "error.light" : "primary.light" }}
        >
          {isAudioMuted ? <MicOff /> : <Mic />}
        </IconButton>
        
        <IconButton 
          onClick={toggleVideo} 
          color={isVideoOff ? "error" : "primary"}
          sx={{ bgcolor: isVideoOff ? "error.light" : "primary.light" }}
        >
          {isVideoOff ? <VideocamOff /> : <Videocam />}
        </IconButton>
        
        <IconButton 
          onClick={toggleScreenShare} 
          color={isScreenSharing ? "secondary" : "primary"}
          sx={{ bgcolor: isScreenSharing ? "secondary.light" : "primary.light" }}
        >
          {isScreenSharing ? <StopScreenShare /> : <ScreenShare />}
        </IconButton>
        
        <Button 
          variant="contained" 
          color="error" 
          startIcon={<CallEnd />}
          onClick={endCall}
        >
          End Session
        </Button>
      </Box>
    </Box>
  );
}