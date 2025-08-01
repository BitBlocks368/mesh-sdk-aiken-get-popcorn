import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import PopcornKernelComponent from "./PopcornKernel";
import GameStats from "./GameStats";

interface GameState {
  gameActive: boolean;
  popcornCount: number;
  level: number;
  score: number;
  timeRemaining: number;
}

interface PopcornKernelType {
  id: string;
  x: number;
  y: number;
  isPopped: boolean;
  poppedAt?: number;
  spawnedAt: number;
  state: "dormant" | "warming" | "jumping" | "ready" | "popped" | "falling";
  warmingAt?: number;
  jumpingAt?: number;
  readyAt?: number;
  originalX: number; // Store original bottom position
  originalY: number;
  settledX?: number; // Final position after jumping
  settledY?: number; // Final position after jumping
  // JavaScript jump animation properties - true parabolic physics
  jumpStartY?: number; // Starting Y position for jump
  jumpStartX?: number; // Starting X position for jump
  jumpTargetX?: number; // Final X position after jump
  jumpTargetY?: number; // Final Y position after jump
  initialVelocityX?: number; // Initial horizontal velocity (pixels/ms)
  initialVelocityY?: number; // Initial vertical velocity (pixels/ms)
  jumpGravity?: number; // Gravity acceleration (pixels/ms²)
  // Physics properties for popped kernels
  velocityX?: number;
  velocityY?: number;
  gravity?: number;
  settled?: boolean; // Has kernel settled on top of unpoppedkernels
  bounceCount: number; // New property to track bounces
}


const GAME_DURATION = 60; // seconds
const BASE_KERNEL_LIFETIME = 5000; // milliseconds
const DIFFICULTY_START = 10; // start reducing after 10 pops
const DIFFICULTY_REDUCTION = 100; // reduce by 0.1 seconds (100ms) per kernel after 10th

// Spawn timing constants
const BASE_SPAWN_INTERVAL = 1500; // 1.5 seconds for first 10 kernels
const SPAWN_RANDOMNESS = 500; // ±0.5 seconds
const FAST_SPAWN_INTERVAL = 1000; // 1 second after 10th kernel

// Responsive machine dimensions function
const getMachineDimensions = () => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Mobile Portrait: 320px - 480px
  if (viewportWidth <= 480) {
    const calculatedWidth = Math.floor(viewportWidth * 0.9);
    const calculatedHeight = Math.floor(viewportHeight * 0.6);
    return {
      width: Math.max(calculatedWidth, 280), // Minimum 280px width
      height: Math.max(calculatedHeight, 250), // Minimum 250px height
    };
  }
  
  // Mobile Landscape: 481px - 768px
  if (viewportWidth <= 768) {
    // Ensure minimum height for playability in landscape mode
    const calculatedHeight = Math.floor(viewportHeight * 0.65);
    const minHeight = 300; // Minimum playable height
    return {
      width: Math.floor(viewportWidth * 0.85), // 85vw for better landscape experience
      height: Math.max(calculatedHeight, minHeight), // Ensure minimum height
    };
  }
  
  // Tablet: 769px - 1024px  
  if (viewportWidth <= 1024) {
    return {
      width: Math.floor(viewportWidth * 0.7), // 70vw
      height: Math.floor(viewportHeight * 0.5), // 50vh
    };
  }
  
  // Desktop: 1025px+
  return {
    width: 600,
    height: 500,
  };
};

// Playing area dimensions (cinema popcorn machine style)
// Note: Dynamic dimensions are now handled in component state
const JUMP_DELAY = 1000; // Time from warming to jumping (1 second)

