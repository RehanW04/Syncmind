import { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'simple-peer';
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://localhost:5000';

function buildAudioConstraints(initialSettings = {}) {
  return {
    channelCount: 1,
    echoCancellation: initialSettings.echoCancellation ?? true,
    noiseSuppression: initialSettings.noiseSuppression ?? true,
    autoGainControl: initialSettings.autoGainControl ?? true,
    ...(initialSettings.preferredMicrophoneId ? { deviceId: { exact: initialSettings.preferredMicrophoneId } } : {})
  };
}

function buildMediaConstraints(initialSettings = {}) {
  return {
    video: initialSettings.preferredCameraId ? { deviceId: { exact: initialSettings.preferredCameraId } } : true,
    audio: buildAudioConstraints(initialSettings)
  };
}

function buildAudioOnlyConstraints(initialSettings = {}) {
  return {
    video: false,
    audio: buildAudioConstraints(initialSettings)
  };
}

function buildVideoOnlyConstraints(initialSettings = {}) {
  return {
    video: initialSettings.preferredCameraId ? { deviceId: { exact: initialSettings.preferredCameraId } } : true,
    audio: false
  };
}

export function useWebRTC(roomId, userId, userName, initialSettings = {}) {
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState([]);
  const [screenStream, setScreenStream] = useState(null);
  const [transcripts, setTranscripts] = useState([
    {
      transcriptId: 'system-start',
      speaker: 'System',
      speakerId: 'system',
      text: 'Meeting started. Recording and transcription active.',
      isLocal: false,
      timestamp: new Date().toISOString()
    }
  ]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef();
  const peersRef = useRef([]);
  const localStreamRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const socket = io(SOCKET_SERVER_URL);
    socketRef.current = socket;

    const getMedia = async () => {
      const mediaConstraints = buildMediaConstraints(initialSettings);
      const audioOnlyConstraints = buildAudioOnlyConstraints(initialSettings);
      const videoOnlyConstraints = buildVideoOnlyConstraints(initialSettings);
      try {
        return await navigator.mediaDevices.getUserMedia(mediaConstraints);
      } catch (err) {
        console.warn('Camera/Mic failed together, trying audio only', err);
        try {
          return await navigator.mediaDevices.getUserMedia(audioOnlyConstraints);
        } catch (audioErr) {
          console.warn('Audio only failed, trying video only', audioErr);
          try {
            return await navigator.mediaDevices.getUserMedia(videoOnlyConstraints);
          } catch (videoErr) {
            console.warn('All immediate media requests failed. Waiting 2 seconds for hardware release...', videoErr);
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
              return await navigator.mediaDevices.getUserMedia(buildMediaConstraints(initialSettings));
            } catch (finalErr) {
              console.error('Critical failure acquiring media:', finalErr);
              return null;
            }
          }
        }
      }
    };

    getMedia().then((stream) => {
      if (!stream) return;

      if (!isMounted) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      if (initialSettings.isMuted) {
        stream.getAudioTracks().forEach(track => { track.enabled = false; });
      }
      if (initialSettings.isVideoOff) {
        stream.getVideoTracks().forEach(track => { track.enabled = false; });
      }

      localStreamRef.current = stream;
      setLocalStream(stream);

      socket.emit('join-room', roomId, userId, userName);
      socket.emit('media-state', {
        roomId,
        userId,
        isMuted: Boolean(initialSettings.isMuted),
        isVideoOff: Boolean(initialSettings.isVideoOff)
      });

      socket.on('all-users', (usersInRoom) => {
        const peersInRoom = [];
        usersInRoom.forEach(({ socketId, userName: peerName, isMuted: peerMuted, isVideoOff: peerVideoOff }) => {
          if (peersRef.current.find(peerItem => peerItem.peerId === socketId)) return;
          const peer = createPeer(socketId, socket.id, stream);
          peersRef.current.push({ peerId: socketId, peer });
          peersInRoom.push({
            peerId: socketId,
            userName: peerName,
            stream: null,
            peer,
            isHandRaised: false,
            reaction: null,
            isMuted: Boolean(peerMuted),
            isVideoOff: Boolean(peerVideoOff)
          });
        });
        setPeers(prev => [...prev, ...peersInRoom]);
      });

      socket.on('user-joined', (payload) => {
        if (peersRef.current.find(peerItem => peerItem.peerId === payload.callerId)) return;
        const peer = addPeer(payload.signal, payload.callerId, stream);
        peersRef.current.push({ peerId: payload.callerId, peer });
        setPeers((users) => {
          if (users.find(item => item.peerId === payload.callerId)) return users;
          return [...users, {
            peerId: payload.callerId,
            userName: payload.userName,
            stream: null,
            peer,
            isHandRaised: false,
            reaction: null,
            isMuted: false,
            isVideoOff: false
          }];
        });
      });

      socket.on('receiving-returned-signal', (payload) => {
        const item = peersRef.current.find(peerItem => peerItem.peerId === payload.id);
        if (item) item.peer.signal(payload.signal);
      });

      socket.on('media-state', ({ socketId, isMuted: peerMuted, isVideoOff: peerVideoOff }) => {
        setPeers((users) => users.map((peerItem) => (
          peerItem.peerId === socketId
            ? { ...peerItem, isMuted: Boolean(peerMuted), isVideoOff: Boolean(peerVideoOff) }
            : peerItem
        )));
      });

      socket.on('transcript-update', (payload) => {
        const transcriptEntry = {
          transcriptId: payload.transcriptId || `${payload.timestamp}-${payload.speakerId || payload.speaker}`,
          speaker: payload.speakerId === userId ? 'You' : (payload.speaker || 'Participant'),
          speakerId: payload.speakerId || payload.speaker,
          text: payload.text,
          isLocal: payload.speakerId === userId,
          timestamp: payload.timestamp
        };

        setTranscripts((prev) => {
          if (payload.mode === 'replace') {
            let replacedAny = false;
            const replaced = prev.map((item) => {
              if (item.transcriptId === transcriptEntry.transcriptId) {
                replacedAny = true;
                return transcriptEntry;
              }
              return item;
            });

            if (replacedAny) return replaced;
          }

          return [...prev, transcriptEntry];
        });
      });

      socket.on('user-left', (id) => {
        const peerObj = peersRef.current.find(peerItem => peerItem.peerId === id);
        if (peerObj) peerObj.peer.destroy();
        peersRef.current = peersRef.current.filter(peerItem => peerItem.peerId !== id);
        setPeers((users) => users.filter(peerItem => peerItem.peerId !== id));
      });

      socket.on('hand-toggle', ({ userId: id, isRaised }) => {
        setPeers(users => users.map(peerItem => (
          peerItem.peerId === id ? { ...peerItem, isHandRaised: isRaised } : peerItem
        )));
      });

      socket.on('reaction', ({ userId: id, emoji }) => {
        setPeers(users => users.map(peerItem => (
          peerItem.peerId === id ? { ...peerItem, reaction: emoji } : peerItem
        )));
        setTimeout(() => {
          if (!isMounted) return;
          setPeers(users => users.map(peerItem => (
            peerItem.peerId === id && peerItem.reaction === emoji
              ? { ...peerItem, reaction: null }
              : peerItem
          )));
        }, 4000);
      });

      socket.on('meeting-ended', () => {
        alert('The host has ended the meeting for all.');
        window.location.href = '/dashboard';
      });

      socket.on('kicked-out', () => {
        alert('You have been removed from the meeting by the host.');
        window.location.href = '/dashboard';
      });

      socket.on('host-muted', () => {
        if (localStreamRef.current) {
          const audioTrack = localStreamRef.current.getAudioTracks()[0];
          if (audioTrack && audioTrack.enabled) {
            audioTrack.enabled = false;
            socket.emit('media-state', {
              roomId,
              userId,
              isMuted: true,
              isVideoOff: Boolean(!localStreamRef.current.getVideoTracks()[0]?.enabled)
            });
          }
        }
      });

      socket.on('participant-joined', ({ userName: joinedUserName }) => {
        setNotifications(prev => [...prev, `${joinedUserName} joined the meeting`]);
        setTimeout(() => setNotifications(prev => prev.slice(1)), 3000);
      });

      socket.on('participant-left', ({ userName: leftUserName }) => {
        if (leftUserName) {
          setNotifications(prev => [...prev, `${leftUserName} left the meeting`]);
          setTimeout(() => setNotifications(prev => prev.slice(1)), 3000);
        }
      });
    });

    return () => {
      isMounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      socket.disconnect();
      peersRef.current.forEach(peerItem => peerItem.peer.destroy());
      peersRef.current = [];
    };
  }, [
    roomId,
    userId,
    userName,
    initialSettings.isMuted,
    initialSettings.isVideoOff,
    initialSettings.preferredCameraId,
    initialSettings.preferredMicrophoneId,
    initialSettings.noiseSuppression,
    initialSettings.echoCancellation,
    initialSettings.autoGainControl
  ]);

  useEffect(() => {
    if (!localStream) return;

    const audioTrack = localStream.getAudioTracks()[0];
      if (!audioTrack || typeof MediaRecorder === 'undefined' || initialSettings.autoTranscription === false) return;

    const supportedMimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm'
    ];
    const mimeType = supportedMimeTypes.find(type => MediaRecorder.isTypeSupported(type));
    if (!mimeType) return;

    const audioOnlyStream = new MediaStream([audioTrack]);
    let mediaRecorder = null;
    let stopTimer = null;
    let cycleTimer = null;
    let isCancelled = false;
    const chunkDurationMs = 8000;

    const sendChunk = async (blob) => {
      if (!socketRef.current || !socketRef.current.connected || !audioTrack.enabled) return;
      if (!blob || blob.size < 2048) return;

      try {
        const arrayBuffer = await blob.arrayBuffer();
        socketRef.current.emit('audio-chunk', {
          roomId,
          userId,
          audio: arrayBuffer,
          mimeType
        });
      } catch (error) {
        console.error('Error reading audio chunk', error);
      }
    };

    const startRecordingCycle = () => {
      if (isCancelled) return;
      if (audioTrack.readyState === 'ended') return;
      if (!audioTrack.enabled) {
        cycleTimer = setTimeout(startRecordingCycle, 500);
        return;
      }

      try {
        mediaRecorder = new MediaRecorder(audioOnlyStream, {
          mimeType,
          audioBitsPerSecond: 128000
        });
      } catch (error) {
        console.error('MediaRecorder initialization failed:', error);
        return;
      }

      mediaRecorder.ondataavailable = async (event) => {
        await sendChunk(event.data);
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
      };

      mediaRecorder.onstop = () => {
        if (isCancelled) return;
        cycleTimer = setTimeout(startRecordingCycle, 250);
      };

      mediaRecorder.start();
      stopTimer = setTimeout(() => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, chunkDurationMs);
    };

    startRecordingCycle();
    setIsTranscribing(true);

    return () => {
      isCancelled = true;
      setIsTranscribing(false);
      if (stopTimer) clearTimeout(stopTimer);
      if (cycleTimer) clearTimeout(cycleTimer);
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        try {
          mediaRecorder.stop();
        } catch (error) {}
      }
    };
  }, [initialSettings.autoTranscription, localStream, roomId, userId]);

  function createPeer(userToSignal, callerId, stream) {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on('signal', (signal) => {
      socketRef.current.emit('sending-signal', { userToSignal, callerId, signal });
    });
    peer.on('stream', (remoteStream) => {
      setPeers((users) => users.map(peerItem => (
        peerItem.peerId === userToSignal ? { ...peerItem, stream: remoteStream } : peerItem
      )));
    });
    return peer;
  }

  function addPeer(incomingSignal, callerId, stream) {
    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.on('signal', (signal) => {
      socketRef.current.emit('returning-signal', { signal, callerId });
    });
    peer.signal(incomingSignal);
    peer.on('stream', (remoteStream) => {
      setPeers((users) => users.map(peerItem => (
        peerItem.peerId === callerId ? { ...peerItem, stream: remoteStream } : peerItem
      )));
    });
    return peer;
  }

  const toggleAudio = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return false;
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return false;
    audioTrack.enabled = !audioTrack.enabled;
    const nextMuted = !audioTrack.enabled;
    if (socketRef.current) {
      socketRef.current.emit('media-state', {
        roomId,
        userId,
        isMuted: nextMuted,
        isVideoOff: Boolean(!stream.getVideoTracks()[0]?.enabled)
      });
    }
    return nextMuted;
  }, [roomId, userId]);

  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return false;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return false;
    videoTrack.enabled = !videoTrack.enabled;
    const nextVideoOff = !videoTrack.enabled;
    if (socketRef.current) {
      socketRef.current.emit('media-state', {
        roomId,
        userId,
        isMuted: Boolean(!stream.getAudioTracks()[0]?.enabled),
        isVideoOff: nextVideoOff
      });
    }
    return nextVideoOff;
  }, [roomId, userId]);

  const startScreenShare = useCallback(async () => {
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenStream(screen);

      const screenTrack = screen.getVideoTracks()[0];
      peersRef.current.forEach(({ peer }) => {
        const sender = peer._pc?.getSenders?.()?.find(item => item.track?.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack);
      });

      screenTrack.onended = () => {
        stopScreenShare();
      };

      return true;
    } catch {
      return false;
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }

    const stream = localStreamRef.current;
    if (stream) {
      const cameraTrack = stream.getVideoTracks()[0];
      if (cameraTrack) {
        peersRef.current.forEach(({ peer }) => {
          const sender = peer._pc?.getSenders?.()?.find(item => item.track?.kind === 'video');
          if (sender) sender.replaceTrack(cameraTrack);
        });
      }
    }
  }, [screenStream]);

  const toggleHandRaise = useCallback((isRaised) => {
    if (socketRef.current) socketRef.current.emit('hand-toggle', { roomId, userId, isRaised });
  }, [roomId, userId]);

  const sendReaction = useCallback((emoji) => {
    if (socketRef.current) socketRef.current.emit('reaction', { roomId, userId, emoji });
  }, [roomId, userId]);

  const endMeetingForAll = useCallback(() => {
    if (socketRef.current) socketRef.current.emit('end-meeting', { roomId });
  }, [roomId]);

  const kickUser = useCallback((targetId) => {
    if (socketRef.current) socketRef.current.emit('kick-user', { roomId, targetId });
  }, [roomId]);

  const muteAll = useCallback(() => {
    if (socketRef.current) socketRef.current.emit('mute-all', { roomId });
  }, [roomId]);

  return {
    localStream,
    peers,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    screenStream,
    transcripts,
    isTranscribing,
    toggleHandRaise,
    sendReaction,
    notifications,
    endMeetingForAll,
    kickUser,
    muteAll
  };
}
