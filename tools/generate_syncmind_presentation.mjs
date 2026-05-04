import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const pptxModuleUrl = pathToFileURL(
  'C:/Users/rehan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pptxgenjs/dist/pptxgen.es.js'
).href;
const { default: PptxGenJS } = await import(pptxModuleUrl);

const outputDir = 'C:/Rehan/Syncmind/artifacts';
const outputFile = path.join(outputDir, 'SyncMind_Application_Presentation.pptx');

fs.mkdirSync(outputDir, { recursive: true });

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'OpenAI Codex';
pptx.company = 'SyncMind';
pptx.subject = 'SyncMind application presentation';
pptx.title = 'SyncMind Application Presentation';
pptx.lang = 'en-US';
pptx.theme = {
  headFontFace: 'Aptos Display',
  bodyFontFace: 'Aptos',
  lang: 'en-US'
};

const palette = {
  navy: '0F172A',
  ink: '111827',
  muted: '5B6473',
  line: 'D7DDEA',
  soft: 'F4F7FB',
  white: 'FFFFFF',
  blue: '007AFF',
  sky: '5AC8FA',
  indigo: '5856D6',
  violet: 'AF52DE',
  green: '34C759',
  red: 'FF5A52',
  amber: 'FFB020',
  panel: 'EAF2FF'
};

function baseSlide(slide) {
  slide.background = { color: 'F7FAFF' };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    line: { color: 'F7FAFF', transparency: 100 },
    fill: { color: 'F7FAFF' }
  });
}

function addBrandBar(slide, label = 'SyncMind') {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.55,
    y: 0.35,
    w: 1.65,
    h: 0.42,
    rectRadius: 0.08,
    line: { color: 'D6E5FF', transparency: 0, pt: 1 },
    fill: { color: 'FFFFFF', transparency: 0 }
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.67,
    y: 0.45,
    w: 0.2,
    h: 0.2,
    rectRadius: 0.04,
    line: { color: palette.blue, transparency: 100 },
    fill: { color: palette.blue }
  });
  slide.addText(label, {
    x: 0.95,
    y: 0.43,
    w: 0.95,
    h: 0.18,
    fontFace: 'Aptos',
    fontSize: 14,
    bold: true,
    color: palette.ink,
    margin: 0
  });
}

function addTitle(slide, title, subtitle) {
  addBrandBar(slide);
  slide.addText(title, {
    x: 0.55,
    y: 0.95,
    w: 6.2,
    h: 1.1,
    fontFace: 'Aptos Display',
    fontSize: 24,
    bold: true,
    color: palette.navy,
    margin: 0
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.58,
      y: 1.88,
      w: 5.8,
      h: 0.6,
      fontFace: 'Aptos',
      fontSize: 11,
      color: palette.muted,
      margin: 0,
      breakLine: false
    });
  }
}

function addBulletList(slide, items, x, y, w, opts = {}) {
  const fontSize = opts.fontSize || 14;
  const color = opts.color || palette.ink;
  const gap = opts.gap || 0.48;
  items.forEach((item, index) => {
    slide.addShape(pptx.ShapeType.ellipse, {
      x,
      y: y + index * gap + 0.08,
      w: 0.12,
      h: 0.12,
      line: { color: opts.dotColor || palette.blue, transparency: 100 },
      fill: { color: opts.dotColor || palette.blue }
    });
    slide.addText(item, {
      x: x + 0.22,
      y: y + index * gap,
      w,
      h: 0.28,
      fontFace: 'Aptos',
      fontSize,
      color,
      margin: 0
    });
  });
}

function addPanel(slide, x, y, w, h, fill = 'FFFFFF') {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.08,
    line: { color: palette.line, pt: 1 },
    fill: { color: fill }
  });
}

function addMiniStat(slide, x, y, label, value, accent) {
  addPanel(slide, x, y, 1.55, 0.9, 'FFFFFF');
  slide.addText(label, {
    x: x + 0.16,
    y: y + 0.14,
    w: 1.15,
    h: 0.16,
    fontSize: 9,
    color: palette.muted,
    bold: true,
    margin: 0
  });
  slide.addText(value, {
    x: x + 0.16,
    y: y + 0.36,
    w: 1.15,
    h: 0.26,
    fontSize: 20,
    color: accent,
    bold: true,
    margin: 0
  });
}

