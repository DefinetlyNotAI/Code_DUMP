# Visual Novel Engine

A modular, JSON-driven visual novel engine built with React and Vite, inspired by Ren'Py.

## 🚀 For Beginners: Quick Start

### Setup

1. Clone the repository
2. Run `npm install`
3. Run `npm run dev` to start the development server

### Creating Your First Visual Novel

1. **Create JSON files** in the `public/data` folder:
    - `start.json` - Your first scene
    - `order.json` - Controls the flow of your story

2. **Minimal `start.json` example**:
    ```json
    [
        {
        "text": "Welcome to my visual novel!",
        "speaker": "Narrator",
        "background": "room.jpg"
        },
        {
        "text": "Would you like to continue?",
        "speaker": "Narrator",
        "type": "choice",
        "choices": [
          {
            "text": "Yes",
            "value": "Yes"
          },
          {
            "text": "No",
            "value": "No"
          }
        ]
        }
    ]
    ```

3. **Minimal `order.json` example**:
    ```json
    [
        {
        "event": "start.json"
        },
        {
        "condition": "user_choice == 'Yes'",
        "event": "continue.json"
        },
        {
        "condition": "user_choice == 'No'",
        "event": "end.json"
        }
    ]
    ```

4. **Add assets**:
    - Place background images in `public/assets/backgrounds/`
    - Place audio files in `public/assets/audio/music/` and `public/assets/audio/sfx/`

5. **Run your visual novel** with `npm run dev`

That's it! You now have a working visual novel with branching paths.

---

## 🧠 For Pros: Comprehensive Guide

### Architecture Overview

The Visual Novel Engine is built with a modular architecture that separates concerns:

- **State Management**: Global game state with choice tracking
- **Event System**: JSON-based event processing with conditional logic
- **Rendering Layer**: React components for UI elements
- **Audio System**: Background music and sound effects management

### JSON Schema Reference

#### Event Files

Each event file is an array of nodes that define the visual novel's content:

```json
[
  {
    "type": "dialogue",
    "text": "The text to display",
    "speaker": "Character name or null for narration",
    "background": "background-image.jpg",
    "music": "background-music.mp3",
    "sfx": "sound-effect.mp3",
    "effect": "\"fade\" OR { \"variableName\": \"value\" }"
  }
]
```

##### Node Properties

| Property     | Type           | Description                              | Example                         |
|--------------|----------------|------------------------------------------|---------------------------------|
| `type`       | string         | Node type (dialogue, choice, jump, etc.) | `"dialogue"`                    |
| `text`       | string         | The text to display                      | `"Hello world"`                 |
| `speaker`    | string\|null   | Character name or null for narration     | `"Alice"`                       |
| `background` | string         | Background image filename                | `"forest.jpg"`                  |
| `music`      | string         | Background music filename or "stop"      | `"theme.mp3"`                   |
| `sfx`        | string\|array  | Sound effect(s) to play                  | `"click.mp3"`                   |
| `effect`     | string\|object | Visual effect or variable assignment     | `"fade"` or `{"var1": "value"}` |
| `choices`    | array          | Array of choices (for choice nodes)      | See below                       |
| `target`     | string         | Target event file (for jump nodes)       | `"chapter2.json"`               |

##### Choice Objects

```json
{
  "text": "Choice text",
  "value": "Value to store"
}
```

#### Order File

The `order.json` file defines the flow of events:

```json
[
  {
    "event": "start.json"
  },
  {
    "condition": "variable == 'value'",
    "event": "conditional-event.json"
  }
]
```

##### Order Properties

| Property    | Type   | Description           | Example                  |
|-------------|--------|-----------------------|--------------------------|
| `event`     | string | Event file to load    | `"start.json"`           |
| `condition` | string | Condition to evaluate | `"user_choice == 'Yes'"` |

### Condition Syntax

Conditions use a simple expression syntax:

- `variable == value`: Equality check
- `variable != value`: Inequality check
- `variable === value`: Strict equality check
- `variable !== value`: Strict inequality check
- `variable > value`: Greater than
- `variable < value`: Less than
- `variable >= value`: Greater than or equal
- `variable <= value`: Less than or equal

### Variable System

Variables are stored in the global choice state:

- Set variables with the `effect` property as an object: `"effect": {"varName": "value"}`
- Access variables in conditions: `"condition": "varName == 'value'"`

### Node Types

1. **dialogue**: Standard text display
2. **choice**: Presents options to the player
3. **jump**: Jumps to another event file
4. **effect**: Executes effects without displaying text

### Visual Effects

- `"fade"`: Fade transition between backgrounds
- `"glitch"`: Glitch effect for scene transitions

### Audio System

#### Background Music

- Set with the `music` property
- Use `"music": "stop"` to stop the current music
- Music will loop automatically

#### Sound Effects

- Set with the `sfx` property
- Can be a single string or an array of strings
- Will play once when the node is displayed

