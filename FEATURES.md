# Pixel Brawl — Feature Reference

A browser-based 2D fighting game built in pure HTML, CSS, and JavaScript. No framework, no build step, no backend, no dependencies — open `index.html` in a browser and it runs.

**Project files**

| File | Role |
|---|---|
| `index.html` | Page shell: all CSS, the three screens (select / fight / post-match), the HUD bezel, and the game canvas. |
| `game.js` | The entire engine: frame map, arenas, constants, input, fighter state machine, combat, AI, round flow, rendering. |
| `assets/*.png` | Four 1152×1024 sprite sheets (recolors of one shared character rig). |

---

## 1. Getting Started

Double-click `index.html`. That's the whole install process.

The game needs no local server because it only loads same-folder images. If you *do* serve it (e.g. `python -m http.server 8934`), it behaves identically.

---

## 2. Roster

Four playable fighters. All four are palette recolors of the same underlying character rig and share one frame map — every pose, animation, and hitbox shape is identical across the roster. What's *not* identical is how each one plays: each has its own movement tuning, a passive trait, and a signature variant of the special move, layered entirely through data (no new animations or move systems). The archetype name is shown right on the character-select thumbnail, so the difference is visible before you even pick.

| Sprite sheet | In-game name | Archetype | Identity |
|---|---|---|---|
| `blue_ronin.png` | **Blue Ronin** | The Bruiser | Slower (8% less walk speed), hits 15% harder in melee, and takes 25% less block-chip damage. Signature special is a heavy, slow projectile: costs more meter (45) and travels slower (420 px/s) but deals the most damage of any special (22). |
| `street_fist.png` | **Street Fist** | The Rushdown | 10% faster walk speed and a 25%-shorter dash cooldown, at the cost of 10% less melee damage. Gains 25% more meter from landing hits. Signature special is a cheap, fast poke: only 25 meter, 280ms charge, 650 px/s travel, but just 10 damage. |
| `voltage.png` | **Voltage** | The Zoner | 10% less melee damage (weak up close), but passively regenerates 2 meter/second just by existing — no need to fight for resource. Signature special keeps standard cost/damage but travels at 700 px/s, making it very hard to react to. |
| `night_ninja.png` | **Night Ninja** | The Technical | Full-speed air control (no penalty from the usual 80% airborne movement cap) and a 5% higher jump. Uniquely, the signature special can be aimed while still walking — every other character is rooted in place during the special's charge, but Night Ninja isn't. Charges faster (300ms) for slightly less damage (14). |

Both sides may pick the same character; mirror matches are allowed. None of this touches animations, hitbox *shapes*, or the core rock-paper-scissors geometry from §8 — every character still ducks punches the same way and gets hit by kicks the same way. The differentiation is entirely in speed, timing, and resource numbers.

---

## 3. Arenas

Three selectable stages, each drawn entirely with canvas primitives (gradients, rectangles, arcs, glow via `shadowBlur`) — no background image assets.

- **Dojo** — an interior hall. Glowing shoji screens line the back wall (two carry faint garden-branch silhouettes), a tokonoma alcove with a hanging scroll and vase sits center-stage, dark wooden pillars and a lintel beam frame the scene, two paper lanterns hang overhead, and a tatami trim strip runs behind the wooden practice floor.
- **Neon City** — a night skyline of silhouetted buildings with procedurally scattered lit windows, a glowing magenta ring sign and cyan bar accent, over a wet street that catches colored reflections.
- **Sunset Docks** — an orange-and-violet dusk sky, a glowing sun with a reflection streak on the water, a distant boat silhouette, pier posts, and a wooden plank dock floor.

**Arena choice is purely cosmetic.** Every arena shares the same ground height, so hitboxes, physics, and spacing are byte-for-byte identical across all three. Neon City draws a slightly darker ground line than the other two to suit its palette — a color difference only, not a positional one.

---

## 4. Game Modes

- **1 Player (vs CPU)** — you control the left fighter; the right one is CPU-driven. You still choose which character the CPU uses.
- **2 Player (local)** — two people on one keyboard.

The mode toggle only changes which input source drives the right-hand fighter. Both fighters are the same class running the same state machine, so a CPU opponent has access to exactly the moves, timings, and restrictions a human does — it gets no reach, damage, or speed advantages.

---

## 5. Controls

| Action | Player 1 | Player 2 |
|---|---|---|
| Walk left / right | `A` / `D` | `←` / `→` |
| Jump | `W` | `↑` |
| Crouch / block | `S` | `↓` |
| Dash | `Shift` | `/` |
| Punch | `J` | `1` |
| Kick | `K` | `2` |
| Special | `L` | `3` |