function addPill(slide, x, y, text, fillColor, textColor = 'FFFFFF', width = 1.2) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w: width,
    h: 0.34,
    rectRadius: 0.08,
    line: { color: fillColor, transparency: 100 },
    fill: { color: fillColor }
  });
  slide.addText(text, {
    x,
    y: y + 0.08,
    w: width,
    h: 0.12,
    align: 'center',
    fontSize: 9,
    bold: true,
    color: textColor,
    margin: 0
  });
}

function addScreenFrame(slide, x, y, w, h, title) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.12,
    line: { color: 'C6D5EE', pt: 1.2 },
    fill: { color: 'FFFFFF' }
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: x + 0.12,
    y: y + 0.12,
    w: w - 0.24,
    h: 0.36,
    rectRadius: 0.08,
    line: { color: 'EEF3FB', pt: 1 },
    fill: { color: 'F8FBFF' }
  });
  slide.addText(title, {
    x: x + 0.32,
    y: y + 0.2,
    w: 2.4,
    h: 0.14,
    fontSize: 10,
    color: palette.ink,
    bold: true,
    margin: 0
  });
  ['FF5F57', 'FFBD2E', '28C840'].forEach((color, index) => {
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.14 + index * 0.14,
      y: y + 0.21,
      w: 0.07,
      h: 0.07,
      line: { color, transparency: 100 },
      fill: { color }
    });
  });
}

function addDashboardMockup(slide, x, y, w, h) {
  addScreenFrame(slide, x, y, w, h, 'Dashboard');
  slide.addShape(pptx.ShapeType.rect, {
    x: x + 0.16,
    y: y + 0.6,
    w: w - 0.32,
    h: 0.52,
    line: { color: 'EFF4FC', pt: 1 },
    fill: { color: 'F4F8FE' }
  });
  slide.addText('Good afternoon, Rehan', {
    x: x + 0.28,
    y: y + 0.68,
    w: 2.3,
    h: 0.2,
    fontSize: 16,
    bold: true,
    color: palette.navy,
    margin: 0
  });
  addPill(slide, x + w - 1.52, y + 0.67, 'New Meeting', palette.blue, 'FFFFFF', 1.05);
  addPill(slide, x + w - 2.74, y + 0.67, 'Schedule', 'EAF2FF', palette.blue, 0.95);

  addPanel(slide, x + 0.18, y + 1.28, 2.1, 1.36, 'FFFFFF');
  slide.addText('Quick Actions', {
    x: x + 0.34,
    y: y + 1.42,
    w: 1.4,
    h: 0.15,
    fontSize: 10,
    bold: true,
    color: palette.ink,
    margin: 0
  });
  addPill(slide, x + 0.34, y + 1.72, 'Start Meeting', palette.indigo, 'FFFFFF', 1.36);
  addPill(slide, x + 0.34, y + 2.12, 'Join by ID', 'EEF4FF', palette.indigo, 1.1);

  addPanel(slide, x + 0.18, y + 2.82, 2.1, 1.28, 'FFFFFF');
  slide.addText('Upcoming', {
    x: x + 0.34,
    y: y + 2.96,
    w: 1.2,
    h: 0.15,
    fontSize: 10,
    bold: true,
    color: palette.ink,
    margin: 0
  });
  slide.addText('Sprint Planning\nApr 26, 10:00 AM', {
    x: x + 0.34,
    y: y + 3.24,
    w: 1.4,
    h: 0.42,
    fontSize: 10,
    color: palette.muted,
    margin: 0
  });

  addPanel(slide, x + 2.42, y + 1.28, w - 2.6, 2.82, 'FFFFFF');
  slide.addText('Recent Meetings', {
    x: x + 2.66,
    y: y + 1.42,
    w: 1.7,
    h: 0.15,
    fontSize: 10,
    bold: true,
    color: palette.ink,
    margin: 0
  });
  for (let i = 0; i < 4; i += 1) {
    const rowY = y + 1.74 + i * 0.54;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: x + 2.64,
      y: rowY,
      w: w - 3.06,
      h: 0.4,
      rectRadius: 0.04,
      line: { color: 'EEF3FB', pt: 1 },
      fill: { color: i === 0 ? 'F7FAFF' : 'FFFFFF' }
    });
    slide.addText(
      i === 0
        ? 'Design Review    AI summary ready'
        : i === 1
          ? 'Client Sync    3 action items'
          : i === 2
            ? 'Weekly Standup    transcript captured'
            : 'Product Demo    archived',
      {
        x: x + 2.82,
        y: rowY + 0.12,
        w: w - 3.5,
        h: 0.12,
        fontSize: 9,
        color: palette.ink,
        margin: 0
      }
    );
  }
}

