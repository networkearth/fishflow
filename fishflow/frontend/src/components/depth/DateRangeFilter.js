import React, { useState } from 'react';
import './DateRangeFilter.css';

const DateRangeFilter = ({ timeWindow, selectedRange, onDateRangeChange }) => {
  const [pendingRange, setPendingRange] = useState({
    start: selectedRange.start || timeWindow[0],
    end: selectedRange.end || timeWindow[1]
  });

  const handleStartDateChange = (e) => {
    setPendingRange(prev => ({
      ...prev,
      start: e.target.value
    }));
  };

  const handleEndDateChange = (e) => {
    setPendingRange(prev => ({
      ...prev,
      end: e.target.value
    }));
  };

  const handleApply = () => {
    onDateRangeChange(pendingRange);
  };

  const handleReset = () => {
    const resetRange = {
      start: timeWindow[0],
      end: timeWindow[1]
    };
    setPendingRange(resetRange);
    onDateRangeChange(resetRange);
  };

  const isValidRange = () => {
    return pendingRange.start && pendingRange.end && 
           pendingRange.start <= pendingRange.end &&
           pendingRange.start >= timeWindow[0] &&
           pendingRange.end <= timeWindow[1];
  };

  const hasChanges = () => {
    return pendingRange.start !== selectedRange.start || 
           pendingRange.end !== selectedRange.end;
  };

  return (
    <div className="date-range-filter">
      <div className="date-range-info">
        <p>Available data: {timeWindow[0]} to {timeWindow[1]}</p>
      </div>

      <div className="date-inputs">
        <div className="date-input-group">
          <label htmlFor="start-date">Start Date:</label>
          <input
            id="start-date"
            type="date"
            value={pendingRange.start}
            min={timeWindow[0]}
            max={timeWindow[1]}
            onChange={handleStartDateChange}
            className="date-input"
          />
        </div>

        <div className="date-input-group">
          <label htmlFor="end-date">End Date:</label>
          <input
            id="end-date"
            type="date"
            value={pendingRange.end}
            min={timeWindow[0]}
            max={timeWindow[1]}
            onChange={handleEndDateChange}
            className="date-input"
          />
        </div>
      </div>

      {!isValidRange() && (
        <div className="validation-error">
          Please select a valid date range within the available data period.
        </div>
      )}

      <div className="date-range-actions">
        <button 
          onClick={handleReset} 
          className="reset-btn"
        >
          Reset to Full Range
        </button>
        <button 
          onClick={handleApply} 
          className="apply-filters-btn"
          disabled={!isValidRange() || !hasChanges()}
        >
          Apply Date Range
        </button>
      </div>
    </div>
  );
};

export default DateRangeFilter;