`Esc` returns to the character-select screen from anywhere — mid-round, mid-animation, or from the post-match screen. It's handled at the very top of the key handler, before any other logic, so it can never be swallowed by game state.

Movement keys are read as **held** state; attacks, jump, and dash are read as **just-pressed** edges, so holding an attack key does not auto-repeat it. Browser scrolling from the arrow keys is suppressed. Losing window focus clears all held keys, so alt-tabbing mid-input never leaves a fighter stuck walking.

---

## 6. The Fighter State Machine

Every fighter is one object running an explicit state machine with twelve states:

`idle` · `walk` · `jump` · `crouch` · `block` · `punch` · `kick` · `special` · `dash` · `hurt` · `ko` · `win`

Each fighter tracks position and velocity, facing direction, health, special meter, the current animation cursor, and a set of timers (hitstun, dash duration, dash cooldown, hit-flash, attack phase).

### Facing

Fighters automatically turn to face their opponent while idle or walking. Facing is **locked** during punch, kick, special, dash, hurt, and block — so an attack can't swing the wrong way if the opponent crosses over mid-animation. Sprite mirroring is handled by a canvas transform, so no artwork is duplicated for the left-facing direction.

### Sprite rendering

Sprites are drawn from the shared frame map at 4× scale, anchored **bottom-center**. Because each animation frame is cropped to a different size, bottom-center anchoring keeps the fighter's feet planted on the ground line no matter which pose is showing — a fixed-box anchor would make the character visibly jitter between poses.

---

## 7. Movement