function addMeetingMockup(slide, x, y, w, h) {
  addScreenFrame(slide, x, y, w, h, 'Live Meeting');
  slide.addShape(pptx.ShapeType.rect, {
    x: x + 0.14,
    y: y + 0.58,
    w: w - 2.4,
    h: h - 0.74,
    line: { color: 'E6EEF8', pt: 1 },
    fill: { color: '0F172A' }
  });
  const tileW = (w - 2.82) / 2;
  const tileH = (h - 1.42) / 2;
  const tileX = x + 0.34;
  const tileY = y + 0.88;
  const tileColors = ['243B6B', '1F6FE5', '3A2E6D', '155F53'];
  ['Rehan', 'Asha', 'Rahul', 'Nina'].forEach((name, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    slide.addShape(pptx.ShapeType.roundRect, {
      x: tileX + col * (tileW + 0.22),
      y: tileY + row * (tileH + 0.18),
      w: tileW,
      h: tileH,
      rectRadius: 0.06,
      line: { color: '1F2937', transparency: 70, pt: 1 },
      fill: { color: tileColors[index] }
    });
    slide.addText(name, {
      x: tileX + col * (tileW + 0.22) + 0.14,
      y: tileY + row * (tileH + 0.18) + tileH - 0.22,
      w: 0.9,
      h: 0.12,
      fontSize: 8,
      color: palette.white,
      bold: true,
      margin: 0
    });
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: x + w - 2.06,
    y: y + 0.58,
    w: 1.88,
    h: h - 0.74,
    rectRadius: 0.08,
    line: { color: 'E6EEF8', pt: 1 },
    fill: { color: 'F7FAFF' }
  });
  ['People', 'Transcript', 'AI Assistant'].forEach((tab, index) => {
    addPill(
      slide,
      x + w - 1.92 + index * 0.62,
      y + 0.7,
      index === 2 ? 'AI' : tab,
      index === 2 ? palette.blue : 'EAF1FC',
      index === 2 ? 'FFFFFF' : palette.muted,
      index === 2 ? 0.34 : 0.56
    );
  });
  slide.addText('Transcript stream', {
    x: x + w - 1.82,
    y: y + 1.18,
    w: 1.2,
    h: 0.12,
    fontSize: 9,
    bold: true,
    color: palette.ink,
    margin: 0
  });
  ['Asha: Let us finalize the rollout.', 'Rahul: QA blockers are cleared.', 'SyncMind AI: Summary ready when meeting ends.'].forEach((line, index) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: x + w - 1.84,
      y: y + 1.38 + index * 0.5,
      w: 1.52,
      h: 0.34,
      rectRadius: 0.05,
      line: { color: 'EAF0FA', pt: 1 },
      fill: { color: index === 2 ? 'EEF4FF' : 'FFFFFF' }
    });
    slide.addText(line, {
      x: x + w - 1.74,
      y: y + 1.48 + index * 0.5,
      w: 1.3,
      h: 0.12,
      fontSize: 7.8,
      color: palette.ink,
      margin: 0
    });
  });
  ['Mute', 'Video', 'Share', 'Raise', 'Leave'].forEach((control, index) => {
    const fill = control === 'Leave' ? 'FFE7E6' : 'F3F6FB';
    const textColor = control === 'Leave' ? palette.red : palette.ink;
    addPill(slide, x + 1.12 + index * 0.82, y + h - 0.5, control, fill, textColor, 0.62);
  });
}

