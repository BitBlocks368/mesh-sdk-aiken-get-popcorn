# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```


# DEVELOPMENT PLANS

This is an impressive implementation of a popcorn-themed game built with React! The code is well-structured, with clear interfaces, thoughtful use of TypeScript for type safety, and a good separation of concerns. Below, I'll provide an overview of what the code does, highlight its strengths, identify potential areas for improvement, and suggest some enhancements to make the game even better.

---

### Overview of the Code
The `PopcornGame` is a React component that implements a timed game where players click on popcorn kernels to "pop" them before they expire. The game features:

- **Game Mechanics**:
  - Kernels spawn in a "dormant" state at the bottom of a popcorn machine (a 600x500px area).
  - Kernels transition through states: `dormant` → `warming` → `jumping` → `ready` → `popped` (or expire if not popped in time).
  - Kernels follow a parabolic trajectory when jumping, using physics-based calculations for realistic motion.
  - Players score points by clicking "ready" kernels, with bonuses for streaks.
  - The game lasts 60 seconds, with increasing difficulty (faster spawn rates and shorter kernel lifetimes after 10 pops).
  - A stats panel tracks score, level, time remaining, total popped, streak, and max streak.

- **Key Features**:
  - **Physics-Based Animation**: Uses parabolic motion with gravity, velocity, and angle calculations for kernel jumps.
  - **Dynamic Difficulty**: Kernel lifetime decreases after 10 pops, and spawn intervals adjust dynamically.
  - **Performance Optimizations**: Limits total kernels (40 max), uses a 20 FPS update interval, and avoids complex collision detection.
  - **Visual Feedback**: Includes a styled popcorn machine and collection area, with kernels fading out after popping.

- **Components**:
  - `PopcornKernelComponent`: Renders individual kernels (not shown in the code but referenced).
  - `GameStats`: Displays game statistics (score, time, etc.).
  - The main `PopcornGame` component manages state, physics, and rendering.

---

### Strengths
1. **Type Safety with TypeScript**:
   - The use of `interface GameState`, `interface PopcornKernelType`, and `interface PopcornAction` ensures robust type checking, making the code easier to maintain and debug.
   - The `PopcornKernelType` interface is comprehensive, covering all necessary properties for kernel states and physics.

2. **Physics-Based Animation**:
   - The parabolic motion for jumping kernels is a highlight, using kinematic equations to calculate realistic trajectories (`x = x0 + vx * t`, `y = y0 + vy * t + 0.5 * g * t²`).
   - Boundary checking and precise landing calculations enhance the realism of kernel movement.

3. **Performance Considerations**:
   - Limiting the update interval to 20 FPS (50ms) reduces CPU usage compared to 60 FPS.
   - Capping total kernels at 40 and filtering out expired kernels prevents memory leaks.
   - Avoiding complex collision detection for the kernel bed simplifies calculations and improves performance.

4. **Dynamic Difficulty**:
   - The game scales difficulty by reducing kernel lifetime (`BASE_KERNEL_LIFETIME - reduction`) and spawn intervals (`BASE_SPAWN_INTERVAL` to `FAST_SPAWN_INTERVAL`) after 10 pops.
   - Randomization in spawn timing (`SPAWN_RANDOMNESS`) and jump angles/speeds adds variety.

5. **Clean State Management**:
   - Uses `useState`, `useEffect`, `useCallback`, and `useRef` effectively to manage game state, timers, and kernel activation.
   - The `useEffect` hooks are well-organized, handling game timer, kernel activation, physics updates, and cleanup separately.

6. **User Experience**:
   - The game includes clear start/end controls, a stats display, and a game-over screen with final stats.
   - The visual design (popcorn machine, collection area) adds thematic flair.

---

### Potential Issues and Areas for Improvement
While the code is solid, there are a few areas where it could be improved or where potential issues might arise:

1. **Kernel Overlap in the Bed**:
   - The `initializeKernelBed` function places kernels randomly without collision detection, which could lead to visual overlap in the bottom area. This might make the game look less polished, especially if multiple kernels stack visually.
   - **Suggestion**: Implement simple collision detection (e.g., a grid-based placement system) or stack kernels in a more organized way (e.g., rows or a pile-like structure).

