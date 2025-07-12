# Architectural Decision Record: Dynamite Duel MVP

**Status:** Accepted
**Date:** 2025-07-12

## Context
We set out to build a visually appealing, turn-based web game MVP in Phaser, inspired by Angry Birds and Worms, where two players shoot dynamite at each other across a wide, parallax world. The goal was to create a fun, polished, and easily extensible foundation for future features.

## Decision
- **Framework:** Phaser 3 was chosen for its robust 2D game engine capabilities and ease of use for browser-based games.
- **Build Tooling:** Vite was selected for fast development and hot module reloading. npm is used for dependency management.
- **Testing & CI:** Playwright is used for smoke testing, and GitHub Actions for CI and deployment to GitHub Pages.
- **Game World:**
  - The world is wide (2400px), with parallax rolling hills and triangle trees for visual depth.
  - The ground is a simple green rectangle, taking up 25% of the screen height.
- **Players:**
  - Two players, each represented by a colored circle (Player 1: bright orange, Player 2: red), stand on opposite sides of the ground.
  - Each player starts with 100 health.
- **Gameplay:**
  - Turn-based: Players alternate turns.
  - Aiming is done by dragging from the player, with a capped power and a visible aim line.
  - The projectile is a stick of dynamite (red rectangle with yellow fuse) that rotates to match its velocity.
  - On impact with a player or the ground, the dynamite explodes with an animated effect and shakes the camera.
  - Health is reduced on direct hits; the game ends when a player's health reaches zero.
- **Camera:**
  - Pans to the current player at turn start.
  - Follows the dynamite horizontally in flight, then returns to the next player.
  - Clamped to avoid showing below the ground.
- **Visual Polish:**
  - Parallax backgrounds, bold title text in dynamite red, and explosion effects.
  - Responsive, full-screen layout.
- **Code Organization:**
  - All core logic is in `src/main.js`.
  - MVP plan and ADR are documented in the `Docs` folder.

## Consequences
- The codebase is easy to extend for new weapons, effects, or AI.
- Visual polish and camera logic make the game feel dynamic and fun, even as an MVP.
- Phaser and Vite provide a fast, modern workflow for future development.
- The ADR and MVP plan provide a clear record of decisions and rationale for future contributors.

---

*This ADR documents the key architectural and design decisions made during the initial development of Dynamite Duel.*