function addSummaryMockup(slide, x, y, w, h) {
  addScreenFrame(slide, x, y, w, h, 'AI Summary');
  slide.addText('AI Summary', {
    x: x + 0.28,
    y: y + 0.72,
    w: 1.2,
    h: 0.14,
    fontSize: 9,
    bold: true,
    color: palette.blue,
    margin: 0
  });
  slide.addText('Sprint Planning', {
    x: x + 0.28,
    y: y + 0.95,
    w: 1.8,
    h: 0.18,
    fontSize: 18,
    bold: true,
    color: palette.navy,
    margin: 0
  });
  addPanel(slide, x + 0.28, y + 1.32, w - 0.56, 0.88, 'EEF5FF');
  slide.addText('Executive Summary\nTeam aligned on April release timing, closed QA blockers, and confirmed a final dry run before launch.', {
    x: x + 0.42,
    y: y + 1.48,
    w: w - 0.84,
    h: 0.46,
    fontSize: 10,
    color: palette.ink,
    margin: 0
  });
  addPanel(slide, x + 0.28, y + 2.42, 2.42, 1.4, 'FFF6F4');
  slide.addText('Action Items', {
    x: x + 0.42,
    y: y + 2.58,
    w: 0.9,
    h: 0.12,
    fontSize: 10,
    bold: true,
    color: palette.red,
    margin: 0
  });
  addBulletList(slide, ['QA to finish regression pass', 'Ops to prepare release checklist', 'PM to share launch note'], x + 0.42, y + 2.84, 1.9, {
    fontSize: 8.5,
    gap: 0.28,
    dotColor: palette.red
  });
  addPanel(slide, x + 2.92, y + 2.42, w - 3.2, 1.4, 'F5F0FF');
  slide.addText('Key Decisions', {
    x: x + 3.06,
    y: y + 2.58,
    w: 1,
    h: 0.12,
    fontSize: 10,
    bold: true,
    color: palette.indigo,
    margin: 0
  });
  addBulletList(slide, ['Release stays on schedule', 'Demo script will be shortened', 'Cross-team review happens Friday'], x + 3.06, y + 2.84, 1.9, {
    fontSize: 8.5,
    gap: 0.28,
    dotColor: palette.indigo
  });
}

function addFlowArrow(slide, x1, y1, x2, y2, color = 'B8C6DD') {
  slide.addShape(pptx.ShapeType.line, {
    x: x1,
    y: y1,
    w: x2 - x1,
    h: y2 - y1,
    line: { color, pt: 1.6, beginArrowType: 'none', endArrowType: 'triangle' }
  });
}

function addCard(slide, x, y, w, h, title, body, accent) {
  addPanel(slide, x, y, w, h, 'FFFFFF');
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w,
    h: 0.06,
    line: { color: accent, transparency: 100 },
    fill: { color: accent }
  });
  slide.addText(title, {
    x: x + 0.18,
    y: y + 0.18,
    w: w - 0.36,
    h: 0.18,
    fontSize: 12,
    bold: true,
    color: palette.ink,
    margin: 0
  });
  slide.addText(body, {
    x: x + 0.18,
    y: y + 0.48,
    w: w - 0.34,
    h: h - 0.6,
    fontSize: 9.5,
    color: palette.muted,
    margin: 0,
    valign: 'mid'
  });
}