2. **Physics Simplification for Popped Kernels**:
   - Popped kernels stay in place and fade out without physics-based movement, which contrasts with the realistic jumping animation. This might feel inconsistent to players expecting popped kernels to "explode" or move.
   - **Suggestion**: Add simple physics for popped kernels (e.g., a short upward bounce with gravity) to match the jumping kernels' realism.

3. **Performance with High Kernel Counts**:
   - While the code caps total kernels at 40, the `setKernels` updates in the physics `useEffect` (every 50ms) can still be taxing if many kernels are in the `jumping` state, as each requires physics calculations.
   - **Suggestion**: Consider batching state updates or using a more efficient animation library (e.g., `react-spring` or `framer-motion`) for kernel movement to offload calculations to CSS/GPU.

4. **Hard-Coded Constants**:
   - Constants like `MACHINE_WIDTH`, `MACHINE_HEIGHT`, `KERNEL_SIZE`, etc., are hard-coded. If the game needs to be responsive or adapt to different screen sizes, these values would need adjustment.
   - **Suggestion**: Use dynamic dimensions based on the container size (e.g., via `useRef` and `getBoundingClientRect`) or CSS relative units (`vw`/`vh`).

5. **No Mobile/Touch Support**:
   - The code assumes mouse-based clicking (`onPop` in `PopcornKernelComponent`), which may not work well on touch devices.
   - **Suggestion**: Add touch event handling (e.g., `onTouchStart`) in `PopcornKernelComponent` to support mobile devices.

6. **Game Balance**:
   - The difficulty scaling (reducing kernel lifetime by 100ms per kernel after 10 pops) might become too challenging too quickly, especially with a minimum lifetime of 1 second.
   - **Suggestion**: Test the difficulty curve with playtesting and consider a smoother progression (e.g., logarithmic reduction) or user-configurable difficulty levels.

7. **Missing Error Handling**:
   - The quadratic equation solver in the jumping physics assumes a positive discriminant (`b * b - 4 * a * c`). If the discriminant is negative (e.g., due to invalid inputs), the `Math.sqrt` call will return `NaN`, causing errors.
   - **Suggestion**: Add a fallback for invalid discriminant cases (e.g., clamp values or use a default flight time).

8. **Game Over Feedback**:
   - The game-over screen shows the final score, popcorn count, and max streak but lacks a "Play Again" button or high-score tracking, which could enhance replayability.
   - **Suggestion**: Add a "Play Again" button and consider persisting high scores (e.g., in `localStorage`).

9. **Accessibility**:
   - The game lacks accessibility features (e.g., ARIA labels, keyboard support for starting/ending the game).
   - **Suggestion**: Add keyboard event listeners (e.g., `Enter` to start/end) and ARIA attributes for screen readers.

---

### Suggested Enhancements
To make the game more engaging and polished, consider the following additions:

1. **Visual and Audio Effects**:
   - Add sound effects for popping kernels, game start/end, and streaks (e.g., using the Web Audio API or a library like `howler.js`).
   - Enhance kernel visuals with CSS animations (e.g., a "pop" scale effect) or sprite-based popcorn images.
   - Add particle effects for popped kernels using a library like `react-particles`.

2. **Power-Ups and Bonuses**:
   - Introduce power-ups (e.g., slow-motion mode, extra time, or double points) that appear randomly as special kernels.
   - Add combo multipliers for rapid pops within a short time window.

3. **Responsive Design**:
   - Make the game responsive by scaling `MACHINE_WIDTH` and `MACHINE_HEIGHT` based on the viewport size.
   - Use CSS media queries or a dynamic canvas size to adjust kernel sizes and positions.

4. **High Score System**:
   - Store high scores in `localStorage` or a backend (if integrated) and display a leaderboard.
   - Show the player's rank or progress toward beating their personal best.

5. **Pause Functionality**:
   - Add a pause button to temporarily halt the game timer and kernel updates.
   - Implement pause logic by toggling a `paused` state and skipping updates in `useEffect` hooks when paused.

