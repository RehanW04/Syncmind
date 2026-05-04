import { transcribeMeetingChunk } from '../services/aiClient.js';
import {
  getRecentTranscriptPrompt,
  markParticipantLeft,
  persistTranscriptSegment,
  upsertParticipantPresence
} from '../services/meetingStore.js';

const rooms = new Map();

function toBuffer(audio) {
  if (Buffer.isBuffer(audio)) return audio;
  if (audio instanceof ArrayBuffer) return Buffer.from(audio);
  if (ArrayBuffer.isView(audio)) return Buffer.from(audio.buffer);
  if (audio?.type === 'Buffer' && Array.isArray(audio.data)) return Buffer.from(audio.data);
  return Buffer.from(audio || []);
}

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join-room', async (roomId, userId, userName) => {
      socket.join(roomId);
      socket.roomId = roomId;
      socket.userId = userId;
      socket.userName = userName || 'Participant';
      socket.isMuted = false;
      socket.isVideoOff = false;

      if (!rooms.has(roomId)) rooms.set(roomId, new Set());
      rooms.get(roomId).add(socket.id);

      const usersInRoom = [...rooms.get(roomId)]
        .filter(id => id !== socket.id)
        .map(id => {
          const peerSocket = io.sockets.sockets.get(id);
          return {
            socketId: id,
            userName: peerSocket?.userName || 'Participant',
            isMuted: Boolean(peerSocket?.isMuted),
            isVideoOff: Boolean(peerSocket?.isVideoOff)
          };
        });

      socket.emit('all-users', usersInRoom);
      socket.to(roomId).emit('participant-joined', { userId, userName: socket.userName });

      try {
        await upsertParticipantPresence(roomId, userId, socket.userName, socket.id);
      } catch (error) {
        console.error('Participant persistence error:', error.message);
      }

      console.log(`${userId} (${socket.userName}) joined room ${roomId} (${rooms.get(roomId).size} users)`);
    });

    socket.on('sending-signal', ({ userToSignal, callerId, signal }) => {
      io.to(userToSignal).emit('user-joined', { signal, callerId, userName: socket.userName });
    });

    socket.on('returning-signal', ({ signal, callerId }) => {
      io.to(callerId).emit('receiving-returned-signal', { signal, id: socket.id });
    });

    socket.on('end-meeting', ({ roomId }) => {
      socket.to(roomId).emit('meeting-ended');
    });

    socket.on('kick-user', ({ roomId, targetId }) => {
      const targetSocket = io.sockets.sockets.get(targetId);
      if (targetSocket) {
        targetSocket.emit('kicked-out');
      }
    });

    socket.on('mute-all', ({ roomId }) => {
      socket.to(roomId).emit('host-muted');
    });

    socket.on('media-state', ({ roomId, userId, isMuted, isVideoOff }) => {
      socket.isMuted = Boolean(isMuted);
      socket.isVideoOff = Boolean(isVideoOff);
      io.to(roomId).emit('media-state', {
        userId: userId || socket.userId,
        socketId: socket.id,
        isMuted: socket.isMuted,
        isVideoOff: socket.isVideoOff
      });
    });

    socket.on('chat-message', ({ roomId, sender, text }) => {
      io.to(roomId).emit('chat-message', {
        sender,
        text,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('audio-chunk', async ({ roomId, userId, audio, mimeType }) => {
      if (!roomId || !audio) return;

      const audioBuffer = toBuffer(audio);
      if (!audioBuffer.length) return;

      try {
        const prompt = await getRecentTranscriptPrompt(roomId, socket.userName || 'Participant');
        const result = await transcribeMeetingChunk({
          meetingId: roomId,
          speaker: socket.userName || 'Participant',
          timestamp: new Date().toISOString(),
          audioBase64: audioBuffer.toString('base64'),
          mimeType,
          prompt
        });

        if (!result?.accepted || !result.text) return;

        const persisted = await persistTranscriptSegment(
          roomId,
          socket.userName || 'Participant',
          result.text,
          result.timestamp || new Date().toISOString()
        );

        if (!persisted.saved) return;

        io.to(roomId).emit('transcript-update', {
          transcriptId: persisted.transcript.id,
          mode: persisted.merged ? 'replace' : 'append',
          speaker: socket.userName || 'Participant',
          speakerId: userId || socket.userId,
          text: persisted.transcript.text,
          timestamp: persisted.transcript.timestamp
        });
      } catch (error) {
        console.error('Live transcription error:', error.message, error.payload || '');
      }
    });

    socket.on('transcript-update', ({ roomId, speaker, speakerId, text, transcriptId, mode = 'append' }) => {
      io.to(roomId).emit('transcript-update', {
        transcriptId,
        mode,
        speaker,
        speakerId,
        text,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('hand-toggle', ({ roomId, userId, isRaised }) => {
      io.to(roomId).emit('hand-toggle', { userId, isRaised });
    });

    socket.on('reaction', ({ roomId, userId, emoji }) => {
      io.to(roomId).emit('reaction', { userId, emoji });
    });

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.id}`);
      const roomId = socket.roomId;
      if (roomId && rooms.has(roomId)) {
        rooms.get(roomId).delete(socket.id);
        socket.to(roomId).emit('user-left', socket.id);
        socket.to(roomId).emit('participant-left', { userName: socket.userName });
        if (rooms.get(roomId).size === 0) rooms.delete(roomId);
      }

      try {
        await markParticipantLeft(socket.roomId, socket.userId, socket.id);
      } catch (error) {
        console.error('Participant leave persistence error:', error.message);
      }
    });
  });
}