// Slide 1
{
  const slide = pptx.addSlide();
  baseSlide(slide);
  slide.addShape(pptx.ShapeType.ellipse, {
    x: 7.8,
    y: -0.65,
    w: 4.3,
    h: 4.3,
    line: { color: 'D9E9FF', transparency: 100 },
    fill: { color: 'E3F0FF', transparency: 8 }
  });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: 9.6,
    y: 2.05,
    w: 2.7,
    h: 2.7,
    line: { color: 'EAD8FF', transparency: 100 },
    fill: { color: 'F0E3FF', transparency: 12 }
  });
  addBrandBar(slide, 'SyncMind Application');
  slide.addText('SyncMind', {
    x: 0.58,
    y: 1.2,
    w: 4.6,
    h: 0.8,
    fontFace: 'Aptos Display',
    fontSize: 30,
    bold: true,
    color: palette.navy,
    margin: 0
  });
  slide.addText('AI-powered meeting platform for live collaboration, real-time transcript capture, intelligent Q&A, and post-meeting summaries.', {
    x: 0.58,
    y: 2.05,
    w: 5.2,
    h: 0.8,
    fontFace: 'Aptos',
    fontSize: 14,
    color: palette.muted,
    margin: 0
  });
  addBulletList(slide, [
    'React + Vite frontend with protected routes and polished product UI',
    'Node.js + Socket.io backend for meeting lifecycle and WebRTC signaling',
    'FastAPI AI service using Whisper, embeddings, summaries, and transcript Q&A'
  ], 0.62, 3.2, 5.2, { fontSize: 11.5, gap: 0.52 });
  addMiniStat(slide, 0.6, 5.32, 'Core flows', '5', palette.blue);
  addMiniStat(slide, 2.35, 5.32, 'AI outputs', '3', palette.indigo);
  addMiniStat(slide, 4.1, 5.32, 'Main surfaces', '4', palette.green);
  addDashboardMockup(slide, 7.15, 1.12, 5.55, 5.2);
}

// Slide 2
{
  const slide = pptx.addSlide();
  baseSlide(slide);
  addTitle(slide, 'What The Application Delivers', 'The deck is mapped to the implemented user journey rather than a generic meeting-platform template.');
  addCard(slide, 0.62, 2.0, 2.35, 1.55, 'Before The Meeting', 'Users register or log in, open the dashboard, create an instant room, schedule future sessions, or join with a room ID.', palette.blue);
  addCard(slide, 3.2, 2.0, 2.35, 1.55, 'During The Meeting', 'Participants enter a live room with video tiles, controls, participant list, transcript panel, and AI assistant sidebar.', palette.indigo);
  addCard(slide, 5.78, 2.0, 2.35, 1.55, 'After The Meeting', 'Meeting transcripts are finalized, AI summary is generated, and history becomes searchable inside the dashboard.', palette.green);
  addCard(slide, 8.36, 2.0, 2.35, 1.55, 'For The Host', 'Host-specific actions include meeting creation, mute-all, kick-user, end-meeting, and schedule management.', palette.red);
  addPanel(slide, 0.62, 4.15, 4.45, 2.45, 'FFFFFF');
  slide.addText('Application features visible in the codebase', {
    x: 0.85,
    y: 4.38,
    w: 2.9,
    h: 0.18,
    fontSize: 12,
    bold: true,
    color: palette.ink,
    margin: 0
  });
  addBulletList(slide, [
    'Protected routing for landing, dashboard, profile, settings, and meeting room',
    'Searchable meeting history with summary selection and schedule modal',
    'Transcript persistence, action-item extraction, and key-decision storage',
    'Transcript-grounded AI answers with confidence and speaker sources'
  ], 0.9, 4.78, 3.8, { fontSize: 10, gap: 0.42, dotColor: palette.sky });

  addPanel(slide, 5.32, 4.15, 7.38, 2.45, 'F3F8FF');
  slide.addText('Technology stack tied to the actual implementation', {
    x: 5.58,
    y: 4.38,
    w: 3.1,
    h: 0.18,
    fontSize: 12,
    bold: true,
    color: palette.ink,
    margin: 0
  });
  const stacks = [
    ['Frontend', 'React, Vite, React Router, Tailwind, Lucide UI'],
    ['Realtime', 'WebRTC peer mesh plus Socket.io signaling'],
    ['Backend', 'Express API with Prisma-backed meeting storage'],
    ['AI', 'Whisper transcription, OpenAI summaries and Q&A, vector indexing']
  ];
  stacks.forEach(([name, desc], index) => {
    const rowY = 4.8 + index * 0.43;
    slide.addText(name, {
      x: 5.62,
      y: rowY,
      w: 0.95,
      h: 0.14,
      fontSize: 9.5,
      bold: true,
      color: palette.blue,
      margin: 0
    });
    slide.addText(desc, {
      x: 6.55,
      y: rowY,
      w: 5.7,
      h: 0.14,
      fontSize: 9.3,
      color: palette.muted,
      margin: 0
    });
  });
}