// Base physics constants (designed for 600x500 desktop machine)
const BASE_MACHINE_WIDTH = 600;
const BASE_MACHINE_HEIGHT = 500;
const BASE_PARABOLA_GRAVITY = 0.0008; // Gravity acceleration (pixels/ms²)
const MIN_LAUNCH_ANGLE = 45; // Minimum launch angle in degrees
const MAX_LAUNCH_ANGLE = 90; // Maximum launch angle in degrees
const BASE_LAUNCH_SPEED = 0.8; // Base launch speed (pixels/ms) - increased for higher jumps
const SPEED_VARIATION = 0.3; // ±speed variation - more variety

// Calculate physics scale factors based on machine dimensions
const getPhysicsScaleFactors = (dimensions: { width: number; height: number }) => {
  const widthScale = dimensions.width / BASE_MACHINE_WIDTH;
  const heightScale = dimensions.height / BASE_MACHINE_HEIGHT;
  
  // Use average scale for consistent physics feel
  const averageScale = (widthScale + heightScale) / 2;
  
  return {
    widthScale,
    heightScale,
    averageScale,
    // Physics constants scaled proportionally
    gravity: BASE_PARABOLA_GRAVITY * averageScale,
    launchSpeed: BASE_LAUNCH_SPEED * averageScale,
    speedVariation: SPEED_VARIATION * averageScale,
  };
};

// Device and performance detection
const getDeviceInfo = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const viewportWidth = window.innerWidth;
  const devicePixelRatio = window.devicePixelRatio || 1;
  
  // Detect device type (matching getMachineDimensions breakpoints)
  const isMobile = viewportWidth <= 768;
  const isTablet = viewportWidth > 768 && viewportWidth <= 1024;
  const isDesktop = viewportWidth > 1024;
  const isMobilePortrait = viewportWidth <= 480;
  const isMobileLandscape = viewportWidth > 480 && viewportWidth <= 768;
  
  // Detect potentially lower-powered devices
  const isLowPowerDevice = (
    // Touch devices are generally less powerful for graphics processing
    ('ontouchstart' in window || navigator.maxTouchPoints > 0) &&
    // High DPI mobile devices (>2x) might struggle more
    (devicePixelRatio > 2 && isMobile) ||
    // Very small screens likely indicate older/lower-power devices  
    viewportWidth < 400
  );
  
  // Detect iOS Safari for specific optimizations
  const isIOSSafari = /iphone|ipad|ipod/.test(userAgent) && /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
  
  return {
    isMobile,
    isTablet, 
    isDesktop,
    isMobilePortrait,
    isMobileLandscape,
    isLowPowerDevice,
    isIOSSafari,
    viewportWidth,
    devicePixelRatio,
  };
};

// Performance-optimized configuration based on device capabilities
const getPerformanceConfig = () => {
  const device = getDeviceInfo();
  
  if (device.isLowPowerDevice) {
    return {
      physicsUpdateInterval: 80, // 12.5 FPS for low-power devices
      enableAnimations: false, // Disable CSS animations
      enableParticleEffects: false, // Disable particle systems
      enableBackdropFilter: false, // Disable expensive backdrop filters
      maxDebugLogs: 10, // Limit console logging
    };
  }
  
  if (device.isMobile) {
    return {
      physicsUpdateInterval: 60, // 16.6 FPS for mobile (as requested)
      enableAnimations: true, // Keep essential animations
      enableParticleEffects: false, // Disable particles on mobile
      enableBackdropFilter: true, // Keep backdrop filters on capable mobile
      maxDebugLogs: 20,
    };
  }
  
  if (device.isTablet) {
    return {
      physicsUpdateInterval: 55, // ~18 FPS for tablets
      enableAnimations: true,
      enableParticleEffects: true, // Enable on tablets
      enableBackdropFilter: true,
      maxDebugLogs: 50,
    };
  }
  
  // Desktop - full performance
  return {
    physicsUpdateInterval: 50, // 20 FPS (original)
    enableAnimations: true,
    enableParticleEffects: true,
    enableBackdropFilter: true,
    maxDebugLogs: 100,
  };
};