The table below is the shared baseline (exactly Voltage's numbers — Voltage carries no movement trait modifiers). Blue Ronin, Street Fist, and Night Ninja each shift a subset of these per §2's roster table; nothing else about movement changes per character.

| Property | Value |
|---|---|
| Walk speed | 220 px/s |
| Air control | 176 px/s (80% of walk) |
| Jump velocity | −780 px/s |
| Gravity | 2200 px/s² |
| Dash speed | 600 px/s |
| Dash duration | 180 ms |
| Dash cooldown | 400 ms after the dash ends |
| Body separation | 70 px minimum |

**Jumping** follows a gravity arc with reduced air control. **Crouching** lowers the fighter's hurtbox, letting them physically duck under high attacks. **Dashing** is a short committed burst — you cannot cancel or steer it once started, and it has a cooldown to prevent spam.

**Gravity is applied whenever a fighter is airborne, independent of state.** This matters: if a fighter is knocked out of the air by a hit (or KO'd mid-jump), they still fall and land properly rather than freezing at altitude.

**Body separation** gently pushes overlapping fighters apart so they can't walk through each other — but it's suspended during attacks, hitstun, and KO, so knockback and attack spacing stay honest.

---

## 8. Combat

### The three attacks

| | Punch | Kick | Special (projectile) |
|---|---|---|---|
| Damage | 6 | 12 | 16 |
| Startup | 90 ms | 170 ms | 420 ms charge |
| Active | 70 ms | 90 ms | travels until it hits or leaves |
| Recovery | 150 ms | 280 ms | 130 ms release + 220 ms recovery |
| Knockback | 90 | 220 | 200 |
| Hitstun | 220 ms | 380 ms | 320 ms |
| Meter cost | — | — | 35 |
| Screen shake | no | yes | yes |

Every melee attack runs a real **startup → active → recovery** cycle. The hitbox only exists during the active window, so attacks can whiff, trade, or be punished on recovery — a swing is a commitment, not an instant hit. Each swing can only connect once (no accidental multi-hits).

### Attack geometry — the rock-paper-scissors

Hitboxes and hurtboxes are axis-aligned boxes measured upward from the fighter's feet:

| Box | Vertical coverage |
|---|---|
| Standing hurtbox | 0 → 170 (full body) |
| Crouching hurtbox | 0 → 100 (ducked) |
| **Punch** hitbox | 105 → 170 (**high**) |
| **Kick** hitbox | 50 → 130 (**low**) |
| **Projectile** | 130 → 150 (**chest height**) |

This produces genuine tactical depth from simple geometry:

- **Crouching ducks punches entirely** — a punch sails clean over a crouching opponent and whiffs.
- **Crouching also ducks projectiles**, which travel at chest height.
- **Kicks hit crouchers.** The kick is the dedicated anti-duck tool — and it pays for that coverage with much slower startup and recovery.

So crouching beats punches and fireballs but loses to kicks; kicks beat crouchers but are slow enough to be punished by a fast punch. None of this is special-cased in code — it falls out of the box geometry using one shared overlap test.

### Blocking

Holding **down** puts you in `crouch`. If a hit lands while you're crouching, it becomes a **block**: damage is reduced by **80%**, you play a brief block-flinch animation, and you return to crouching (if still holding down) or standing.

Blocking is therefore both a damage reducer *and* a positional dodge — the same input ducks under high attacks entirely and softens anything that does connect.

### Air attacks

Punch and kick can both be thrown while airborne; dash and special stay grounded-only. An air attack keeps the fighter's jump momentum instead of rooting them in place.

Because the hitboxes travel at whatever height you're currently at:

- Thrown **early in the arc**, an air attack sails harmlessly over a grounded opponent.
- Thrown **late, on the way down**, it connects as a classic jump-in.
- Against **another airborne opponent** at similar height, it lands easily — making air-to-air a real option.

Kick's taller hitbox makes it noticeably more forgiving to land while descending.

### Special meter

The meter fills to 100 by **landing hits, taking hits, and having attacks blocked** — so both aggression and enduring pressure build toward a special. Attackers gain the most (8 punch / 12 kick / 10 projectile), defenders gain a smaller share for being hit (5–6), and chip meter is awarded on block (3–5).

The special's exact cost, charge time, damage, and travel speed are per-character (see §2's roster table — Voltage's numbers, 35 meter / 420 ms / 16 dmg / 500 px/s, are the baseline every other character's signature deviates from). Whatever the character, the cost is always deducted **at release, not at charge start** — if you get hit during the charge, it's cancelled and **no meter is spent**, so a punished charge costs tempo, not resource.

The projectile always spawns at chest height and can be blocked, ducked, or simply outrun regardless of character. It expires after 1200 ms or on leaving the stage.

### Hit feedback

- A brief **white flash** on the struck fighter (120 ms).
- An **8-particle burst** at the point of contact (300 ms lifetime).
- **Knockback** scaled to the attack's weight.
- **Hitstun** that locks the defender out of acting.
- A subtle **screen shake** (150 ms) on heavy hits — kicks and specials only, so it stays meaningful.
- **Hit-stop**: the instant a hit lands, the entire match freezes for a short beat — 40 ms on a punch, 80 ms on a kick or projectile, 140 ms on a KO — before knockback and hitstun continue. Both fighters freeze equally (it's a shared dramatic pause, not a defender-only lockout), and a button press made during that freeze isn't lost — it's held and registers the instant the freeze ends.
- **Synthesized sound** for every hit, block, dash, and KO — punches crack, kicks thud, blocks sound muffled, dashes whoosh, and a KO gets its own heavier stinger. All of it is generated at runtime with the Web Audio API (oscillators and filtered noise bursts) — there are no sound files and no asset weight. Audio unlocks on the player's first keypress or click, per browser autoplay rules.

Blocked hits get a smaller 4-particle burst, no shake, and a shorter hit-stop, giving blocks a distinctly softer feel.

---

## 9. Match Structure

**Best of three rounds.** First fighter to win 2 rounds takes the match.

Each round runs through a small internal cycle:

1. **Round intro** — a "ROUND N" banner for 1.5 s while the fighters stand ready, with its own two-note "ready" stinger.
2. **Fighting** — a 60-second timer counts down.
3. **Round end** — a 2 s banner naming the round winner, with a resolving chime.
4. Either the next round begins (another "ready" stinger), or the match ends, the post-match screen appears, and a longer three-note fanfare plays.

All three stingers are synthesized the same way as the combat hit sounds (Web Audio oscillators, no files) — see §8's Hit Feedback for the technique.

**A round is won by:**

- **KO** — dropping the opponent to 0 health. The KO'd fighter freezes in a knocked-out pose, the winner strikes a victory pose, and the round holds for 1.2 s before resolving.
- **Timeout** — when the clock hits zero, the fighter with more health wins.

**Draws are possible.** If time expires with both fighters on exactly equal health, the round is a draw — no one is awarded the round, and the game moves on to the next one.

### Post-match screen

- **Rematch** — restarts the match with the same fighters, same arena, and a reset 0–0 score.
- **Change Characters** — returns to the select screen.

Arena choice persists through a rematch (it's committed once when a match starts) and can be changed again on any trip back to the select screen.

---

## 10. CPU Opponent

The AI runs through **exactly the same input interface as a human player** — it fills in the same set of button flags, and the fighter update code cannot tell the difference. It gets no special access and obeys the same startup frames, cooldowns, and meter costs.

Decisions are made on a **randomized 200–350 ms timer** rather than every frame, which keeps the CPU from reacting with inhuman precision. Between decisions the previous input persists, so movement stays smooth rather than stuttering.

**Reactive layer** (checked first, can override everything else):

- If the opponent is mid-swing on an active punch or kick within ~100 px → **50% chance to duck/block**.
- If a projectile is incoming and closing within ~150 px → **70% chance to duck under it**.

**Distance-based behavior:**

| Range | Behavior |
|---|---|
| **Far** (>220 px) | Approach, with occasional hops (8%) or dash-ins (8%). |
| **Mid** (90–220 px) | Mixes approaching, dash-ins, specials (if meter allows), guarding, and stepping back. |
| **Close** (<90 px) | 35% punch, 25% kick, 20% guard, 10% special, 10% step back. |

The result is an opponent that pressures, defends, whiffs, and occasionally reads you — not a genius, but a live and genuinely winnable-against sparring partner.

---

## 11. Presentation

### The HUD

Rendered as real DOM elements in a dark arcade bezel wrapped around the canvas — not painted into the game bitmap. This keeps the HUD crisp and unaffected by screen shake while the canvas stays a pure pixel-art surface.

- **Health bars** for both fighters (cyan for P1, red for P2), draining in real time.
- **Special-meter bars** beneath each health bar, in gold.
- **Character names** above each bar.
- **Round timer** centered between them.
- **Round pips** showing how many rounds each fighter has won.
- **Center banners** for round intros, round results, and match results.

### The canvas

Fixed at **960×540** with `image-rendering: pixelated`, so the pixel art scales up crisply with no blurring. Draw order each frame: background → projectiles → fighters → particles, with an optional shake transform wrapping the whole scene.

### Character select

The select screen shows a **live-animating idle-pose preview** of all four characters for each side, so you see the actual sprite before committing, plus a compact arena picker with a rendered mini-snapshot of each stage.

---

## 12. Engine Architecture

**Fixed-timestep simulation.** The game logic advances in fixed 60 Hz steps via an accumulator, while rendering happens once per animation frame. This means combat timings — startup frames, hitstun, dash duration — are **identical on a 60 Hz monitor and a 144 Hz monitor**, which is essential for a fighting game to feel consistent. Frame delta is clamped to 50 ms so returning from a background tab can never fast-forward the match.

**Update order each step:** check hit-stop (if the match is frozen on a fresh hit, the step ends here — nothing else advances) → gather input → run each fighter's state machine and physics → resolve combat (hitboxes, projectiles, body separation) → update round and match bookkeeping → advance animation cursors → age particles and timers → sync the DOM HUD.

**Data-driven content.** Characters and arenas are plain arrays of descriptor objects. Adding a fourth arena or a fifth skin means appending one entry — the select screen builds its thumbnails by iterating those arrays, so the UI updates itself with no additional wiring.

**Per-animation frame pacing.** Each animation defines its own hold time, tuned to its purpose: idle breathes slowly at 260 ms/frame, walk cycles at 70 ms, block flinches at 45 ms, and attack animations are driven directly by their startup/active/recovery phases so the visible pose always matches the actual hitbox state.

---

## 13. Design Notes & Known Nuances

- **Attack geometry is the balance.** Nearly all the tactical depth comes from three overlapping boxes rather than special-case rules, which keeps the combat code small and the behavior predictable.
- **Blocks cost the attacker.** Because blocked hits still grant the attacker chip meter, pure turtling still feeds the opponent's special — there's pressure to eventually act.
- **Interrupted specials are cheap.** Meter is only spent on release, so a punished charge is a tempo loss rather than a resource loss. This makes the special worth attempting without feeling ruinous.
- **Draw rounds don't award a win.** A perfectly even timeout advances the round counter without moving the score, so a match with repeated draws will keep playing rounds until someone actually wins two.
- **Air attacks can't be re-thrown mid-jump.** Once an air attack finishes recovering, the fighter returns to the falling jump state — they can't chain a second one or double-jump out of it.
- **Character identity is pure data, not new art.** Every trait (movement multipliers, damage/meter modifiers, the signature special's cost/timing/damage/speed) is a plain number on the character's entry in `SKINS` — no new animations, no new move types, no character-specific code branches scattered through the engine. The one exception is Night Ninja's "keeps moving while charging" trait, which is a single `freeMove` flag read in one place (`updateSpecial`).
- **The signature special reuses the exact same charge→release→recovery pipeline for every character.** Only the numbers feeding it differ (cost, charge time, damage, projectile speed) — there's no per-character special-move logic to maintain.
