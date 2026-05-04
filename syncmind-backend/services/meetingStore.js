import prisma from '../db/index.js';

function normalizeWhitespace(value = '') {
  return value.replace(/\s+/g, ' ').trim();
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function normalizeJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'string') return safeJsonParse(value, fallback);
  return value;
}

function isoTimestamp(value) {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

function asDate(value) {
  return new Date(isoTimestamp(value));
}

function dateLabel(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value || '';
  return parsed.toISOString().split('T')[0];
}

function formatDuration(duration, createdAt) {
  if (duration) return duration;
  if (!createdAt) return '0m';

  const startedAt = new Date(createdAt);
  if (Number.isNaN(startedAt.getTime())) return '0m';

  const totalMinutes = Math.max(1, Math.round((Date.now() - startedAt.getTime()) / 60000));
  if (totalMinutes < 60) return `${totalMinutes}m`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

function mergeTranscriptTexts(previousText, nextText) {
  const previous = normalizeWhitespace(previousText);
  const next = normalizeWhitespace(nextText);

  if (!previous) return next;
  if (!next) return previous;

  const previousLower = previous.toLowerCase();
  const nextLower = next.toLowerCase();

  if (previousLower === nextLower || previousLower.endsWith(nextLower)) {
    return previous;
  }

  if (nextLower.includes(previousLower)) {
    return next;
  }

  const previousWords = previous.split(' ');
  const nextWords = next.split(' ');
  const maxOverlap = Math.min(previousWords.length, nextWords.length, 12);

  for (let size = maxOverlap; size >= 2; size -= 1) {
    const previousSlice = previousWords.slice(-size).join(' ').toLowerCase();
    const nextSlice = nextWords.slice(0, size).join(' ').toLowerCase();

    if (previousSlice === nextSlice) {
      return `${previousWords.join(' ')} ${nextWords.slice(size).join(' ')}`.trim();
    }
  }

  if (!/[.!?]$/.test(previous) && nextWords.length <= 12) {
    return `${previous} ${next}`.trim();
  }

  return null;
}

function hydrateSummary(summaryRow) {
  if (!summaryRow) return null;

  return {
    executiveSummary: summaryRow.executiveSummary || '',
    actionItems: normalizeJson(summaryRow.actionItems, []),
    keyDecisions: normalizeJson(summaryRow.keyDecisions, [])
  };
}

function hydrateMeeting(meetingRow) {
  const summary = hydrateSummary(meetingRow.summary);
  const scheduledAt = meetingRow.scheduledAt ? meetingRow.scheduledAt.toISOString() : null;
  const createdAt = meetingRow.createdAt ? meetingRow.createdAt.toISOString() : null;

  return {
    id: meetingRow.id,
    title: meetingRow.title,
    host_id: meetingRow.hostId,
    status: meetingRow.status,
    scheduledAt,
    scheduled_at: scheduledAt,
    created_at: createdAt,
    duration: formatDuration(meetingRow.duration, meetingRow.createdAt),
    date: dateLabel(scheduledAt || createdAt || ''),
    executiveSummary: summary?.executiveSummary || null,
    actionItems: summary?.actionItems || [],
    keyDecisions: summary?.keyDecisions || [],
    activeParticipantCount: Array.isArray(meetingRow.participants)
      ? meetingRow.participants.filter((participant) => participant.isActive).length
      : undefined
  };
}

export async function createMeeting(id, title, hostId) {
  const meeting = await prisma.meeting.create({
    data: {
      id,
      title: title || 'Untitled Meeting',
      hostId,
      status: 'active'
    },
    include: { summary: true }
  });

  return hydrateMeeting(meeting);
}

export async function createScheduledMeeting(id, title, hostId, scheduledAt) {
  const meeting = await prisma.meeting.create({
    data: {
      id,
      title: title || 'Scheduled Meeting',
      hostId,
      status: 'scheduled',
      scheduledAt: asDate(scheduledAt)
    },
    include: { summary: true }
  });

  return hydrateMeeting(meeting);
}

export async function getMeeting(id) {
  const row = await prisma.meeting.findUnique({
    where: { id },
    include: { summary: true }
  });

  return row ? hydrateMeeting(row) : null;
}

export async function listMeetings() {
  const rows = await prisma.meeting.findMany({
    orderBy: { createdAt: 'desc' },
    include: { summary: true }
  });

  return rows.map(hydrateMeeting);
}

export async function listUpcomingMeetings() {
  const rows = await prisma.meeting.findMany({
    where: {
      status: 'scheduled',
      scheduledAt: { gte: new Date() }
    },
    orderBy: { scheduledAt: 'asc' },
    include: { summary: true }
  });

  return rows.map(hydrateMeeting);
}

export async function removeMeeting(id) {
  try {
    await prisma.meeting.delete({ where: { id } });
    return { changes: 1 };
  } catch (error) {
    if (error.code === 'P2025') {
      return { changes: 0 };
    }
    throw error;
  }
}

export async function getTranscriptSegments(meetingId) {
  const rows = await prisma.transcript.findMany({
    where: { meetingId },
    orderBy: [{ timestamp: 'asc' }, { id: 'asc' }]
  });

  return rows.map(row => ({
    id: String(row.id),
    meetingId: row.meetingId,
    speaker: row.speaker,
    text: row.text,
    timestamp: isoTimestamp(row.timestamp)
  }));
}

export async function getMeetingDetails(meetingId) {
  const row = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: { summary: true, participants: true }
  });
  if (!row) return null;

  const summary = hydrateSummary(row.summary);
  return {
    ...hydrateMeeting(row),
    transcript: await getTranscriptSegments(meetingId),
    participants: row.participants
      .sort((left, right) => right.joinedAt.getTime() - left.joinedAt.getTime())
      .map((participant) => ({
        meetingId: participant.meetingId,
        userId: participant.userId,
        role: participant.role,
        displayName: participant.displayName,
        socketId: participant.socketId,
        isActive: participant.isActive,
        joinedAt: participant.joinedAt.toISOString(),
        leftAt: participant.leftAt ? participant.leftAt.toISOString() : null
      })),
    summary: summary ? {
      executive: summary.executiveSummary,
      actionItems: summary.actionItems,
      keyDecisions: summary.keyDecisions
    } : null
  };
}