6. **Tutorial or Instructions**:
   - Display a brief tutorial or tooltip on first load to explain how to play (e.g., "Click ready kernels to pop them!").
   - Use a modal or overlay to avoid cluttering the UI.

7. **Performance Optimization**:
   - Use `requestAnimationFrame` instead of `setInterval` for smoother physics updates.
   - Offload kernel animations to CSS transitions or a library like `framer-motion` to reduce JavaScript overhead.

8. **Testing and Debugging**:
   - Add debug overlays (e.g., show kernel IDs, states, or bounding boxes) toggled via a query parameter or dev mode.
   - Write unit tests for critical functions (e.g., `getCurrentKernelLifetime`, `initializeKernelBed`) using a testing framework like Jest.

---

### Specific Code Suggestions
Here are a few code snippets to address some of the issues and enhancements:

1. **Fix for Discriminant in Parabolic Physics**:
   Modify the jumping physics calculation to handle invalid discriminants:

   ```typescript
   const discriminant = b * b - 4 * a * c;
   let flightTime;
   if (discriminant < 0) {
     console.warn(`Invalid discriminant for kernel ${kernel.id}, using default flight time`);
     flightTime = 1000; // Fallback to 1 second
   } else {
     flightTime = (-b + Math.sqrt(discriminant)) / (2 * a);
   }
   ```

2. **Touch Support for Popping Kernels**:
   Update the `PopcornKernelComponent` (assumed) to handle touch events:

   ```typescript
   // In PopcornKernelComponent.tsx
   const PopcornKernelComponent: React.FC<{ kernel: PopcornKernelType; onPop: () => void }> = ({ kernel, onPop }) => {
     const handleInteraction = () => {
       if (kernel.state === 'ready') onPop();
     };

     return (
       <div
         className={`kernel ${kernel.state}`}
         style={{ left: kernel.x, top: kernel.y }}
         onClick={handleInteraction}
         onTouchStart={handleInteraction}
         role="button"
         aria-label={`Popcorn kernel, ${kernel.state === 'ready' ? 'click to pop' : 'not ready'}`}
       />
     );
   };
   ```

3. **Play Again Button**:
   Add a "Play Again" button to the game-over screen:

   ```typescript
   {!gameState.gameActive && gameState.score > 0 && (
     <div className="game-over">
       <h2>Game Over!</h2>
       <p>Final Score: {gameState.score}</p>
       <p>Popcorn Popped: {gameState.popcornCount}</p>
       <p>Max Streak: {gameStats.maxStreak}</p>
       <button onClick={startGame} className="play-again-button">
         Play Again
       </button>
     </div>
   )}
   ```

4. **Responsive Dimensions**:
   Make the game area responsive using a `useRef` to get the container size:

   ```typescript
   const gameAreaRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
     if (gameAreaRef.current) {
       const { width, height } = gameAreaRef.current.getBoundingClientRect();
       // Update constants dynamically
       const scale = Math.min(width / 600, height / 500);
       const dynamicMachineWidth = 600 * scale;
       const dynamicMachineHeight = 500 * scale;
       // Use dynamicMachineWidth and dynamicMachineHeight in rendering
     }
   }, []);

   // In the render:
   <div className="game-area" ref={gameAreaRef}>
     <div
       className="popcorn-machine"
       style={{
         width: dynamicMachineWidth || MACHINE_WIDTH,
         height: dynamicMachineHeight || MACHINE_HEIGHT,
         margin: '0 auto',
         position: 'relative'
       }}
     >
       {/* ... */}
     </div>
   </div>
   ```

---

### Final Thoughts
The `PopcornGame` is a fun and engaging project with a solid foundation. The physics-based kernel movement and dynamic difficulty make it stand out, and the code is well-organized for a single-developer project. By addressing the potential issues (e.g., kernel overlap, mobile support) and adding enhancements (e.g., sound effects, responsive design), you can elevate the game to a more polished and professional level.

If you have specific areas where you need help (e.g., implementing one of the suggestions, debugging a specific issue, or optimizing performance), let me know, and I can dive deeper or provide more targeted code! Would you like me to focus on any particular aspect, such as adding sound effects, improving the kernel bed layout, or testing the physics calculations?