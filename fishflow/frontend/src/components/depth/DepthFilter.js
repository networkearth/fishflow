import React, { useState } from 'react';
import './DepthFilter.css';

const DepthFilter = ({ availableDepths, selectedDepths, onDepthChange }) => {
  // Convert from old format to new format if needed
  const initializePendingSelection = () => {
    if (Array.isArray(selectedDepths)) {
      // Convert old array format to new object format
      const newFormat = {};
      availableDepths.forEach(maxDepth => {
        newFormat[maxDepth] = selectedDepths.filter(depth => depth <= maxDepth);
      });
      return newFormat;
    }
    return selectedDepths || {};
  };

  const [pendingSelection, setPendingSelection] = useState(initializePendingSelection());

  const handleDepthToggle = (maxDepth, depth) => {
    const currentSelections = pendingSelection[maxDepth] || [];
    const newSelections = currentSelections.includes(depth)
      ? currentSelections.filter(d => d !== depth)
      : [...currentSelections, depth].sort((a, b) => a - b);
    
    setPendingSelection(prev => ({
      ...prev,
      [maxDepth]: newSelections
    }));
  };

  const handleApply = () => {
    onDepthChange(pendingSelection);
  };

  const handleSelectAll = () => {
    const allSelected = {};
    availableDepths.forEach(maxDepth => {
      allSelected[maxDepth] = availableDepths.filter(depth => depth <= maxDepth);
    });
    setPendingSelection(allSelected);
  };

  const handleClearAll = () => {
    const allCleared = {};
    availableDepths.forEach(maxDepth => {
      allCleared[maxDepth] = [];
    });
    setPendingSelection(allCleared);
  };

  const getDepthLabel = (depth, index) => {
    const prevDepth = index === 0 ? 0 : availableDepths[index - 1];
    return `${prevDepth}-${depth}m`;
  };

  // Create columns based on maximum depths
  const createDepthColumns = () => {
    return availableDepths.map((maxDepth, columnIndex) => {
      const availableAtThisDepth = availableDepths.slice(0, columnIndex + 1);
      
      return {
        maxDepth,
        availableDepths: availableAtThisDepth,
        label: `Up to ${maxDepth}m`
      };
    });
  };

  const depthColumns = createDepthColumns();

  // Calculate total selections for summary
  const getTotalSelections = () => {
    const allSelections = new Set();
    Object.values(pendingSelection).forEach(selections => {
      if (Array.isArray(selections)) {
        selections.forEach(depth => allSelections.add(depth));
      }
    });
    return allSelections.size;
  };

  // Get all unique selected depths as an array (for debugging/display)
  const getAllSelectedDepths = () => {
    const allSelections = new Set();
    Object.values(pendingSelection).forEach(selections => {
      if (Array.isArray(selections)) {
        selections.forEach(depth => allSelections.add(depth));
      }
    });
    return Array.from(allSelections).sort((a, b) => a - b);
  };

  const totalSelections = getTotalSelections();
  const allSelectedDepths = getAllSelectedDepths();

  return (
    <div className="depth-filter">
      <div className="depth-filter-header">
        <p>Select depths to analyze by water column depth. Each column represents areas with different maximum depths:</p>
        <div className="depth-filter-controls">
          <button onClick={handleSelectAll} className="select-all-btn">
            Select All Depths
          </button>
          <button onClick={handleClearAll} className="clear-all-btn">
            Clear All
          </button>
        </div>
      </div>

      <div className="depth-columns-container">
        {depthColumns.map((column, columnIndex) => {
          const columnSelections = pendingSelection[column.maxDepth] || [];
          
          return (
            <div key={column.maxDepth} className="depth-column">
              <div className="column-header">
                <div className="column-title">{column.label}</div>
                <div className="column-subtitle">
                  {columnSelections.length}/{column.availableDepths.length} selected
                </div>
              </div>
              
              <div className="depth-bins-list">
                {column.availableDepths.map((depth, depthIndex) => (
                  <div
                    key={`${column.maxDepth}-${depth}`}
                    className={`depth-bin ${columnSelections.includes(depth) ? 'selected' : ''}`}
                    onClick={() => handleDepthToggle(column.maxDepth, depth)}
                  >
                    <div className="depth-label">{getDepthLabel(depth, depthIndex)}</div>
                    <div className="depth-value">{depth}m max</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="depth-loading-status">
        <div className="loading-legend">
          <div className="loading-item">
            <div className="loading-indicator loaded"></div>
            <span>Loaded</span>
          </div>
          <div className="loading-item">
            <div className="loading-indicator loading"></div>
            <span>Loading...</span>
          </div>
          <div className="loading-item">
            <div className="loading-indicator not-loaded"></div>
            <span>Not loaded</span>
          </div>
        </div>
      </div>

      <div className="depth-filter-actions">
        <div className="selection-summary">
          {totalSelections === 0 && 'No depths selected'}
          {totalSelections === 1 && `1 unique depth layer selected: ${allSelectedDepths[0]}m`}
          {totalSelections > 1 && `${totalSelections} unique depth layers selected: ${allSelectedDepths.join('m, ')}m`}
        </div>
        <button 
          onClick={handleApply} 
          className="apply-filters-btn"
          disabled={totalSelections === 0}
        >
          Apply Depth Filters
        </button>
      </div>
    </div>
  );
};

export default DepthFilter;