// Slide 3
{
  const slide = pptx.addSlide();
  baseSlide(slide);
  addTitle(slide, 'User Journey Through SyncMind', 'Each stage below maps directly to a visible screen or backend interaction in the current application.');
  const nodes = [
    { x: 0.8, title: '1. Access', body: 'Login or sign up from the landing page.' },
    { x: 3.2, title: '2. Dashboard', body: 'Create, schedule, search, or join meetings.' },
    { x: 5.6, title: '3. Pre-Join', body: 'Set audio, video, devices, and transcription preferences.' },
    { x: 8.0, title: '4. Live Room', body: 'Video grid, controls, participant state, transcript, and AI assistant.' },
    { x: 10.4, title: '5. Summary', body: 'Executive summary, action items, and key decisions feed meeting history.' }
  ];
  nodes.forEach((node, index) => {
    addPanel(slide, node.x, 2.65, 1.92, 2.3, index % 2 === 0 ? 'FFFFFF' : 'F8FBFF');
    slide.addText(node.title, {
      x: node.x + 0.16,
      y: 2.92,
      w: 1.52,
      h: 0.24,
      fontSize: 12,
      bold: true,
      color: palette.ink,
      margin: 0
    });
    slide.addText(node.body, {
      x: node.x + 0.16,
      y: 3.38,
      w: 1.56,
      h: 0.92,
      fontSize: 9.3,
      color: palette.muted,
      margin: 0
    });
    if (index < nodes.length - 1) {
      addFlowArrow(slide, node.x + 1.92, 3.8, node.x + 2.28, 3.8, palette.sky);
    }
  });
  addPill(slide, 0.94, 5.32, 'AuthContext', 'EAF2FF', palette.blue, 0.9);
  addPill(slide, 3.44, 5.32, 'MeetingContext', 'EEF4FF', palette.indigo, 1.18);
  addPill(slide, 6.0, 5.32, 'PreMeetingCard', 'F4F7FB', palette.muted, 1.12);
  addPill(slide, 8.4, 5.32, 'WebRTCContext', 'EAFBF1', palette.green, 1.06);
  addPill(slide, 10.86, 5.32, 'SummaryDashboard', 'FFF3F1', palette.red, 1.28);
}

// Slide 4
{
  const slide = pptx.addSlide();
  baseSlide(slide);
  addTitle(slide, 'Dashboard And Meeting Management', 'The dashboard is the operational hub for instant meetings, scheduled sessions, history lookup, and summary review.');
  addDashboardMockup(slide, 0.72, 1.8, 7.3, 4.95);
  slide.addText('What this screen supports', {
    x: 8.42,
    y: 2.06,
    w: 2.2,
    h: 0.18,
    fontSize: 14,
    bold: true,
    color: palette.ink,
    margin: 0
  });
  addBulletList(slide, [
    'Instant room creation from the main CTA',
    'Meeting scheduling with copyable invite link',
    'Join-by-ID flow for direct room access',
    'Search across IDs, titles, dates, durations, and summaries',
    'Recent-meeting list and upcoming-meeting card',
    'Profile, settings, notifications, and logout actions'
  ], 8.48, 2.52, 3.9, { fontSize: 11, gap: 0.46, dotColor: palette.indigo });
  addPill(slide, 8.5, 5.82, 'Quick Actions', palette.blue, 'FFFFFF', 1.08);
  addPill(slide, 9.74, 5.82, 'Search', 'EAF2FF', palette.blue, 0.72);
  addPill(slide, 10.62, 5.82, 'History', 'EEF4FF', palette.indigo, 0.76);
  addPill(slide, 11.54, 5.82, 'Upcoming', 'EAFBF1', palette.green, 0.88);
}

