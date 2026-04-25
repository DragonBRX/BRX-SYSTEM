---
name: emotional-game-design
description: Design emotionally resonant games by translating character inner states into interactive mechanics and mini-games. Use when agent needs to design, prototype, or document gameplay systems where player effort mirrors character psychological states—such as anxiety, monotony, grief, excitement, or confusion. Triggers include requests to create innovative game mechanics, narrative-driven mini-games, emotional gameplay loops, or when the user wants to represent feelings through play.
---

# Emotional Game Design

Transform character emotions into gameplay mechanics where **player effort = character effort**. The player does not watch the character struggle—they struggle alongside them through mechanics.

## Core Principle: Emotional Mechanics

Every gameplay interaction should externalize an internal emotional state. The player experiences the emotion through action, not cutscenes.

| Character State | Player Mechanic | Why It Works |
|---|---|---|
| Nervous / Anxious | Assemble speech balloons (word puzzle). Slow, deliberate piece placement. | Player feels the difficulty of speaking while nervous. |
| Monotonous Life | Repetitive rhythm mini-game (e.g., brushing teeth, same path to work). | Player experiences boredom through repetitive input. |
| Overwhelmed | Juggle multiple meters, rapid context-switching mini-games. | Cognitive load matches character overwhelm. |
| Grief / Depression | Heavy, slow character movement. Simple tasks require extra button presses. | Physical heaviness mirrors emotional weight. |
| Excited / Rushed | Timer compression, fast-twitch mini-games with minor penalties for haste. | Adrenaline through player input urgency. |
| Conflicted | Two opposing inputs simultaneously (e.g., left stick vs. right stick). | Literal mechanical conflict. |

## Design Workflow

### Step 1: Identify the Emotion

Define the exact psychological state the character is experiencing. Avoid generic terms like "sad." Use precise states: "fear of rejection," "numbness from routine," "cognitive overload during confrontation."

### Step 2: Map Effort Parallel

Ask: *What manual or cognitive effort would force the player to feel this emotion?*

- If the character struggles to speak → player struggles to assemble words.
- If the character is stuck in routine → player repeats the same inputs.
- If the character cannot focus → player must divide attention across mini-games.

### Step 3: Prototype and Test

Build the simplest version of the mechanic. Play it yourself. If it feels tedious **without emotional purpose**, refine. If it feels tedious **and the purpose is clear**, it works.

### Step 4: The Discard Rule

If the mechanic is boring or the emotion does not transfer to the player, **discard and restart from zero**. Do not iterate on a broken emotional core—rebuild the mechanic from the emotion up.

## Mini-Game Categories

### Cognitive Load Mini-Games
- Word assembly under time pressure (anxiety)
- Memory fragments fading as you collect them (grief)
- Multiple simple tasks spawning simultaneously (overwhelm)

### Rhythm & Repetition Mini-Games
- Daily routine tasks with diminishing returns (monotony)
- Heartbeat synchronization during fear moments (panic)
- Breathing exercises during calm moments (regulation)

### Tactile Friction Mini-Games
- Heavy button presses for every step (depression)
- Fine cursor control while the UI shakes (nervousness)
- Inverted or drifting controls during disorientation (confusion)

## Integration Rules

1. **Never explain the metaphor.** The mechanic itself is the language. Trust the player to feel it.
2. **Reward emotional completion, not perfection.** The goal is to survive the emotion, not optimize it.
3. **Vary intensity.** Mix high-stress mini-games with low-stress moments to create emotional rhythm.
4. **Keep mini-games short.** 15-60 seconds of focused emotional mechanic, then return to narrative or exploration.
5. **Use diegetic justification.** The mini-game should exist in the game world, not as an abstract overlay. Speech balloons are physical objects in the scene. Brushing teeth is a real daily action.

## Failure States

Emotional mini-games should rarely cause "game over." Instead:
- **Narrative branching:** Failure changes dialogue options or scene outcomes.
- **Emotional residue:** Failed states leave temporary mechanical effects (slower movement, muted colors).
- **Retry without punishment:** The player can attempt again, but the narrative acknowledges the struggle.

## References

- See `references/emotion-mechanic-pairs.md` for extended pairings and advanced examples.
- See `references/case-studies.md` for analyzed implementations from existing games.
