import { useState, useCallback, useRef } from 'react';
import { marked } from 'marked';
import html2pdf from 'html2pdf.js';
import { useReflection } from '../store';

marked.setOptions({ gfm: true, breaks: true });

/* ═══════════════════════════════════════════════════════════
   ROBUST PARSER  — handles all AI output format variations
═══════════════════════════════════════════════════════════ */
function parseReportData(markdown) {
  const data = {
    normalizedRole: null,
    normalizedProject: null,
    execSummary: [],
    workDist: [],
    cogLoad: { high: [], moderate: [], low: [] },
    improvements: [],
    courses: [],
    dependencies: [],
  };

  if (!markdown) return data;

  /* ── 1. Extract ROLE_DISPLAY / PROJECT_DISPLAY markers ── */
  const roleM = markdown.match(/^ROLE_DISPLAY:\s*(.+)/m);
  const projM = markdown.match(/^PROJECT_DISPLAY:\s*(.+)/m);
  if (roleM) data.normalizedRole    = roleM[1].trim().replace(/^[\[<]|[\]>]$/g, '');
  if (projM) data.normalizedProject = projM[1].trim().replace(/^[\[<]|[\]>]$/g, '');

  /* ── helpers ── */

  // Return text from the line AFTER a heading that matches `headingRe`
  // up to (but not including) the first subsequent line matching `stopRe`.
  // stopRe is tested on EVERY line (not just headings) so --- separators work too.
  function extractSection(md, headingRe, stopRe) {
    const lines = md.split('\n');
    let collecting = false;
    const out = [];
    for (const line of lines) {
      if (!collecting) {
        if (/^#{1,5}\s/.test(line) && headingRe.test(line)) collecting = true;
      } else {
        if (stopRe && stopRe.test(line)) break;   // no isHeading gate — catches --- too
        out.push(line);
      }
    }
    return out.join('\n');
  }

  // Parse pipe-delimited table rows from a block of text.
  // Skips separator rows like |---|---| and optional column-header rows.
  function parseTable(block, skipRowRe) {
    return block
      .split('\n')
      .filter((line) => {
        if (!line.includes('|')) return false;
        // Separator row: every cell between pipes is only dashes/colons/spaces
        const cells = line.split('|').filter(Boolean);
        if (cells.every((c) => /^[\s\-:]+$/.test(c))) return false;
        if (skipRowRe && skipRowRe.test(line)) return false;
        return true;
      })
      .map((line) =>
        line
          .split('|')
          .map((c) => c.replace(/\*\*/g, '').trim())
          .filter(Boolean),
      )
      .filter((cells) => cells.length >= 2 && cells[0].length > 0);
  }

  /* ── 2. Executive Summary ── */
  const execBlock = extractSection(
    markdown,
    /Executive Summary/i,
    /^##\s/,            // stop at next ## level heading
  );
  if (execBlock) {
    parseTable(execBlock, /Element.*Description/i).forEach((cells) => {
      if (!/^element$/i.test(cells[0])) {
        data.execSummary.push({ key: cells[0], val: cells[1] });
      }
    });
  }

  /* ── 3. Work Distribution ── */
  const workBlock = extractSection(
    markdown,
    /Work Distribution/i,
    /^###\s/,           // stop at next ### level heading
  );
  if (workBlock) {
    parseTable(workBlock, /Work Area.*Approx|^Work Area/i).forEach((cells) => {
      if (!/^work area$/i.test(cells[0])) {
        const pct = parseInt(cells[1]);
        if (!isNaN(pct) && pct > 0) {
          data.workDist.push({ area: cells[0], pct, notes: cells[2] || '' });
        }
      }
    });
  }

  /* ── 4. Cognitive Load ── */
  const cogBlock = extractSection(markdown, /Cognitive Load/i, /^###\s/);
  if (cogBlock) {
    const split = (s) =>
      s
        ? s.split(/[,;]/).map((x) => x.replace(/^\(|\)$/g, '').replace(/\*\*/g, '').trim()).filter(Boolean).slice(0, 5)
        : [];
    const hM = cogBlock.match(/\*\*High[^*]*\*\*[:\s]+([^\n]+)/i);
    const mM = cogBlock.match(/\*\*Moderate[^*]*\*\*[:\s]+([^\n]+)/i);
    const lM = cogBlock.match(/\*\*Low[^*]*\*\*[:\s]+([^\n]+)/i);
    data.cogLoad.high     = split(hM?.[1]);
    data.cogLoad.moderate = split(mM?.[1]);
    data.cogLoad.low      = split(lM?.[1]);
  }

  /* ── 5. Dependency Map ── */
  const depBlock = extractSection(markdown, /Dependency Map/i, /^###\s|^---/);
  if (depBlock) {
    parseTable(depBlock, /Stakeholder.*Depends/i).forEach((cells) => {
      if (!/^stakeholder$/i.test(cells[0])) {
        data.dependencies.push({ who: cells[0], for: cells[1] });
      }
    });
  }

  /* ── 6. Improvement Areas ── */
  const impBlock = extractSection(markdown, /Key Improvement/i, /^###\s|^---/);
  if (impBlock) {
    // Primary pattern: **Title:** description
    for (const m of impBlock.matchAll(/\*\*([^*:\n]{2,60}):\*\*\s*([^\n]+)/g)) {
      data.improvements.push({ title: m[1].trim(), desc: m[2].trim() });
    }
    // Fallback: - **Title:** description
    if (data.improvements.length === 0) {
      for (const m of impBlock.matchAll(/[-*]\s+\*\*([^*:\n]{2,60}):\*\*\s*([^\n]+)/g)) {
        data.improvements.push({ title: m[1].trim(), desc: m[2].trim() });
      }
    }
    // Fallback 2: numbered list
    if (data.improvements.length === 0) {
      for (const m of impBlock.matchAll(/\d+\.\s+\*\*([^*:\n]{2,60}):\*\*\s*([^\n]+)/g)) {
        data.improvements.push({ title: m[1].trim(), desc: m[2].trim() });
      }
    }
  }

  /* ── 7. Recommended Courses ── */
  const courseBlock = extractSection(markdown, /Recommended.*Upskill|Upskilling Course/i, /^---\s*$|^##\s/);
  if (courseBlock) {
    parseTable(courseBlock, /Course.*Platform|Certification.*Platform/i).forEach((cells) => {
      if (!/^course|^certification/i.test(cells[0])) {
        data.courses.push({ name: cells[0], platform: cells[1] || '', relevance: cells[2] || '' });
      }
    });
  }

  return data;
}

/* ═══════════════════════════════════════════════════════════
   SMART PDF BUILDER  — visual one-pager with charts & cards
═══════════════════════════════════════════════════════════ */
function buildSmartPDFHtml(userName, rawRole, rawProject, data) {
  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Use AI-normalized values if available, fall back to raw
  const displayRole    = data.normalizedRole    || rawRole    || 'Professional';
  const displayProject = data.normalizedProject || rawProject || '—';

  const C = {
    primary : '#4a6cf7',
    purple  : '#9b72cb',
    green   : '#22c55e',
    orange  : '#f97316',
    red     : '#ef4444',
    teal    : '#06b6d4',
    pink    : '#ec4899',
    text1   : '#1e293b',
    text2   : '#64748b',
    text3   : '#94a3b8',
    border  : '#e2e8f0',
    bg      : '#f8fafc',
    card    : '#ffffff',
  };

  const CHART_COLORS = [C.primary, C.purple, C.teal, C.orange, C.green, C.red, C.pink];

  /* ── Work distribution bars ── */
  const totalPct  = data.workDist.reduce((s, d) => s + d.pct, 0);
  const workBars  = data.workDist.length > 0
    ? data.workDist.map((d, i) => `
        <div style="display:flex;align-items:center;gap:8px;margin:5px 0;">
          <div style="width:115px;font-size:8.5px;color:${C.text2};line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${d.area}">${d.area}</div>
          <div style="flex:1;background:#eef2ff;border-radius:4px;height:14px;overflow:hidden;">
            <div style="width:${Math.min(d.pct, 100)}%;background:${CHART_COLORS[i % CHART_COLORS.length]};height:100%;border-radius:4px;min-width:4px;"></div>
          </div>
          <div style="width:32px;font-size:9.5px;font-weight:700;color:${CHART_COLORS[i % CHART_COLORS.length]};text-align:right;">${d.pct}%</div>
        </div>`).join('')
    : `<p style="font-size:9px;color:${C.text3};padding:8px 0;">See full report for work distribution.</p>`;

  /* ── Executive summary rows ── */
  const execRows = data.execSummary.length > 0
    ? data.execSummary.slice(0, 7).map((r) => `
        <div style="display:flex;padding:5px 0;border-bottom:1px solid ${C.border};">
          <div style="font-size:7.5px;font-weight:700;color:${C.text3};text-transform:uppercase;letter-spacing:0.05em;width:42%;padding-right:8px;line-height:1.5;">${r.key}</div>
          <div style="font-size:8.5px;color:${C.text1};width:58%;line-height:1.5;">${r.val}</div>
        </div>`).join('')
    : `<p style="font-size:9px;color:${C.text3};padding:8px 0;">See full report for role profile.</p>`;

  /* ── Cognitive load tags ── */
  const cogBands = [
    { label: 'High',     items: data.cogLoad.high,     color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    { label: 'Moderate', items: data.cogLoad.moderate, color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
    { label: 'Low',      items: data.cogLoad.low,      color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  ].filter((r) => r.items.length > 0);

  const cogSection = cogBands.length > 0
    ? cogBands.map((r) => `
        <div style="margin-bottom:9px;">
          <div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;">
            <div style="width:8px;height:8px;border-radius:2px;background:${r.color};flex-shrink:0;"></div>
            <span style="font-size:8px;font-weight:700;color:${r.color};text-transform:uppercase;letter-spacing:0.06em;">${r.label}</span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:3px;">
            ${r.items.map((item) => `<span style="font-size:7.5px;background:${r.bg};color:${r.color};border:1px solid ${r.border};padding:2px 7px;border-radius:10px;">${item}</span>`).join('')}
          </div>
        </div>`).join('')
    : `<p style="font-size:9px;color:${C.text3};padding:8px 0;">See full report for cognitive load.</p>`;

  /* ── Dependency map rows ── */
  const depRows = data.dependencies.length > 0
    ? data.dependencies.slice(0, 6).map((d, i) => `
        <div style="display:flex;gap:8px;padding:5px 0;border-bottom:1px solid ${C.border};">
          <div style="font-size:8.5px;font-weight:600;color:${C.primary};width:35%;line-height:1.4;">${d.who}</div>
          <div style="font-size:8px;color:${C.text2};width:65%;line-height:1.4;">${d.for}</div>
        </div>`).join('')
    : `<p style="font-size:9px;color:${C.text3};padding:8px 0;">See full report for dependency map.</p>`;

  /* ── Improvement cards (2-column via nested table) ── */
  const impCard = (imp, idx) => imp
    ? `<div style="background:#f5f8ff;border:1px solid #dbeafe;border-left:3px solid ${C.primary};border-radius:7px;padding:10px 12px;height:100%;box-sizing:border-box;">
        <div style="font-size:7.5px;font-weight:700;color:${C.primary};text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">${String(idx + 1).padStart(2, '0')} · ${imp.title}</div>
        <div style="font-size:8.5px;color:${C.text2};line-height:1.55;">${imp.desc}</div>
      </div>`
    : '<div></div>';

  const impItems = data.improvements.slice(0, 6);
  const impGrid  = impItems.length > 0
    ? (() => {
        const pairs = [];
        for (let i = 0; i < impItems.length; i += 2) pairs.push([impItems[i], impItems[i + 1]]);
        return pairs.map(([a, b], ri) => `
          <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
            <tr>
              <td style="width:50%;vertical-align:top;padding-right:5px;">${impCard(a, ri * 2)}</td>
              <td style="width:50%;vertical-align:top;padding-left:5px;">${b ? impCard(b, ri * 2 + 1) : ''}</td>
            </tr>
          </table>`).join('');
      })()
    : `<p style="font-size:9px;color:${C.text3};">See full report for improvement recommendations.</p>`;

  /* ── Courses table rows ── */
  const courseRows = data.courses.length > 0
    ? data.courses.slice(0, 5).map((c, i) => `
        <tr style="background:${i % 2 === 0 ? C.card : C.bg};">
          <td style="padding:5px 8px;font-size:8.5px;color:${C.text1};border:1px solid ${C.border};font-weight:500;">${c.name}</td>
          <td style="padding:5px 8px;font-size:8px;color:${C.primary};border:1px solid ${C.border};white-space:nowrap;">${c.platform}</td>
          <td style="padding:5px 8px;font-size:8px;color:${C.text2};border:1px solid ${C.border};">${c.relevance}</td>
        </tr>`).join('')
    : `<tr><td colspan="3" style="padding:10px;font-size:9px;color:${C.text3};border:1px solid ${C.border};">See full report for recommended courses.</td></tr>`;

  /* ── Work dist legend dots ── */
  const legendDots = data.workDist.slice(0, 5).map((d, i) => `
    <div style="display:flex;align-items:center;gap:4px;">
      <div style="width:7px;height:7px;border-radius:50%;background:${CHART_COLORS[i % CHART_COLORS.length]};flex-shrink:0;"></div>
      <span style="font-size:7.5px;color:${C.text2};">${d.area.slice(0, 20)}${d.area.length > 20 ? '…' : ''}</span>
    </div>`).join('');

  // Return a plain HTML fragment (no <!DOCTYPE> / <html> wrapper) so that
  // setting it via innerHTML works correctly — full document strings cause
  // browsers to strip <head>/<style> and leave the canvas blank.
  return `<div style="width:794px;min-height:1123px;background:#fff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1e293b;-webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box;margin:0;padding:0;">

  <!-- ════════ HEADER ════════ -->
  <div style="background:linear-gradient(135deg,#4a6cf7 0%,#9b72cb 55%,#c084fc 100%);padding:24px 28px 18px;position:relative;overflow:hidden;">
    <!-- Decorative blobs -->
    <div style="position:absolute;top:-35px;right:-25px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,0.06);"></div>
    <div style="position:absolute;top:20px;right:80px;width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,0.05);"></div>
    <div style="position:absolute;bottom:-15px;left:220px;width:90px;height:90px;border-radius:50%;background:rgba(255,255,255,0.04);"></div>

    <div style="display:flex;justify-content:space-between;align-items:flex-start;position:relative;z-index:1;">
      <div>
        <div style="font-size:7.5px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.18em;margin-bottom:5px;">Self-Review Summary</div>
        <div style="font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.03em;line-height:1.1;">ReflectAI</div>
        <div style="font-size:8px;color:rgba(255,255,255,0.6);margin-top:4px;letter-spacing:0.04em;">Business Transformation Services · Aligned Automation</div>
      </div>
      <div style="text-align:right;position:relative;z-index:1;">
        <div style="font-size:7.5px;color:rgba(255,255,255,0.5);margin-bottom:6px;">Generated ${dateStr}</div>
        ${userName ? `<div style="display:inline-block;font-size:12px;font-weight:700;color:#fff;background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.3);padding:5px 14px;border-radius:22px;">${userName}</div>` : ''}
      </div>
    </div>

    <!-- Role / Project chips -->
    <div style="display:flex;gap:10px;margin-top:16px;position:relative;z-index:1;flex-wrap:wrap;">
      <div style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.22);border-radius:8px;padding:8px 14px;max-width:280px;">
        <div style="font-size:6.5px;text-transform:uppercase;letter-spacing:0.12em;color:rgba(255,255,255,0.55);margin-bottom:3px;">Role</div>
        <div style="font-size:11px;font-weight:700;color:#fff;line-height:1.3;">${displayRole}</div>
      </div>
      <div style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.22);border-radius:8px;padding:8px 14px;flex:1;min-width:200px;">
        <div style="font-size:6.5px;text-transform:uppercase;letter-spacing:0.12em;color:rgba(255,255,255,0.55);margin-bottom:3px;">Project / Initiative</div>
        <div style="font-size:11px;font-weight:700;color:#fff;line-height:1.3;">${displayProject}</div>
      </div>
    </div>
  </div>

  <!-- ════════ BODY ════════ -->
  <div style="padding:18px 28px 0;">

    <!-- ROW 1 : Role Profile | Work Distribution -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
      <tr>
        <td style="width:43%;vertical-align:top;padding-right:9px;">
          <div style="background:${C.card};border:1px solid ${C.border};border-radius:10px;padding:14px 15px;height:100%;">
            <div style="font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:${C.text3};margin-bottom:10px;">Role Profile</div>
            ${execRows}
          </div>
        </td>
        <td style="width:57%;vertical-align:top;padding-left:9px;">
          <div style="background:${C.card};border:1px solid ${C.border};border-radius:10px;padding:14px 15px;">
            <div style="font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:${C.text3};margin-bottom:10px;">Work Distribution
              <span style="margin-left:6px;font-size:7px;font-weight:500;color:${C.text3};">Approx. % split · Total: ${totalPct}%</span>
            </div>
            ${workBars}
            ${data.workDist.length > 0 ? `<div style="margin-top:10px;padding-top:8px;border-top:1px solid ${C.border};display:flex;flex-wrap:wrap;gap:8px;">${legendDots}</div>` : ''}
          </div>
        </td>
      </tr>
    </table>

    <!-- ROW 2 : Cognitive Load | Dependency Map -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
      <tr>
        <td style="width:43%;vertical-align:top;padding-right:9px;">
          <div style="background:${C.card};border:1px solid ${C.border};border-radius:10px;padding:14px 15px;height:100%;">
            <div style="font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:${C.text3};margin-bottom:10px;">Cognitive Load Profile</div>
            ${cogSection}
          </div>
        </td>
        <td style="width:57%;vertical-align:top;padding-left:9px;">
          <div style="background:${C.card};border:1px solid ${C.border};border-radius:10px;padding:14px 15px;">
            <div style="font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:${C.text3};margin-bottom:8px;">Dependency Map</div>
            <div style="display:flex;gap:8px;padding-bottom:5px;margin-bottom:2px;border-bottom:2px solid ${C.border};">
              <div style="font-size:7.5px;font-weight:700;color:${C.text3};text-transform:uppercase;letter-spacing:0.06em;width:35%;">Stakeholder</div>
              <div style="font-size:7.5px;font-weight:700;color:${C.text3};text-transform:uppercase;letter-spacing:0.06em;">Depends on You For</div>
            </div>
            ${depRows}
          </div>
        </td>
      </tr>
    </table>

    <!-- DIVIDER -->
    <div style="display:flex;align-items:center;gap:12px;margin:16px 0 13px;">
      <div style="flex:1;height:1px;background:linear-gradient(90deg,${C.border},transparent);"></div>
      <div style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:${C.purple};background:#faf5ff;border:1px solid #e9d5ff;padding:4px 14px;border-radius:20px;white-space:nowrap;">Development Recommendations</div>
      <div style="flex:1;height:1px;background:linear-gradient(90deg,transparent,${C.border});"></div>
    </div>

    <!-- Key Improvement Areas -->
    <div style="margin-bottom:14px;">
      <div style="font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:${C.text3};margin-bottom:9px;">Key Improvement Areas</div>
      ${impGrid}
    </div>

    <!-- Recommended Courses -->
    <div style="margin-bottom:22px;">
      <div style="font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:${C.text3};margin-bottom:9px;">Recommended Upskilling Courses</div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="padding:6px 8px;font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${C.text2};text-align:left;border:1px solid ${C.border};">Course / Certification</th>
            <th style="padding:6px 8px;font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${C.text2};text-align:left;border:1px solid ${C.border};white-space:nowrap;">Platform</th>
            <th style="padding:6px 8px;font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${C.text2};text-align:left;border:1px solid ${C.border};">Why Relevant</th>
          </tr>
        </thead>
        <tbody>${courseRows}</tbody>
      </table>
    </div>

  </div><!-- /body -->

  <!-- ════════ FOOTER ════════ -->
  <div style="margin:0 28px;padding:10px 0;border-top:1px solid ${C.border};display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:7.5px;color:${C.text3};letter-spacing:0.03em;">Confidential · For internal use only</div>
    <div style="display:flex;align-items:center;gap:6px;">
      <div style="width:13px;height:13px;border-radius:3px;background:linear-gradient(135deg,#4a6cf7,#9b72cb);"></div>
      <div style="font-size:8px;font-weight:600;color:${C.text2};">ReflectAI · Business Transformation Services, Aligned Automation</div>
    </div>
  </div>

</div>`;
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════ */
export default function FinalReport() {
  const { finalReport, userName, role, project, restart } = useReflection();
  const [copied, setCopied]       = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const reportRef = useRef(null);

  // Strip internal parser-only markers before rendering markdown
  const cleanedMarkdown = (finalReport || '')
    .replace(/^ROLE_DISPLAY:\s*.+$/m, '')
    .replace(/^PROJECT_DISPLAY:\s*.+$/m, '')
    .trim();
  const html = marked.parse(cleanedMarkdown);

  /* ── Download PDF ── */
  const handleDownloadPDF = useCallback(async () => {
    if (!finalReport) return;
    setPdfLoading(true);

    try {
      const data    = parseReportData(finalReport);
      const pdfHtml = buildSmartPDFHtml(userName, role, project, data);

      // Off-screen container — position:absolute keeps it out of the viewport
      // while still being measurable by html2canvas (fixed can clip on some browsers).
      const wrap = document.createElement('div');
      // pdfHtml is a plain fragment (no <html>/<head>), safe to inject via innerHTML
      wrap.style.cssText = 'position:absolute;left:-9999px;top:0;';
      wrap.innerHTML = pdfHtml;
      document.body.appendChild(wrap);

      // Give the browser a full paint cycle to lay out the HTML before capture.
      await new Promise((r) => setTimeout(r, 300));

      // Capture the inner page div directly (not the wrapper) so html2canvas
      // measures the correct 794px width.
      const pageEl = wrap.firstElementChild || wrap;

      const opt = {
        margin      : 0,
        filename    : `ReflectAI_SelfReview${userName ? `_${userName.replace(/\s+/g, '_')}` : ''}.pdf`,
        image       : { type: 'jpeg', quality: 0.97 },
        html2canvas : { scale: 2, useCORS: true, logging: false, allowTaint: true, width: 794 },
        jsPDF       : { orientation: 'portrait', unit: 'mm', format: 'a4' },
      };

      await html2pdf().set(opt).from(pageEl).save();
      document.body.removeChild(wrap);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setPdfLoading(false);
    }
  }, [finalReport, userName, role, project]);

  /* ── Copy to clipboard ── */
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(finalReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = reportRef.current;
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
    }
  }, [finalReport]);

  if (!finalReport) return null;

  return (
    <div className="artifact-panel">
      {/* ── Toolbar ── */}
      <div className="artifact-toolbar">
        <div className="artifact-toolbar-left">
          <div className="artifact-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="artifact-title">Work Reflection Report</span>
          <span className="artifact-badge">Complete</span>
        </div>

        <div className="artifact-toolbar-right">
          {/* Copy */}
          <button className="artifact-action-btn" onClick={handleCopy} title="Copy report text">
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>

          {/* PDF */}
          <button
            className="artifact-action-btn"
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            title="Download smart PDF report"
          >
            {pdfLoading ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" />
                </svg>
                <span>Generating…</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>PDF</span>
              </>
            )}
          </button>

          <div className="artifact-divider" />

          {/* Reset */}
          <button className="artifact-action-btn artifact-reset-btn" onClick={restart} title="Reset and start over">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M2 8a6 6 0 1 1 1.76 4.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M2 4v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ── Report content ── */}
      <div className="artifact-content" ref={reportRef}>
        <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