// Slide 5
{
  const slide = pptx.addSlide();
  baseSlide(slide);
  addTitle(slide, 'Live Meeting Workspace', 'The meeting room combines collaboration controls, participant awareness, live transcript updates, and transcript-grounded AI support.');
  addMeetingMockup(slide, 0.72, 1.72, 7.6, 5.22);
  addPanel(slide, 8.58, 1.94, 4.05, 1.16, 'FFFFFF');
  slide.addText('Realtime controls', {
    x: 8.82,
    y: 2.16,
    w: 1.6,
    h: 0.14,
    fontSize: 12,
    bold: true,
    color: palette.ink,
    margin: 0
  });
  slide.addText('Mute, video, screen share, hand raise, reactions, leave, mute-all, kick-user, and host-driven end-meeting.', {
    x: 8.82,
    y: 2.42,
    w: 3.42,
    h: 0.38,
    fontSize: 9.5,
    color: palette.muted,
    margin: 0
  });
  addPanel(slide, 8.58, 3.28, 4.05, 1.16, 'FFFFFF');
  slide.addText('Live transcript panel', {
    x: 8.82,
    y: 3.5,
    w: 1.7,
    h: 0.14,
    fontSize: 12,
    bold: true,
    color: palette.ink,
    margin: 0
  });
  slide.addText('Audio chunks are transcribed in the background and appended or merged into speaker-tagged transcript cards.', {
    x: 8.82,
    y: 3.76,
    w: 3.42,
    h: 0.38,
    fontSize: 9.5,
    color: palette.muted,
    margin: 0
  });
  addPanel(slide, 8.58, 4.62, 4.05, 1.32, 'FFFFFF');
  slide.addText('AI assistant panel', {
    x: 8.82,
    y: 4.84,
    w: 1.7,
    h: 0.14,
    fontSize: 12,
    bold: true,
    color: palette.ink,
    margin: 0
  });
  slide.addText('Users can ask questions about decisions or action items, and the response includes confidence plus transcript-source hints.', {
    x: 8.82,
    y: 5.1,
    w: 3.42,
    h: 0.46,
    fontSize: 9.5,
    color: palette.muted,
    margin: 0
  });
}

// Slide 6
{
  const slide = pptx.addSlide();
  baseSlide(slide);
  addTitle(slide, 'AI Processing Pipeline', 'SyncMind separates the real-time meeting experience from AI processing so transcript intelligence can evolve independently.');
  const blocks = [
    { x: 0.82, y: 2.55, w: 2.12, h: 1.2, title: 'Client Audio', body: 'Browser captures room audio chunks from each participant.', accent: palette.blue },
    { x: 3.32, y: 2.55, w: 2.26, h: 1.2, title: 'FastAPI + Whisper', body: 'Audio is normalized with FFmpeg and transcribed with Whisper.', accent: palette.indigo },
    { x: 6.02, y: 2.55, w: 2.26, h: 1.2, title: 'Transcript Store', body: 'Segments are persisted, merged, and prepared for retrieval.', accent: palette.green },
    { x: 8.72, y: 2.55, w: 1.7, h: 1.2, title: 'Embeddings', body: 'Relevant transcript context is indexed for later lookup.', accent: palette.sky },
    { x: 10.8, y: 2.55, w: 1.72, h: 1.2, title: 'LLM Outputs', body: 'Summary generation and transcript-grounded answers.', accent: palette.violet }
  ];
  blocks.forEach((block, index) => {
    addCard(slide, block.x, block.y, block.w, block.h, block.title, block.body, block.accent);
    if (index < blocks.length - 1) {
      addFlowArrow(slide, block.x + block.w, block.y + 0.6, blocks[index + 1].x - 0.08, block.y + 0.6, palette.sky);
    }
  });
  addPanel(slide, 1.02, 4.52, 5.08, 1.36, 'FFFFFF');
  slide.addText('Implemented AI behaviors', {
    x: 1.24,
    y: 4.78,
    w: 2.1,
    h: 0.15,
    fontSize: 12,
    bold: true,
    color: palette.ink,
    margin: 0
  });
  addBulletList(slide, [
    'Real-time transcription with prompt-aware chunk handling',
    'Meeting finalization endpoint for transcript reindexing',
    'JSON-structured summary with executive summary, action items, and decisions'
  ], 1.26, 5.14, 4.45, { fontSize: 9.5, gap: 0.32, dotColor: palette.blue });

  addPanel(slide, 6.34, 4.52, 5.96, 1.36, 'F5F9FF');
  slide.addText('Retrieval and resilience details from the current build', {
    x: 6.58,
    y: 4.78,
    w: 3.6,
    h: 0.15,
    fontSize: 12,
    bold: true,
    color: palette.ink,
    margin: 0
  });
  addBulletList(slide, [
    'Question answering is explicitly constrained to retrieved transcript context',
    'ChromaDB is preferred, with local JSON fallback for vector storage',
    'Summary generation falls back to a transcript excerpt when AI is unavailable'
  ], 6.62, 5.14, 5.1, { fontSize: 9.5, gap: 0.32, dotColor: palette.indigo });
}

