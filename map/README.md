# The Maps of Navigating Philosophy

Two map files organize Navigating Philosophy. `world_map.html` is the top level and the recommended Canvas entry point: it holds the prologue, the regions, and the travel stops on the roads between them. `ancient_philosophy_map.html` is the Ancient Greece region map, opened from the world map, with its Aegean view and Athens zoom. Regions open in the same tab, activities open in new tabs, and every activity writes a completion key to the browser's storage that both maps read.

## The world map

The world map has two views, and both are drawn from real geography: the coastlines are traced from a 3D relief model of the earth, rasterized at sea level and baked into the page, so Britain, Iberia, Italy, Greece, Arabia, India, China, and Japan all have their actual shapes, with the nodes pinned to their real locations. The west view draws the Mediterranean and Europe and holds the prologue, Ancient Greece, the Bridge Crossing travel stop on the road north, the Monastery, and two regions in preparation: Modern European Philosophy, which the Monastery leads into, and The Atlantic World, anchored at an Atlantic port, covering the philosophical traditions of the Americas and Africa through their own thinkers and primary sources and the twentieth century debates about that history from multiple perspectives, opening only after both the Monastery and Modern European Philosophy are complete. A button at the lower right, the road east continues, opens the east view, which draws the lands from the Levant to Japan and carries the eastern road in order: The House of Wisdom in Baghdad first, then India, China, and Japan, each a region node that will open its own map, all in preparation. After Greece the fork is the player's choice, north or east. If a player completes an eastern region while the Monastery is unfinished, the map's next line tells them to complete the Monastery next. Situations on the roads are travel stops and are not chosen. A region card shows its progress count, and a region counts as done when all of its live activities are done.

## A note on chronology

The journey compresses about three centuries of Greek philosophy into one traveler's story. Thales worked in the 500s BC, The Clouds was staged in 423, the trial and death of Socrates came in 399, Plato founded the Academy in the 380s and wrote the Republic around 375, and Aristotle opened the Lyceum in 335. The player meets all of this in sequence, as though weeks apart: the preserved ship of Theseus sails as a working vessel, the cave is visited as an experience during the month of the sacred ship, and the Academy and Lyceum stand before their founding dates. The compression is a storytelling device, not a claim about history, and the activities state the real dates in their background boxes.

## The Athens zoom

Athens holds enough stops that the sea map shows them as one cluster marker labeled with the number of stops. Clicking it zooms to a drawn city view: the wall, the Acropolis with the theater cut into its south slope, the Agora and the prison inside the wall, the Lyceum grove to the east, and the cave in the hills to the southwest, each with its own numbered node and the route dashed between them. The Athens stops run: the Clouds, the trial, then the month of the sacred ship holding the Academy lesson and the cave, then the prison on the day the ship returns, and finally the Lyceum. A button in the corner returns to the sea map. Any activity given `area: "athens"` in the configuration appears in this view instead of on the sea map.

## How it works

The first entry is the prologue, "What Philosophy Is," shown as a card labeled "Before the journey" with no marker on the map, since it precedes the geography. Entries without a `node` render as cards only, which is also how future world-level stops can be staged here before they move to their own map.

Each activity is a numbered node on the map and a card in the list below it. A node is in one of three states: completed (green with a check), available (blue with its number), or locked (gray). With ordered unlocking on, activity 2 opens only after activity 1 is complete, and so on. Clicking an available node, or the Open button on its card, opens the activity in a new tab.

Completion is tracked through the browser's local storage. Each game writes a key when its end screen is reached:

- The prologue writes `phil_map_prologue`
- The Ship of Theseus writes `phil_map_ship`
- The Clouds writes `phil_map_clouds`
- The Trial of Socrates writes `phil_map_apology`
- The Academy of Plato writes `phil_map_academy`
- The Prison of Socrates writes `phil_map_phaedo`
- The Presocratics writes `phil_map_presocratics`
- The cave writes `phil_map_cave`
- The Lyceum writes `phil_map_aristotle`

When the student returns to the map tab, the map re-reads the keys and unlocks the next stop on its own. Two fallbacks cover the cases where that cannot work. First, every unlocked card carries a button reading "I finished this activity and downloaded my report," which marks the stop complete manually. Second, if the browser blocks site storage entirely, the map detects this, leaves every activity open, and explains why in a note under the cards. Since the downloadable reports are the actual graded record, the map's tracking is a convenience, never a gatekeeper for credit.

One caution for Canvas: when the map and the games run inside Canvas iframes, some browsers partition or block storage for embedded pages, so automatic unlocking may not carry between tabs. The manual button and the storage fallback exist for exactly this case. If you want no locking at all, set `ENFORCE_ORDER` to `false` (see below).

## Adding and editing activities

All configuration sits in the `ACTIVITIES` array at the top of the script. Each entry has:

- `key`: the completion key the activity writes. For a new game, add one line to its `endGame` function: `try { localStorage.setItem("your_key", "1"); } catch (err) {}`
- `title`, `place`, `desc`: the card text.
- `file`: the path to the activity, relative to this map file. Use `null` for a stop that is planned but not yet built, and it will appear grayed with the note "In preparation." Every Ancient Greece stop now ships live. Ordered unlocking skips stops in preparation: each stop unlocks when the nearest earlier available stop is complete, so a planned stop in the middle of the route never blocks progress.
- `node`: the marker's x and y on the 900 by 520 map canvas.

The order of the array is the order of the route. `ENFORCE_ORDER` at the bottom of the config turns ordered unlocking on and off.

## Folder layout

The file paths in the shipped configuration assume this layout, which matches the zip:

```
map/ancient_philosophy_map.html
presocratics/presocratics_journey.html
platos-cave/platos_cave_simulation.html
aristotle-lyceum/aristotle_lyceum.html
```

If you host all the files in one folder instead, shorten each `file` entry to just the file name.

## Deployment

Upload the folders to a static host such as GitHub Pages and link students to the map page, or embed it in Canvas:

```html
<p style="text-align:center;">
  <iframe src="https://YOURUSER.github.io/YOURREPO/map/ancient_philosophy_map.html"
          width="960" height="1150"
          style="border:1px solid #ccc; border-radius:8px; max-width:100%;"
          title="Ancient Philosophy Activity Map"></iframe>
</p>
```

Because the activities open in new tabs, students leave the Canvas frame while playing and return to the map when done, which is also the moment the map refreshes its unlock state.