export async function persistTranscriptSegment(meetingId, speaker, text, timestamp = new Date().toISOString()) {
  const cleanedText = normalizeWhitespace(text);
  if (cleanedText.length < 4) {
    return { saved: false, reason: 'too_short' };
  }

  const normalizedTimestamp = isoTimestamp(timestamp);
  const latest = await prisma.transcript.findFirst({
    where: { meetingId, speaker },
    orderBy: [{ timestamp: 'desc' }, { id: 'desc' }]
  });

  if (latest) {
    const latestTimestamp = new Date(latest.timestamp);
    const currentTimestamp = new Date(normalizedTimestamp);
    const withinMergeWindow = !Number.isNaN(latestTimestamp.getTime())
      && !Number.isNaN(currentTimestamp.getTime())
      && currentTimestamp.getTime() - latestTimestamp.getTime() <= 12000;

    const latestNormalized = normalizeWhitespace(latest.text).toLowerCase();
    const cleanedNormalized = cleanedText.toLowerCase();

    if (
      latestNormalized === cleanedNormalized
      || latestNormalized.includes(cleanedNormalized)
      || cleanedNormalized.includes(latestNormalized)
    ) {
      if (cleanedNormalized.length > latestNormalized.length) {
        await prisma.transcript.update({
          where: { id: latest.id },
          data: {
            text: cleanedText,
            timestamp: asDate(normalizedTimestamp)
          }
        });

        return {
          saved: true,
          merged: true,
          transcript: {
            id: String(latest.id),
            meetingId,
            speaker,
            text: cleanedText,
            timestamp: normalizedTimestamp
          }
        };
      }

      return { saved: false, reason: 'duplicate' };
    }

    if (withinMergeWindow) {
      const mergedText = mergeTranscriptTexts(latest.text, cleanedText);
      if (mergedText && normalizeWhitespace(mergedText).toLowerCase() !== latestNormalized) {
        await prisma.transcript.update({
          where: { id: latest.id },
          data: {
            text: mergedText,
            timestamp: asDate(normalizedTimestamp)
          }
        });

        return {
          saved: true,
          merged: true,
          transcript: {
            id: String(latest.id),
            meetingId,
            speaker,
            text: mergedText,
            timestamp: normalizedTimestamp
          }
        };
      }
    }
  }

  const result = await prisma.transcript.create({
    data: {
      meetingId,
      speaker,
      text: cleanedText,
      timestamp: asDate(normalizedTimestamp)
    }
  });

  return {
    saved: true,
    merged: false,
    transcript: {
      id: String(result.id),
      meetingId,
      speaker,
      text: cleanedText,
      timestamp: normalizedTimestamp
    }
  };
}

export async function getRecentTranscriptPrompt(meetingId, speaker, limit = 4) {
  const rows = await prisma.transcript.findMany({
    where: { meetingId },
    orderBy: [{ timestamp: 'desc' }, { id: 'desc' }],
    take: limit
  });

  const orderedRows = rows.reverse();
  const prompt = orderedRows
    .map((row) => `${row.speaker === speaker ? 'Same speaker' : row.speaker}: ${normalizeWhitespace(row.text)}`)
    .join('\n');

  return prompt.slice(-1200);
}

export async function upsertParticipantPresence(meetingId, userId, displayName, socketId, role = 'participant') {
  const participant = await prisma.participant.upsert({
    where: {
      meetingId_userId: { meetingId, userId }
    },
    update: {
      displayName: displayName || 'Participant',
      socketId: socketId || null,
      role,
      isActive: true,
      leftAt: null
    },
    create: {
      meetingId,
      userId,
      displayName: displayName || 'Participant',
      socketId: socketId || null,
      role,
      isActive: true
    }
  });

  return {
    meetingId: participant.meetingId,
    userId: participant.userId,
    displayName: participant.displayName,
    socketId: participant.socketId,
    role: participant.role,
    isActive: participant.isActive,
    joinedAt: participant.joinedAt.toISOString(),
    leftAt: participant.leftAt ? participant.leftAt.toISOString() : null
  };
}

export async function markParticipantLeft(meetingId, userId, socketId) {
  if (!meetingId || !userId) return;

  await prisma.participant.updateMany({
    where: {
      meetingId,
      userId,
      ...(socketId ? { socketId } : {})
    },
    data: {
      isActive: false,
      leftAt: new Date(),
      socketId: null
    }
  });
}

export async function replaceMeetingSummary(meetingId, summary) {
  await prisma.summary.upsert({
    where: { meetingId },
    update: {
      executiveSummary: summary.executiveSummary || '',
      actionItems: summary.actionItems || [],
      keyDecisions: summary.keyDecisions || []
    },
    create: {
      meetingId,
      executiveSummary: summary.executiveSummary || '',
      actionItems: summary.actionItems || [],
      keyDecisions: summary.keyDecisions || []
    }
  });
}

export async function completeMeeting(meetingId) {
  const row = await prisma.meeting.findUnique({ where: { id: meetingId } });
  const duration = formatDuration(row?.duration, row?.createdAt);

  await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      status: 'completed',
      duration
    }
  });

  return getMeeting(meetingId);
}