// Slide 7
{
  const slide = pptx.addSlide();
  baseSlide(slide);
  addTitle(slide, 'Post-Meeting Intelligence', 'The summary dashboard turns raw transcript history into an immediately usable record for the team.');
  addSummaryMockup(slide, 0.72, 1.72, 7.15, 5.2);
  slide.addText('Why this matters', {
    x: 8.4,
    y: 2.08,
    w: 1.9,
    h: 0.18,
    fontSize: 14,
    bold: true,
    color: palette.ink,
    margin: 0
  });
  addBulletList(slide, [
    'Removes manual note-taking after the call',
    'Keeps action items visible and attributable',
    'Captures key decisions in a reusable format',
    'Lets users reopen a meeting record from history instead of starting from scratch'
  ], 8.48, 2.48, 3.8, { fontSize: 11, gap: 0.48, dotColor: palette.green });
  addMiniStat(slide, 8.48, 5.55, 'Summary blocks', '3', palette.green);
  addMiniStat(slide, 10.28, 5.55, 'Searchable history', 'Yes', palette.indigo);
}

// Slide 8
{
  const slide = pptx.addSlide();
  baseSlide(slide);
  addTitle(slide, 'Implementation Snapshot And Honest Status', 'This closing slide reflects the application as implemented today, including what is complete and what is still a natural next step.');
  addCard(slide, 0.72, 2.02, 3.95, 2.1, 'Already implemented', 'Authentication, dashboard workflows, scheduling, room join flow, live transcript UI, AI Q&A endpoint, meeting-summary generation, participant persistence, and host moderation actions are present in the codebase.', palette.blue);
  addCard(slide, 4.9, 2.02, 3.95, 2.1, 'Important implementation details', 'Backend uses Express, Socket.io, and Prisma. The AI service uses FastAPI, Whisper, embeddings, and OpenAI responses. Meeting summaries and transcript segments are persisted and reloaded for later review.', palette.indigo);
  addCard(slide, 9.08, 2.02, 3.2, 2.1, 'Natural next upgrades', 'Replace simulated host admission, complete production deployment, add richer analytics, and deepen multi-participant reliability testing.', palette.green);
  addPanel(slide, 0.72, 4.62, 11.56, 1.45, 'FFFFFF');
  slide.addText('Presentation note', {
    x: 0.96,
    y: 4.88,
    w: 1.3,
    h: 0.15,
    fontSize: 11,
    bold: true,
    color: palette.ink,
    margin: 0
  });
  slide.addText('This deck was rebuilt to match the actual SyncMind application rather than the earlier academic outline. It is now better suited for a demo, viva, internal showcase, or product walkthrough.', {
    x: 2.18,
    y: 4.86,
    w: 9.4,
    h: 0.3,
    fontSize: 10,
    color: palette.muted,
    margin: 0
  });
  addPill(slide, 0.96, 5.48, 'Product deck', palette.blue, 'FFFFFF', 1.1);
  addPill(slide, 2.26, 5.48, 'Editable PPTX', 'EAF2FF', palette.blue, 1.14);
  addPill(slide, 3.62, 5.48, 'Code-grounded', 'EEF4FF', palette.indigo, 1.16);
}

await pptx.writeFile({ fileName: outputFile });
console.log(outputFile);