### Event Status Tracking

Events are tracked with the following statuses:

- `completed`: Player has viewed all nodes
- `skipped`: Event was skipped due to conditions
- `pending`: Currently in progress
- `unseen`: Not yet viewed

### Save/Load System

The engine provides a comprehensive save/load system:

- Saves are stored in localStorage with the prefix `vn_save_`
- Each save contains the full game state, including:
    - Current event
    - Current node index
    - All choice variables
    - Event status tracking
    - Timestamp

### UI Customization

The UI can be customized by modifying the CSS in `src/App.css`. Key CSS variables:

```css
:root {
  --primary-color: #6a4c93;
  --secondary-color: #8a5cf5;
  --text-color: #f8f9fa;
  --bg-color: #1a1a2e;
  --dialog-bg: rgba(26, 26, 46, 0.85);
  --dialog-border: #8a5cf5;
  --choice-bg: rgba(106, 76, 147, 0.8);
  --choice-hover: rgba(138, 92, 245, 0.9);
}
```

### Advanced Features

#### Auto Mode

Auto mode automatically advances dialogue after a delay calculated based on text length and reading speed.

#### Text Speed Control

Adjust the typing speed of the text with the text speed control in the settings panel.

#### Event Viewer

The event viewer shows all events and their status:

- White: Unseen
- Orange: In Progress
- Green: Completed
- Red: Skipped

#### Event Replay

Click on completed events in the event viewer to replay them.

### Performance Optimization

For large visual novels, consider:

1. **Lazy Loading**: Load event files only when needed
2. **Asset Preloading**: Preload assets for upcoming scenes
3. **Memory Management**: Unload unused assets

### Extending the Engine

#### Adding New Node Types

1. Add the type to the `handleAdvance` function in `NovelEngine.tsx`
2. Create a new component for the node type
3. Add rendering logic in the main component

#### Adding New Effects

1. Add the effect name to the `SceneBackground.tsx` component
2. Implement the effect CSS in `App.css`

#### Adding Character Sprites

1. Create a new `CharacterSprite.tsx` component
2. Add character positioning logic
3. Update the JSON schema to include character properties

### Troubleshooting

#### Common Issues

1. **Images not loading**: Ensure they're in the correct directory and the filename matches exactly
2. **Audio not playing**: Check browser autoplay policies and ensure files exist
3. **Conditions not working**: Verify variable names and values match exactly

#### Debugging

Enable debug mode by adding `localStorage.setItem('vn_debug', 'true')` in the browser console.

### Project Structure

```
visual-novel-engine/
├── public/
│   ├── data/           # JSON event files
│   └── assets/
│       ├── backgrounds/ # Background images
│       └── audio/
│           ├── music/   # Background music
│           └── sfx/     # Sound effects
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   └── utils/          # Utility functions
```

### API Reference

#### Hooks

- `useGameState()`: Manages the global game state
- `useAudioManager()`: Handles audio playback and management

#### Components

- `NovelEngine`: Main component that orchestrates the visual novel
- `DialogueBox`: Displays text with typewriter effect
- `ChoiceSystem`: Renders and handles player choices
- `SceneBackground`: Manages background images and transitions
- `EventViewer`: Displays event completion status
- `ControlPanel`: Provides UI controls for the engine
- `SaveLoadMenu`: Handles saving and loading game state

### Advanced JSON Examples

#### Complex Branching

```json
[
  {
    "type": "choice",
    "text": "What path will you choose?",
    "speaker": "Narrator",
    "choices": [
      {
        "text": "Path A",
        "value": "A"
      },
      {
        "text": "Path B",
        "value": "B"
      },
      {
        "text": "Path C",
        "value": "C"
      }
    ]
  },
  {
    "type": "dialogue",
    "text": "This will only show if Path A was chosen",
    "speaker": "Narrator",
    "effect": {
      "pathTaken": "A",
      "karma": 10
    },
    "condition": "user_choice == 'A'"
  }
]
```

#### Variable Manipulation

```json
[
  {
    "type": "dialogue",
    "text": "Your karma increases!",
    "speaker": "System",
    "effect": {
      "karma": 10,
      "reputation": 5
    }
  },
  {
    "type": "dialogue",
    "text": "High karma response",
    "speaker": "NPC",
    "condition": "karma > 5"
  },
  {
    "type": "dialogue",
    "text": "Low karma response",
    "speaker": "NPC",
    "condition": "karma <= 5"
  }
]
```

### Best Practices

1. **Organize JSON files** by chapter or scene
2. **Use consistent naming conventions** for variables
3. **Test all branches** of your story
4. **Back up save data** regularly
5. **Document your variable system** for complex stories
6. **Optimize image sizes** for better performance
7. **Use audio sparingly** to avoid overwhelming the player

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### License

This project is licensed under the MIT License - see the LICENSE file for details.
