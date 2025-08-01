import React from 'react';

interface PopcornKernelType {
  id: string;
  x: number;
  y: number;
  isPopped: boolean;
  poppedAt?: number;
  spawnedAt: number;
  state: 'dormant' | 'warming' | 'jumping' | 'ready' | 'popped' | 'falling';
  warmingAt?: number;
  jumpingAt?: number;
  readyAt?: number;
  originalX: number;
  originalY: number;
  settledX?: number;
  settledY?: number;
  velocityX?: number;
  velocityY?: number;
  gravity?: number;
  settled?: boolean;
}

interface PerformanceConfig {
  physicsUpdateInterval: number;
  enableAnimations: boolean;
  enableParticleEffects: boolean;
  enableBackdropFilter: boolean;
  maxDebugLogs: number;
}

interface PopcornKernelProps {
  kernel: PopcornKernelType;
  onPop: () => void;
  size: number; // Dynamic kernel size for responsive design
  performanceConfig: PerformanceConfig;
}

const PopcornKernelComponent: React.FC<PopcornKernelProps> = ({ kernel, onPop, size, performanceConfig }) => {
  // Performance-limited debug logging
  const debugLogCountRef = React.useRef(0);
  
  React.useEffect(() => {
    if ((kernel.state === 'jumping' || kernel.state === 'ready') && 
        debugLogCountRef.current < performanceConfig.maxDebugLogs) {
      console.log(`🎬 KERNEL ${kernel.id}: Rendering in ${kernel.state} state at position (${kernel.x}, ${kernel.y})`);
      debugLogCountRef.current++;
    }
  }, [kernel.x, kernel.y, kernel.state, kernel.id, performanceConfig.maxDebugLogs]);

  // Enhanced touch/click handling
  const handlePointerDown = (e: React.PointerEvent) => {
    // Prevent default to avoid conflicts with touch behaviors
    e.preventDefault();
    
    // Only allow interaction when kernel is fully ready (not during jumping)
    if (kernel.state === 'ready') {
      console.log(`👆 KERNEL ${kernel.id}: ${e.pointerType} interaction at position (${kernel.x}, ${kernel.y})`);
      onPop();
    }
  };

  // Fallback click handler for older browsers
  const handleClick = () => {
    // Only fire if not already handled by pointer events
    if (kernel.state === 'ready') {
      console.log(`🖱️ KERNEL ${kernel.id}: Click fallback at position (${kernel.x}, ${kernel.y})`);
      onPop();
    }
  };

  const getKernelDisplay = () => {
    switch (kernel.state) {
      case 'dormant':
        return '🌽'; // Grey corn kernel
      case 'warming':
        return '🌽'; // Full color corn kernel but not clickable yet
      case 'jumping':
        return '🌽'; // Full color corn kernel during jump animation
      case 'ready':
        return '🌽'; // Full color corn kernel, clickable
      case 'popped':
      case 'falling':
        return '🍿'; // Popcorn
      default:
        return '🌽';
    }
  };

  const getKernelStyles = () => {
    // Use dynamic font size based on kernel size (roughly 80% of kernel size)
    const fontSize = Math.max(16, Math.floor(size * 0.8));
    
    const baseStyles = {
      left: kernel.x,
      top: kernel.y,
      position: 'absolute' as const,
      fontSize: `${fontSize}px`,
      userSelect: 'none' as const,
      // Conditionally disable transitions for low-performance devices
      transition: performanceConfig.enableAnimations ? 'all 0.3s ease' : 'none',
      width: `${size}px`,
      height: `${size}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      // Touch optimization
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent',
      // Reduce GPU acceleration on low-power devices
      willChange: performanceConfig.enableAnimations ? 'transform, opacity' : 'auto',
    };
    
    // Debug logging for style calculations
    if (kernel.state === 'jumping' || kernel.state === 'ready') {
      console.log(`🎨 KERNEL ${kernel.id}: Style calculated for ${kernel.state} state - left: ${kernel.x}, top: ${kernel.y}`);
    }

    switch (kernel.state) {
      case 'dormant':
        return {
          ...baseStyles,
          cursor: 'default',
          filter: 'grayscale(100%) brightness(0.4)',
          transform: 'scale(0.6)',
          opacity: 0.5
        };
      case 'warming':
        return {
          ...baseStyles,
          cursor: 'default',
          filter: 'none',
          transform: 'scale(0.7)',
          opacity: 0.9,
          // Conditionally apply animation
          animation: performanceConfig.enableAnimations ? 'warm-glow 0.8s ease-in-out infinite' : 'none'
        };
      case 'jumping':
        return {
          ...baseStyles,
          cursor: 'default',
          filter: 'none',
          transform: 'scale(0.8)',
          opacity: 1
          // No CSS animation - using JavaScript position updates
        };
      case 'ready':
        return {
          ...baseStyles,
          cursor: 'pointer',
          filter: 'none',
          transform: 'scale(0.9)',
          opacity: 1,
          // Conditionally add glow effects
          boxShadow: performanceConfig.enableAnimations ? '0 0 8px rgba(255, 215, 0, 0.4)' : 'none',
          // No transform needed - actual position has been updated to match animation end
        };
      case 'popped':
        return {
          ...baseStyles,
          cursor: 'default',
          transform: 'scale(1.3)',
          opacity: 1,
          // Conditionally apply effects
          filter: performanceConfig.enableAnimations ? 'drop-shadow(0 0 10px rgba(255, 215, 0, 1))' : 'none',
          animation: performanceConfig.enableAnimations ? 'pop-disappear 1s ease-out forwards' : 'none'
        };
      case 'falling':
        return {
          ...baseStyles,
          cursor: 'default',
          transform: 'scale(1.1)',
          opacity: 0.9,
          // Conditionally apply effects
          filter: performanceConfig.enableAnimations ? 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.6))' : 'none'
        };
      default:
        return baseStyles;
    }
  };

  return (
    <div
      className={`popcorn-kernel ${kernel.state}`}
      style={getKernelStyles()}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      role={kernel.state === 'ready' ? 'button' : undefined}
      aria-label={kernel.state === 'ready' ? 'Pop kernel' : undefined}
      tabIndex={kernel.state === 'ready' ? 0 : -1}
    >
      {getKernelDisplay()}
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(PopcornKernelComponent, (prevProps, nextProps) => {
  // Only re-render if critical props have changed
  return (
    prevProps.kernel.id === nextProps.kernel.id &&
    prevProps.kernel.x === nextProps.kernel.x &&
    prevProps.kernel.y === nextProps.kernel.y &&
    prevProps.kernel.state === nextProps.kernel.state &&
    prevProps.kernel.isPopped === nextProps.kernel.isPopped &&
    prevProps.size === nextProps.size &&
    prevProps.performanceConfig.enableAnimations === nextProps.performanceConfig.enableAnimations
  );
});