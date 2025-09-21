import React, { useState } from 'react';
import './TimeOfDayFilter.css';

const TimeOfDayFilter = ({ selectedRanges, onTimeOfDayChange }) => {
  // Initialize with midnight to midnight if empty
  const initializeRanges = () => {
    if (selectedRanges.length === 0) {
      return [{ start: '00:00', end: '23:59' }];
    }
    return [...selectedRanges];
  };

  const [pendingRanges, setPendingRanges] = useState(initializeRanges());
  const [newRange, setNewRange] = useState({ start: '06:00', end: '10:00' });

  const handleAddRange = () => {
    if (newRange.start && newRange.end && newRange.start < newRange.end) {
      const updatedRanges = [...pendingRanges, { ...newRange }];
      setPendingRanges(updatedRanges);
      setNewRange({ start: '06:00', end: '10:00' }); // Reset
    }
  };

  const handleRemoveRange = (index) => {
    const updatedRanges = pendingRanges.filter((_, i) => i !== index);
    setPendingRanges(updatedRanges);
  };

  const handleApply = () => {
    onTimeOfDayChange(pendingRanges);
  };

  const hasChanges = () => {
    if (pendingRanges.length !== selectedRanges.length) return true;
    return pendingRanges.some((range, index) => {
      const selected = selectedRanges[index];
      return !selected || range.start !== selected.start || range.end !== selected.end;
    });
  };

  return (
    <div className="time-of-day-filter">
      <div className="selected-time-ranges">
        <h5>Time Ranges:</h5>
        <div className="ranges-list">
          {pendingRanges.map((range, index) => (
            <div key={index} className="time-range-display">
              <span className="time-range-text">
                {range.start} - {range.end}
              </span>
              <button 
                onClick={() => handleRemoveRange(index)}
                className="remove-range-btn"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="add-new-range">
        <h5>Add Time Range:</h5>
        <div className="new-range-inputs">
          <input
            type="time"
            value={newRange.start}
            onChange={(e) => setNewRange(prev => ({ ...prev, start: e.target.value }))}
            className="time-input"
          />
          <span className="range-separator">to</span>
          <input
            type="time"
            value={newRange.end}
            onChange={(e) => setNewRange(prev => ({ ...prev, end: e.target.value }))}
            className="time-input"
          />
          <button 
            onClick={handleAddRange}
            className="add-range-btn"
            disabled={!newRange.start || !newRange.end || newRange.start >= newRange.end}
          >
            Add
          </button>
        </div>
      </div>

      <div className="time-filter-actions">
        <button 
          onClick={handleApply} 
          className="apply-filters-btn"
          disabled={!hasChanges()}
        >
          Apply Time Filters
        </button>
      </div>
    </div>
  );
};

export default TimeOfDayFilter;