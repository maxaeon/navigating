# Navigating Philosophy

A route through the history of philosophy, walked one place at a time. Every activity is a single self-contained HTML file that runs in the browser with no build step and no external dependencies.

## Deploying to GitHub Pages

Extract this archive so that `index.html` sits at the top level beside the folders, then push the whole thing to the root of a repository. In the repository settings, under Pages, choose the branch and the root folder. The site's landing page redirects to the world map.

```
index.html            redirects to map/world_map.html
all_activities.html   a directory of every activity, by folder
.nojekyll             tells Pages to serve these files as they are
map/                  the world map and the Ancient Greece region map
prologue/  presocratics/  ship-of-theseus/  clouds/  trial/
academy/   platos-cave/   prison/           aristotle-lyceum/
monastery/ travel/        modern-europe/  roman/
```

Each folder holds its activity, a README describing what the activity covers and listing suggested further reading, and screenshots.

## Two ways to play

Activities open in relaxed mode, where every question can be skipped and the quiz and discussion questions stay hidden. A toggle at the top switches to course mode, which shows the quiz and discussion questions and requires a written answer to the final question.

To lock an activity into course mode for an assignment, add `?mode=course` to the link, which also hides the toggle:

```
https://YOURUSER.github.io/YOURREPO/monastery/paleys_watch.html?mode=course
```

## Progress

Completion, skipped stops, and partly finished activities are stored in the browser, so a student who switches devices starts the map fresh. Each activity produces a report to download and submit, which is what an assignment should be graded from.
