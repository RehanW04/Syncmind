import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  askMeetingQuestion,
  finalizeMeetingTranscript,
  summarizeMeeting
} from '../services/aiClient.js';
import {
  completeMeeting,
  createMeeting,
  createScheduledMeeting,
  getMeeting,
  getMeetingDetails,
  getTranscriptSegments,
  listMeetings,
  listUpcomingMeetings,
  persistTranscriptSegment,
  removeMeeting,
  replaceMeetingSummary
} from '../services/meetingStore.js';

const router = express.Router();

function buildFallbackSummary(meeting, transcript) {
  if (!transcript.length) {
    return {
      executiveSummary: `Meeting "${meeting.title}" ended without a usable transcript, so SyncMind could not generate an AI summary.`,
      actionItems: [],
      keyDecisions: []
    };
  }

  const excerpt = transcript
    .slice(0, 5)
    .map(segment => `${segment.speaker}: ${segment.text}`)
    .join(' ');

  return {
    executiveSummary: `SyncMind could not reach the AI summarizer, but the meeting discussed: ${excerpt}`.trim(),
    actionItems: [],
    keyDecisions: []
  };
}

// POST /api/meetings - Create an instant meeting
router.post('/', async (req, res) => {
  const { title, hostId } = req.body;
  const id = uuidv4().substring(0, 7);

  try {
    const meeting = await createMeeting(id, title || 'Untitled Meeting', hostId || 'anonymous');
    res.status(201).json(meeting);
  } catch (err) {
    console.error('Create meeting error:', err);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// POST /api/meetings/schedule - Schedule a meeting
router.post('/schedule', async (req, res) => {
  const { title, hostId, scheduledAt } = req.body;
  if (!scheduledAt) return res.status(400).json({ error: 'scheduledAt is required' });

  const id = uuidv4().substring(0, 7);
  try {
    const meeting = await createScheduledMeeting(id, title || 'Scheduled Meeting', hostId || 'anonymous', scheduledAt);
    res.status(201).json(meeting);
  } catch (err) {
    console.error('Schedule meeting error:', err);
    res.status(500).json({ error: 'Failed to schedule meeting' });
  }
});

// GET /api/meetings - List all meetings
router.get('/', async (req, res) => {
  try {
    res.json(await listMeetings());
  } catch (err) {
    console.error('List meetings error:', err);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// GET /api/meetings/upcoming
router.get('/upcoming', async (req, res) => {
  try {
    res.json(await listUpcomingMeetings());
  } catch (err) {
    console.error('Upcoming meetings error:', err);
    res.status(500).json({ error: 'Failed to fetch upcoming meetings' });
  }
});

// GET /api/meetings/:id
router.get('/:id', async (req, res) => {
  const meeting = await getMeetingDetails(req.params.id);
  if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

  res.json(meeting);
});

// DELETE /api/meetings/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await removeMeeting(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Meeting not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete meeting error:', err);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

// POST /api/meetings/:id/summary
router.post('/:id/summary', async (req, res) => {
  const meeting = await getMeeting(req.params.id);
  if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

  const transcript = await getTranscriptSegments(meeting.id);

  try {
    await finalizeMeetingTranscript({ meetingId: meeting.id, transcript });
  } catch (err) {
    console.warn('Transcript finalization warning:', err.message);
  }

  let summary;
  try {
    summary = await summarizeMeeting({
      meetingId: meeting.id,
      title: meeting.title,
      transcript
    });
  } catch (err) {
    console.error('AI summary generation failed:', err.message);
    summary = buildFallbackSummary(meeting, transcript);
  }

  await replaceMeetingSummary(meeting.id, {
    executiveSummary: summary.executive_summary || summary.executiveSummary || '',
    actionItems: summary.action_items || summary.actionItems || [],
    keyDecisions: summary.key_decisions || summary.keyDecisions || []
  });

  await completeMeeting(meeting.id);
  res.json(await getMeetingDetails(meeting.id));
});

// POST /api/meetings/:id/qa
router.post('/:id/qa', async (req, res) => {
  const meeting = await getMeeting(req.params.id);
  if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

  const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
  if (!question) return res.status(400).json({ error: 'question is required' });

  const transcript = await getTranscriptSegments(meeting.id);
  if (!transcript.length) {
    return res.json({
      answer: 'I do not have enough transcript context yet. Let the meeting run a little longer and try again.',
      confidence: 0.1,
      sources: []
    });
  }

  try {
    const answer = await askMeetingQuestion({
      meetingId: meeting.id,
      question,
      transcript
    });
    res.json(answer);
  } catch (err) {
    console.error('Meeting QA failed:', err.message, err.payload || '');
    res.status(err.status || 503).json({
      error: err.message || 'AI assistant is unavailable right now.'
    });
  }
});

// POST /api/meetings/:id/transcript
router.post('/:id/transcript', async (req, res) => {
  const meeting = await getMeeting(req.params.id);
  if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

  const { speaker, text, timestamp } = req.body;
  const result = await persistTranscriptSegment(meeting.id, speaker || 'Participant', text || '', timestamp);
  if (!result.saved) {
    return res.json({ success: false, reason: result.reason || 'ignored' });
  }

  res.json({ success: true, transcript: result.transcript, merged: Boolean(result.merged) });
});

export default router;