// Get responsive kernel configuration based on screen size
const getKernelConfig = () => {
  const device = getDeviceInfo();
  
  // Mobile Portrait/Landscape: ≤768px
  if (device.isMobile) {
    return {
      size: 35, // Larger for touch (44px WCAG minimum would be too large)
      count: device.isLowPowerDevice ? 12 : 15, // Even fewer kernels for low-power devices
      maxTotal: device.isLowPowerDevice ? 20 : 25,
    };
  }
  
  // Tablet: 769px - 1024px
  if (device.isTablet) {
    return {
      size: 30, // Medium size for tablet
      count: 20, // Medium kernel count
      maxTotal: 30,
    };
  }
  
  // Desktop: 1025px+
  return {
    size: 25, // Original size for desktop
    count: 25, // Original count
    maxTotal: 40,
  };
};

const POPPED_KERNEL_LIFETIME = 1200; // Remove popped kernels after 1.2 seconds (matches animation)

const PopcornGame: React.FC = () => {
  // DevTools debugging - makes component easier to find
  PopcornGame.displayName = 'PopcornGame';

  // Dynamic machine dimensions state
  const [machineDimensions, setMachineDimensions] = useState(getMachineDimensions());
  
  // Dynamic kernel configuration based on screen size
  const kernelConfig = useMemo(() => getKernelConfig(), [machineDimensions]);
  
  // Performance configuration based on device capabilities
  const performanceConfig = useMemo(() => {
    const config = getPerformanceConfig();
    console.log(`Performance Config - Device: ${getDeviceInfo().isMobile ? 'Mobile' : getDeviceInfo().isTablet ? 'Tablet' : 'Desktop'}, Low Power: ${getDeviceInfo().isLowPowerDevice}, Physics FPS: ${(1000/config.physicsUpdateInterval).toFixed(1)}`);
    return config;
  }, [machineDimensions]);

  const [gameState, setGameState] = useState<GameState>({
    gameActive: false,
    popcornCount: 0,
    level: 1,
    score: 0,
    timeRemaining: GAME_DURATION,
  });

  const [kernels, setKernels] = useState<PopcornKernelType[]>([]);
  
  const [gameStats, setGameStats] = useState({
    totalPopped: 0,
    accuracy: 0,
    streak: 0,
    maxStreak: 0,
  });

  const spawnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nextKernelIndexRef = useRef<number>(0);

  // Performance-limited debug logging counter
  const debugLogCountRef = useRef(0);

  // Calculate physics constants based on current dimensions
  const physicsScale = useMemo(() => {
    const scale = getPhysicsScaleFactors(machineDimensions);
    // Only log if within performance limits
    if (debugLogCountRef.current < performanceConfig.maxDebugLogs) {
      console.log(`Physics Scale - Dimensions: ${machineDimensions.width}x${machineDimensions.height}, Scale: ${scale.averageScale.toFixed(3)}, Gravity: ${scale.gravity.toFixed(6)}, Launch Speed: ${scale.launchSpeed.toFixed(3)}`);
      debugLogCountRef.current++;
    }
    return scale;
  }, [machineDimensions, performanceConfig.maxDebugLogs]);

  // Handle window resize to update machine dimensions
  useEffect(() => {
    const handleResize = () => {
      const newDimensions = getMachineDimensions();
      setMachineDimensions(newDimensions);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Create the initial kernel bed with simple random positioning (no collision detection)
  const initializeKernelBed = useCallback((): PopcornKernelType[] => {
    const kernelBed: PopcornKernelType[] = [];

    // Generate random positions without collision detection (much faster)
    for (let i = 0; i < kernelConfig.count; i++) {
      const x = Math.random() * (machineDimensions.width - kernelConfig.size - 20) + 10;
      const y =
        machineDimensions.height -
        Math.floor(machineDimensions.height * 0.16) +
        Math.random() * (Math.floor(machineDimensions.height * 0.16) - kernelConfig.size - 15) +
        10;

      kernelBed.push({
        id: `kernel-${i}`,
        x,
        y,
        originalX: x,
        originalY: y,
        isPopped: false,
        spawnedAt: Date.now(),
        state: "dormant",
        warmingAt: undefined,
        readyAt: undefined,
        settled: false,
        bounceCount: 0, // Initialize bounce count
      });
    }

    return kernelBed;
  }, [machineDimensions, physicsScale, kernelConfig]);

  // Activate the next kernel in sequence
  const activateNextKernel = useCallback(() => {
    const now = Date.now();

    setKernels((prev) => {
      const dormantKernels = prev.filter((k) => k.state === "dormant");
      if (dormantKernels.length === 0) return prev;

      // Find next kernel to activate (cyclical)
      const kernelIndex = nextKernelIndexRef.current % dormantKernels.length;
      const kernelToActivate = dormantKernels[kernelIndex];
      nextKernelIndexRef.current++;

      return prev.map((kernel) =>
        kernel.id === kernelToActivate.id
          ? {
              ...kernel,
              state: "warming" as const,
              warmingAt: now,
              readyAt: now + JUMP_DELAY,
            }
          : kernel
      );
    });
  }, []);

  // Calculate current kernel lifetime based on difficulty
  const getCurrentKernelLifetime = useCallback(() => {
    const lifetime =
      gameStats.totalPopped < DIFFICULTY_START
        ? BASE_KERNEL_LIFETIME
        : Math.max(
            BASE_KERNEL_LIFETIME -
              (gameStats.totalPopped - DIFFICULTY_START) * DIFFICULTY_REDUCTION,
            1000
          );

    return lifetime;
  }, [gameStats.totalPopped]);

  // Calculate next spawn interval with randomization
  const getNextSpawnInterval = useCallback(() => {
    const baseInterval =
      gameStats.totalPopped < DIFFICULTY_START
        ? BASE_SPAWN_INTERVAL
        : FAST_SPAWN_INTERVAL;

    // Add random variation: ±0.5 seconds
    const randomOffset = (Math.random() - 0.5) * 2 * SPAWN_RANDOMNESS;
    return Math.max(baseInterval + randomOffset, 500); // minimum 0.5 seconds
  }, [gameStats.totalPopped]);

  const startGame = () => {
    setGameState((prev) => ({
      ...prev,
      gameActive: true,
      popcornCount: 0,
      score: 0,
      timeRemaining: GAME_DURATION,
    }));

    // Initialize the kernel bed
    const kernelBed = initializeKernelBed();
    setKernels(kernelBed);
    nextKernelIndexRef.current = 0;

    setGameStats({
      totalPopped: 0,
      accuracy: 0,
      streak: 0,
      maxStreak: 0,
    });
  };

  const endGame = () => {
    setGameState((prev) => ({ ...prev, gameActive: false }));

    // Clear all kernels to free memory
    setKernels([]);

    // Clear all timeouts/intervals
    if (spawnTimeoutRef.current) {
      clearTimeout(spawnTimeoutRef.current);
      spawnTimeoutRef.current = null;
    }

    // Reset refs
    nextKernelIndexRef.current = 0;
  };

  const popKernel = (kernelId: string) => {
    setKernels((prev) =>
      prev.map((kernel) =>
        kernel.id === kernelId && kernel.state === "ready"
          ? {
              ...kernel,
              isPopped: true,
              poppedAt: Date.now(),
              state: "popped" as const,
              // No physics - kernel just stays in place and fades out
            }
          : kernel
      )
    );

    const points = 10 + gameStats.streak * 2;
    setGameState((prev) => ({
      ...prev,
      score: prev.score + points,
      popcornCount: prev.popcornCount + 1,
    }));

    setGameStats((prev) => ({
      ...prev,
      totalPopped: prev.totalPopped + 1,
      streak: prev.streak + 1,
      maxStreak: Math.max(prev.maxStreak, prev.streak + 1),
    }));

    // Update level based on total popped
    setGameState((prev) => ({
      ...prev,
      level: gameStats.totalPopped < DIFFICULTY_START ? 1 : 2,
    }));
  };

  // Game timer
  useEffect(() => {
    if (!gameState.gameActive) return;

    const timer = setInterval(() => {
      setGameState((prev) => {
        if (prev.timeRemaining <= 1) {
          endGame();
          return prev;
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.gameActive]);

  // Kernel activation with dynamic intervals
  useEffect(() => {
    if (!gameState.gameActive) return;

    const activateKernel = () => {
      activateNextKernel();

      // Schedule next activation with new interval
      const nextInterval = getNextSpawnInterval();
      spawnTimeoutRef.current = setTimeout(activateKernel, nextInterval);
    };

    // Start first activation after initial delay
    const initialInterval = getNextSpawnInterval();
    spawnTimeoutRef.current = setTimeout(activateKernel, initialInterval);

    return () => {
      if (spawnTimeoutRef.current) {
        clearTimeout(spawnTimeoutRef.current);
        spawnTimeoutRef.current = null;
      }
    };
  }, [gameState.gameActive, activateNextKernel, getNextSpawnInterval]);

  // Add execution tracking to prevent duplicate calls
  const lastExecutionRef = useRef<number>(0);
  const isExecutingRef = useRef<boolean>(false);

  // Simplified physics update function
  const updatePhysics = useCallback(() => {
    const currentTime = Date.now();

    // Prevent duplicate executions within the same 50ms window
    if (currentTime - lastExecutionRef.current < 45) {
      return;
    }

    // Prevent concurrent executions
    if (isExecutingRef.current) {
      return;
    }

    lastExecutionRef.current = currentTime;
    isExecutingRef.current = true;

    const currentLifetime = getCurrentKernelLifetime();

    setKernels((prev) => {
      // NUCLEAR DEDUPLICATION - Always remove duplicates first
      const uniqueKernels = prev.filter((kernel, index) => 
        prev.findIndex(k => k.id === kernel.id) === index
      );
      
      // If we removed duplicates, log it and return clean array
      if (uniqueKernels.length !== prev.length) {
        console.warn(`NUCLEAR DEDUP: ${prev.length} → ${uniqueKernels.length} kernels`);
        return uniqueKernels;
      }

      // Work with the clean unique kernels
      const workingKernels = uniqueKernels;


      // Limit total kernels to prevent memory issues
      if (workingKernels.length > kernelConfig.maxTotal) {
        console.warn("Too many kernels, cleaning up...");
        return workingKernels
          .filter((k) => ["dormant", "warming", "ready"].includes(k.state))
          .slice(0, kernelConfig.count);
      }

      const updatedKernels = workingKernels.map((kernel) => {
        // State transitions

        // Start jumping animation with true parabolic physics
        if (
          kernel.state === "warming" &&
          kernel.readyAt &&
          currentTime >= kernel.readyAt &&
          !kernel.jumpingAt // Prevent duplicate transitions
        ) {
          console.log(`KERNEL ${kernel.id}: warming → jumping [UPDATE: ${currentTime}]`);

          // Calculate target settlement position
          const collectionAreaTop = machineDimensions.height - Math.floor(machineDimensions.height * 0.16);
          const randomYOffset = (Math.random() - 0.5) * 20 * physicsScale.averageScale; // Scaled Y variation
          const targetY = collectionAreaTop + randomYOffset; // Final Y position scaled to machine size

          // Calculate parabolic physics with scaled constants
          const launchAngle =
            MIN_LAUNCH_ANGLE +
            Math.random() * (MAX_LAUNCH_ANGLE - MIN_LAUNCH_ANGLE); // 45-90 degrees
          const launchSpeed =
            physicsScale.launchSpeed + (Math.random() - 0.5) * physicsScale.speedVariation; // Vary speed
          const angleRad = (launchAngle * Math.PI) / 180; // Convert to radians
          const randomDirection = Math.random() < 0.5 ? -1 : 1; // Random left/right

          // Calculate initial velocities
          const initialVx = Math.cos(angleRad) * launchSpeed * randomDirection;
          const initialVy = -Math.sin(angleRad) * launchSpeed; // Negative because Y increases downward

          // Calculate flight time and landing position using scaled physics
          const a = physicsScale.gravity / 2;
          const b = initialVy;
          const c = kernel.y - targetY;

          // Solve quadratic equation: at² + bt + c = 0
          const discriminant = b * b - 4 * a * c;
          if (discriminant < 0) {
            console.error(`KERNEL ${kernel.id}: Invalid discriminant - physics calculation failed`);
            // Fallback to simple jump
            const flightTime = 1000; // 1 second fallback
            const targetX = Math.max(
              25,
              Math.min(machineDimensions.width - kernelConfig.size - 25, kernel.x + 50)
            ); // Small hop

            return {
              ...kernel,
              state: "jumping" as const,
              jumpingAt: currentTime,
              readyAt: currentTime + flightTime,
              jumpStartY: kernel.y,
              jumpStartX: kernel.x,
              jumpTargetX: targetX,
              jumpTargetY: targetY,
              initialVelocityX: (targetX - kernel.x) / flightTime,
              initialVelocityY: -0.5 * physicsScale.averageScale, // Scaled upward velocity
              jumpGravity: physicsScale.gravity,
              settledX: targetX,
              settledY: targetY,
              bounceCount: 0,
            };
          }

          const flightTime = (-b + Math.sqrt(discriminant)) / (2 * a); // Take positive root

          // Validate flight time
          if (flightTime <= 0 || flightTime > 5000 || !isFinite(flightTime)) {
            console.error(`KERNEL ${kernel.id}: Invalid flight time - using fallback`);
            const safeFlight = 1000;
            const safeTargetX = Math.max(
              25,
              Math.min(machineDimensions.width - kernelConfig.size - 25, kernel.x)
            );

            return {
              ...kernel,
              state: "jumping" as const,
              jumpingAt: currentTime,
              readyAt: currentTime + safeFlight,
              jumpStartY: kernel.y,
              jumpStartX: kernel.x,
              jumpTargetX: safeTargetX,
              jumpTargetY: targetY,
              initialVelocityX: 0, // No horizontal movement
              initialVelocityY: -0.5 * physicsScale.averageScale,
              jumpGravity: physicsScale.gravity,
              settledX: safeTargetX,
              settledY: targetY,
              bounceCount: 0,
            };
          }

          // Calculate landing X position
          const landingX = kernel.x + initialVx * flightTime;
          const targetX = Math.max(
            25,
            Math.min(machineDimensions.width - kernelConfig.size - 25, landingX)
          );

          const newKernel = {
            ...kernel,
            state: "jumping" as const,
            jumpingAt: currentTime,
            readyAt: currentTime + flightTime,
            jumpStartY: kernel.y,
            jumpStartX: kernel.x,
            jumpTargetX: targetX,
            jumpTargetY: targetY,
            initialVelocityX: initialVx,
            initialVelocityY: initialVy,
            jumpGravity: physicsScale.gravity,
            settledX: targetX,
            settledY: targetY,
            bounceCount: 0, // Reset bounce count for new jump
          };

          return newKernel;
        }

        if (
          kernel.state === "jumping" &&
          kernel.jumpingAt &&
          kernel.initialVelocityX !== undefined &&
          kernel.initialVelocityY !== undefined &&
          currentTime > kernel.jumpingAt // Only process if time has actually elapsed
        ) {
          const elapsed = currentTime - kernel.jumpingAt;
          const leftBound = 5;
          const rightBound = machineDimensions.width - kernelConfig.size - 5;
          const topBound = 0;
          const collectionAreaTop = machineDimensions.height - Math.floor(machineDimensions.height * 0.16);

          // Calculate new position using simple parabolic motion
          let newX = kernel.jumpStartX! + kernel.initialVelocityX * elapsed;
          let newY =
            kernel.jumpStartY! +
            kernel.initialVelocityY * elapsed +
            0.5 * kernel.jumpGravity! * elapsed * elapsed;
          const currentVelocityY =
            kernel.initialVelocityY! + kernel.jumpGravity! * elapsed;
          const maxFlightTime = 3000;

          // Sharp-angle bouncing with trajectory preservation
          const previousX = kernel.x || kernel.jumpStartX!;
          
          // Check if kernel crossed left wall
          if (previousX >= leftBound && newX < leftBound) {
            // Calculate collision point and mirror from there
            const distancePastWall = leftBound - newX;
            newX = leftBound + distancePastWall; // Sharp bounce off left wall
            console.log(`KERNEL ${kernel.id}: SHARP bounce off LEFT wall`);
          }
          // Check if kernel crossed right wall
          else if (previousX <= rightBound && newX > rightBound) {
            // Calculate collision point and mirror from there
            const distancePastWall = newX - rightBound;
            newX = rightBound - distancePastWall; // Sharp bounce off right wall
            console.log(`KERNEL ${kernel.id}: SHARP bounce off RIGHT wall`);
          }

          // Check for landing conditions
          const shouldLand = newY >= collectionAreaTop && currentVelocityY > 0;
          const timeoutReached = elapsed > maxFlightTime;

          if (shouldLand || timeoutReached) {
            // Clamp final position to boundaries
            const finalX = Math.max(leftBound, Math.min(rightBound, newX));
            const finalY = kernel.jumpTargetY!;

            return {
              ...kernel,
              x: finalX,
              y: finalY,
              state: "ready" as const,
              readyAt: currentTime,
            };
          }

          // Keep kernel in bounds with Y clamping
          const boundedY = Math.max(topBound, newY);

          return {
            ...kernel,
            x: newX,
            y: boundedY,
          };
        }

        // Complete jumping animation and become ready
        if (
          kernel.state === "jumping" &&
          kernel.readyAt &&
          currentTime >= kernel.readyAt &&
          kernel.jumpingAt // Ensure we have valid jump data
        ) {
          console.log(`KERNEL ${kernel.id}: jumping → ready`);

          return {
            ...kernel,
            state: "ready" as const,
            x: kernel.settledX!, // Ensure final X position is exact
            y: kernel.settledY!, // Ensure final Y position is exact
          };
        }

        // Popped kernels just stay in place and fade out (no physics movement)
        if (kernel.state === "popped") {
          // No movement, just maintain position for fade-out animation
          return kernel;
        }

        return kernel;
      });

      // Clean up expired and old kernels
      const cleanedKernels = updatedKernels.filter((kernel) => {
        // Remove popped kernels after lifetime
        if (
          kernel.isPopped &&
          kernel.poppedAt &&
          currentTime - kernel.poppedAt > POPPED_KERNEL_LIFETIME
        ) {
          return false;
        }

        // Remove expired ready kernels
        if (
          kernel.state === "ready" &&
          kernel.readyAt &&
          currentTime - kernel.readyAt >= currentLifetime
        ) {
          return false;
        }

        return true;
      });

      // Add replacement kernels if we're below the minimum count
      const replacementsNeeded = Math.max(
        0,
        kernelConfig.count - cleanedKernels.length
      );

      const replacements = [];
      for (let i = 0; i < replacementsNeeded; i++) {
        const x = Math.random() * (machineDimensions.width - kernelConfig.size - 20) + 10;
        const bottomAreaHeight = Math.floor(machineDimensions.height * 0.16);
        const y =
          machineDimensions.height -
          bottomAreaHeight +
          Math.random() * (bottomAreaHeight - kernelConfig.size - 15) +
          10;

        replacements.push({
          id: `replacement-${currentTime}-${i}`,
          x,
          y,
          originalX: x,
          originalY: y,
          isPopped: false,
          spawnedAt: currentTime,
          state: "dormant" as const,
          warmingAt: undefined,
          readyAt: undefined,
          settled: false,
          bounceCount: 0, // Initialize bounce count
        });
      }

      const finalKernels = [...cleanedKernels, ...replacements];

      // Final array analysis after processing
      const finalIds = finalKernels.map((k) => k.id);
      const finalUniqueIds = [...new Set(finalIds)];
      if (finalIds.length !== finalUniqueIds.length) {
        const afterSnapshot = finalKernels.map(k => `${k.id}:${k.state}${k.jumpingAt ? `@${k.jumpingAt}` : ''}`).join(' | ');
        console.warn(`FINAL DUPLICATES: ${finalIds.length} total, ${finalUniqueIds.length} unique`);
        console.warn(`STATE AFTER: ${afterSnapshot}`);
      }

      return finalKernels;
    });

    // Reset execution flag after completion
    isExecutingRef.current = false;
  }, [getCurrentKernelLifetime, machineDimensions, physicsScale, kernelConfig]);

  // Performance-optimized physics and state management
  useEffect(() => {
    if (!gameState.gameActive) {
      return;
    }

    const updateInterval = setInterval(() => {
      updatePhysics();
    }, performanceConfig.physicsUpdateInterval); // Dynamic FPS based on device capability

    return () => {
      clearInterval(updateInterval);
    };
  }, [gameState.gameActive, updatePhysics, performanceConfig.physicsUpdateInterval]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (spawnTimeoutRef.current) {
        clearTimeout(spawnTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="popcorn-game">
      <div className="game-header">
        <h1>🍿 Get Popcorn!</h1>
        <div className="game-controls">
          {!gameState.gameActive ? (
            <button onClick={startGame} className="start-button">
              Start Game
            </button>
          ) : (
            <button onClick={endGame} className="end-button">
              End Game
            </button>
          )}
        </div>
      </div>

      <GameStats
        gameState={gameState}
        stats={gameStats}
        currentLifetime={getCurrentKernelLifetime()}
      />

      <div className="game-area">
        <div
          className="popcorn-machine"
          style={{
            width: machineDimensions.width,
            height: machineDimensions.height,
            margin: "0 auto",
            position: "relative",
          }}
        >
          {/* Machine container visual */}
          <div className="machine-container"></div>

          {/* Bottom collection area indicator */}
          <div
            className="collection-area"
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: Math.floor(machineDimensions.height * 0.16),
              backgroundColor: "rgba(139, 69, 19, 0.3)",
              border: "2px solid #8B4513",
              borderRadius: "0 0 15px 15px",
            }}
          ></div>

          {/* Kernels */}
          {kernels.map((kernel) => (
            <PopcornKernelComponent
              key={kernel.id}
              kernel={kernel}
              size={kernelConfig.size}
              performanceConfig={performanceConfig}
              onPop={() => popKernel(kernel.id)}
            />
          ))}
        </div>
      </div>

      {!gameState.gameActive && gameState.score > 0 && (
        <div className="game-over" role="dialog" aria-labelledby="game-over-title" aria-modal="true">
          <h2 id="game-over-title">Game Over!</h2>
          <div className="game-over-stats">
            <p><strong>Final Score:</strong> {gameState.score}</p>
            <p><strong>Popcorn Popped:</strong> {gameState.popcornCount}</p>
            <p><strong>Max Streak:</strong> {gameStats.maxStreak}</p>
          </div>
          <button 
            className="restart-button" 
            onClick={startGame}
            autoFocus
            aria-label="Start a new game"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default PopcornGame;
