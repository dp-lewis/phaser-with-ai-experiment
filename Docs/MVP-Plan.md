# MVP Plan: Worms x Angry Birds Web Game

## 1. Core Features for MVP

1. **Game Engine Setup**
   - Use Phaser.js (a popular HTML5 game framework) for 2D physics, rendering, and input.

2. **Game World**
   - Simple destructible terrain (can be a static image or basic tilemap for MVP).
   - Two player characters placed on the terrain.

3. **Turn-Based System**
   - Only one player can act at a time.
   - Turns alternate after each shot.

4. **Bow & Arrow Mechanic (Angry Birds-style)**
   - Click and drag to set angle and power (slingshot mechanic).
   - Release to fire an arrow with physics-based trajectory.

5. **Arrow Physics & Collision**
   - Arrows follow a parabolic path.
   - Detect collisions with terrain and players.
   - If a player is hit, reduce their health.

6. **Win Condition**
   - When a player’s health reaches zero, the other player wins.

7. **Basic UI**
   - Display health for both players.
   - Indicate whose turn it is.

## 2. Suggested Technical Steps

1. **Project Setup**
   - Initialize a new project with Phaser.js.
   - Set up a basic HTML/JS/TS structure.

2. **Player & Terrain**
   - Create simple player sprites and a basic terrain.
   - Place players on opposite sides.

3. **Turn Logic**
   - Implement a turn manager to switch between players.

4. **Shooting Mechanic**
   - Implement click-and-drag input for aiming.
   - Visualize the aiming direction and power.
   - On release, spawn an arrow with velocity based on input.

5. **Arrow & Collision**
   - Use Phaser’s physics for arrow movement.
   - Detect collisions with terrain and players.
   - Handle damage and arrow destruction.

6. **UI & Feedback**
   - Show health bars and turn indicators.
   - Display win/lose message.

## 3. MVP Scope (What to Leave Out for Now)

- No multiplayer networking (local hot-seat only).
- No advanced terrain destruction (static or simple destructible).
- No weapon upgrades or variety.
- No AI opponents.
