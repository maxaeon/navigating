# shared

Behaviour and styling that every activity uses, kept in one place so a
change here reaches all of them at once.

- `expedition.js` holds the two play modes and the skip button, the
  glossary tooltips, walking by pointer, saving and resuming, the split
  between narration and speech, the collapsible description, and the
  status line.
- `expedition.css` holds the styling for those.

Each activity defines `ACTIVITY_KEY` at the top of its first script,
loads `../shared/expedition.css` after its own styles, and loads
`../shared/expedition.js` as the last thing before `</body>`, so the
shared code sees everything the activity has defined.

Activities keep whatever is genuinely their own: prompts, dialogue,
drawing, the end screen, and the report.
