import React from 'react';
import { Tube as TubeType } from '../types';
import { COLORS, COLOR_PATTERNS, COLOR_LABELS } from '../gameLogic';
import './Tube.css';

interface TubeProps {
  tube: TubeType;
  isSelected: boolean;
  onClick: () => void;
  isPouring?: boolean;
  isReceiving?: boolean;
  isComplete?: boolean;
  colorblindMode?: boolean;
  isHintSource?: boolean;
  isHintTarget?: boolean;
  pourDirection?: 'left' | 'right' | null;
  style?: React.CSSProperties;
}

const Tube: React.FC<TubeProps> = ({
  tube,
  isSelected,
  onClick,
  isPouring,
  isReceiving,
  isComplete,
  colorblindMode,
  isHintSource,
  isHintTarget,
  pourDirection,
  style
}) => {
  const emptySlots = tube.maxCapacity - tube.colors.length;
  
  const getColorPattern = (color: string): string => {
    const index = COLORS.indexOf(color);
    return index >= 0 ? COLOR_PATTERNS[index] : 'solid';
  };

  const getColorLabel = (color: string): string => {
    const index = COLORS.indexOf(color);
    return index >= 0 ? COLOR_LABELS[index] : '';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };
  
  const stateClasses = [
    'tube',
    isSelected ? 'selected' : '',
    isPouring ? 'pouring' : '',
    isPouring && pourDirection ? `tilt-${pourDirection}` : '',
    isReceiving ? 'receiving' : '',
    isComplete ? 'complete' : '',
    isHintSource ? 'hint-source' : '',
    isHintTarget ? 'hint-target' : ''
  ].filter(Boolean).join(' ');

  const tubeDescription = tube.colors.length === 0 
    ? 'Empty' 
    : `${tube.colors.length} of ${tube.maxCapacity} slots filled`;

  return (
    <div 
      id={`tube-${tube.id}`}
      className={stateClasses}
      style={style}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Tube ${tube.id + 1}: ${tubeDescription}${isComplete ? ', complete' : ''}${isSelected ? ', selected' : ''}`}
      aria-pressed={isSelected}
    >
      {/* Test tube glass lip collar & cork */}
      <div className="tube-lip">
        {isComplete && <div className="tube-cork" aria-hidden="true" />}
      </div>

      <div className="tube-container">
        {/* Empty slots on top */}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div key={`empty-${i}`} className="color-slot empty" />
        ))}

        {/* Filled liquid layers from top down */}
        {[...tube.colors].reverse().map((color, i) => {
          const isTopLayer = i === 0;
          const isBottomLayer = i === tube.colors.length - 1;
          const slotClasses = [
            'color-slot',
            'filled',
            isTopLayer ? 'top-liquid-surface' : '',
            isBottomLayer ? 'bottom-liquid-base' : '',
            colorblindMode ? `pattern-${getColorPattern(color)}` : ''
          ].filter(Boolean).join(' ');

          return (
            <div 
              key={`color-${i}`} 
              className={slotClasses}
              style={{
                backgroundColor: color,
                // Liquid depth gradient: lighter at top, richer at bottom
                background: `linear-gradient(180deg, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.05) 30%, rgba(0, 0, 0, 0.18) 100%), ${color}`
              }}
            >
              {/* Glossy liquid meniscus highlight */}
              <div className="liquid-meniscus" />
              
              {colorblindMode && (
                <span className="color-label">{getColorLabel(color)}</span>
              )}
            </div>
          );
        })}

        {/* Rising bubbles when receiving liquid */}
        {isReceiving && (
          <div className="receiving-bubbles" aria-hidden="true">
            <span className="bubble b1" />
            <span className="bubble b2" />
            <span className="bubble b3" />
          </div>
        )}
      </div>

      {isComplete && (
        <div className="completion-burst" aria-hidden="true">
          <div className="sparkle"></div>
          <div className="sparkle"></div>
          <div className="sparkle"></div>
          <div className="sparkle"></div>
          <div className="sparkle"></div>
          <div className="sparkle"></div>
        </div>
      )}
    </div>
  );
};

export default Tube;
