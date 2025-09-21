import React, { useState } from 'react';
import DepthFilter from './DepthFilter';
import DateRangeFilter from './DateRangeFilter';
import TimeOfDayFilter from './TimeOfDayFilter';
import './FilterPanels.css';

const FilterPanels = ({ 
  scenario, 
  onFiltersChange,
  // Current filter values passed down from parent
  selectedDepthBins = [],
  dateRange = { start: null, end: null },
  timeOfDay = []
}) => {
  // Track which panel is currently expanded
  const [expandedPanel, setExpandedPanel] = useState('depth');

  // Handle individual filter changes and bubble up to parent
  const handleDepthChange = (newDepthBins) => {
    onFiltersChange({
      depthBins: newDepthBins,
      dateRange,
      timeOfDay
    });
    // Close the depth filter panel after applying
    setExpandedPanel(null);
  };

  const handleDateRangeChange = (newDateRange) => {
    onFiltersChange({
      depthBins: selectedDepthBins,
      dateRange: newDateRange,
      timeOfDay
    });
    // Close the date range filter panel after applying
    setExpandedPanel(null);
  };

  const handleTimeOfDayChange = (newTimeOfDay) => {
    onFiltersChange({
      depthBins: selectedDepthBins,
      dateRange,
      timeOfDay: newTimeOfDay
    });
    // Close the time of day filter panel after applying
    setExpandedPanel(null);
  };

  const togglePanel = (panelName) => {
    setExpandedPanel(expandedPanel === panelName ? null : panelName);
  };

  // Generate summary text for collapsed panels
  const getDepthSummary = () => {
    // Handle new object format: {maxDepth: [selectedDepths]}
    if (typeof selectedDepthBins === 'object' && selectedDepthBins !== null && !Array.isArray(selectedDepthBins)) {
      const allSelections = new Set();
      Object.values(selectedDepthBins).forEach(selections => {
        if (Array.isArray(selections)) {
          selections.forEach(depth => allSelections.add(depth));
        }
      });
      const uniqueDepths = allSelections.size;
      if (uniqueDepths === 0) return 'No depths selected';
      if (uniqueDepths === 1) return `1 depth selected`;
      return `${uniqueDepths} depths selected`;
    }
    
    // Handle old array format for backward compatibility
    if (Array.isArray(selectedDepthBins)) {
      if (selectedDepthBins.length === 0) return 'No depths selected';
      if (selectedDepthBins.length === 1) return `${selectedDepthBins[0]}m`;
      return `${selectedDepthBins.length} depths selected`;
    }
    
    return 'No depths selected';
  };

  const getDateSummary = () => {
    if (!dateRange.start || !dateRange.end) return 'Full time range';
    return `${dateRange.start} to ${dateRange.end}`;
  };

  const getTimeSummary = () => {
    if (!timeOfDay.length) return 'All hours';
    return `${timeOfDay.length} time range(s)`;
  };

  if (!scenario) {
    return (
      <div className="filter-panels">
        <div className="filter-panels-header">
          <h3>Filters</h3>
        </div>
        <div className="no-scenario-filters">
          <p>Load a scenario to configure filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="filter-panels">
      <div className="filter-panels-header">
        <h3>Filters</h3>
      </div>

      {/* Depth Filter Panel */}
      <div className={`filter-panel ${expandedPanel === 'depth' ? 'expanded' : 'collapsed'}`}>
        <div 
          className="filter-header" 
          onClick={() => togglePanel('depth')}
        >
          <h4>Depth Selection</h4>
          <span className="expand-icon">
            {expandedPanel === 'depth' ? '▼' : '▶'}
          </span>
        </div>
        
        {expandedPanel === 'depth' ? (
          <div className="filter-content">
            <DepthFilter
              availableDepths={scenario.depth_bins}
              selectedDepths={selectedDepthBins}
              onDepthChange={handleDepthChange}
            />
          </div>
        ) : (
          <div className="filter-summary">
            {getDepthSummary()}
          </div>
        )}
      </div>

      {/* Date Range Filter Panel */}
      <div className={`filter-panel ${expandedPanel === 'dateRange' ? 'expanded' : 'collapsed'}`}>
        <div 
          className="filter-header" 
          onClick={() => togglePanel('dateRange')}
        >
          <h4>Date Range</h4>
          <span className="expand-icon">
            {expandedPanel === 'dateRange' ? '▼' : '▶'}
          </span>
        </div>
        
        {expandedPanel === 'dateRange' ? (
          <div className="filter-content">
            <DateRangeFilter
              timeWindow={scenario.time_window}
              selectedRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
            />
          </div>
        ) : (
          <div className="filter-summary">
            {getDateSummary()}
          </div>
        )}
      </div>

      {/* Time of Day Filter Panel */}
      <div className={`filter-panel ${expandedPanel === 'timeOfDay' ? 'expanded' : 'collapsed'}`}>
        <div 
          className="filter-header" 
          onClick={() => togglePanel('timeOfDay')}
        >
          <h4>Time of Day</h4>
          <span className="expand-icon">
            {expandedPanel === 'timeOfDay' ? '▼' : '▶'}
          </span>
        </div>
        
        {expandedPanel === 'timeOfDay' ? (
          <div className="filter-content">
            <TimeOfDayFilter
              selectedRanges={timeOfDay}
              onTimeOfDayChange={handleTimeOfDayChange}
            />
          </div>
        ) : (
          <div className="filter-summary">
            {getTimeSummary()}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterPanels;