import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import './RiskTimeSeries.css';

const RiskTimeSeries = ({ 
  selectedCell, 
  cellMaxDepths, 
  filterState, 
  loadedData, 
  tolerance 
}) => {
  // Calculate time series data for the selected cell
  const timeSeriesData = useMemo(() => {
    if (!selectedCell || !cellMaxDepths || !loadedData) return null;
    
    // Step 1: Get max depth for selected cell
    const cellMaxDepth = cellMaxDepths[selectedCell];
    if (!cellMaxDepth) return null;
    
    // Step 2: Get selected depth bins for this cell's max depth
    const selectedDepths = filterState.depthBins[cellMaxDepth] || [];
    if (selectedDepths.length === 0) return null;
    
    // Step 3: Collect all timestamps and probabilities (ignoring time of day filter)
    const timeSeriesMap = new Map();
    
    // Filter by date range only (ignore time of day for time series)
    const startDate = filterState.dateRange.start ? new Date(filterState.dateRange.start) : null;
    const endDate = filterState.dateRange.end ? new Date(filterState.dateRange.end) : null;
    
    // Iterate through loaded months
    for (const month in loadedData) {
      selectedDepths.forEach(depth => {
        const depthData = loadedData[month][depth];
        if (!depthData || !depthData.cells[selectedCell]) return;
        
        const cellProbabilities = depthData.cells[selectedCell];
        const timestamps = depthData.timestamps;
        
        timestamps.forEach((timestamp, index) => {
          const date = new Date(timestamp);
          
          // Apply date range filter
          if (startDate && date < startDate) return;
          if (endDate && date > endDate) return;
          
          const probability = cellProbabilities[index] || 0;
          
          // Sum probabilities across depth bins for each timestamp
          if (timeSeriesMap.has(timestamp)) {
            timeSeriesMap.set(timestamp, timeSeriesMap.get(timestamp) + probability);
          } else {
            timeSeriesMap.set(timestamp, probability);
          }
        });
      });
    }

    // Helper function to check if timestamp falls within time of day ranges
    const isTimestampInTimeOfDay = (timestamp, timeOfDayRanges) => {
        if (!timeOfDayRanges || timeOfDayRanges.length === 0) return true;
        
        const date = new Date(timestamp);
        const timeStr = date.toTimeString().slice(0, 5); // "HH:MM"
        
        return timeOfDayRanges.some(range => {
        return timeStr >= range.start && timeStr <= range.end;
        });
    };
        
    // Convert to array and sort by timestamp
    const sortedData = Array.from(timeSeriesMap.entries())
      .map(([timestamp, probability]) => ({
        timestamp,
        date: new Date(timestamp),
        probability,
        // Check if this timestamp falls within time of day filters
        isInTimeOfDay: isTimestampInTimeOfDay(timestamp, filterState.timeOfDay)
      }))
      .sort((a, b) => a.date - b.date);
    
    return sortedData;
  }, [selectedCell, cellMaxDepths, filterState, loadedData]);
  
  
  
  // Calculate minimum risk and tolerance line
  const { minRisk, toleranceLine } = useMemo(() => {
    if (!timeSeriesData || timeSeriesData.length === 0) return { minRisk: null, toleranceLine: null };
    
    const probabilities = timeSeriesData.map(d => d.probability);
    const min = Math.min(...probabilities);
    const toleranceValue = min + tolerance;
    
    return { 
      minRisk: min, 
      toleranceLine: toleranceValue 
    };
  }, [timeSeriesData, tolerance]);
  
  // Format data for recharts with separate series for time of day filtering
  const chartData = useMemo(() => {
    if (!timeSeriesData) return [];
    
    return timeSeriesData.map((item, index) => ({
      index,
      timestamp: item.timestamp,
      date: item.date,
      // Two separate data series - one for in-time-of-day, one for out-of-time-of-day
      probabilityInTime: item.isInTimeOfDay ? item.probability : null,
      probabilityOutTime: !item.isInTimeOfDay ? item.probability : null,
      // Full probability for tooltip
      probability: item.probability
    }));
  }, [timeSeriesData]);
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-time">{new Date(data.timestamp).toLocaleString()}</p>
          <p className="tooltip-risk">Risk: {data.probability.toFixed(4)}</p>
          <p className="tooltip-status">
            {data.probabilityInTime !== null ? 'Within time filter' : 'Outside time filter'}
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Format x-axis labels
  const formatXAxis = (tickItem, index) => {
    if (!chartData[tickItem]) return '';
    const date = chartData[tickItem].date;
    return date.toLocaleDateString();
  };
  
  if (!selectedCell) {
    return (
      <div className="time-series-container">
        <div className="no-cell-message">
          Select a cell on the map to view risk over time
        </div>
      </div>
    );
  }
  
  if (!timeSeriesData || timeSeriesData.length === 0) {
    return (
      <div className="time-series-container">
        <div className="no-data-message">
          <p>No time series data available for cell {selectedCell}</p>
          <p>This may be because:</p>
          <ul>
            <li>No depth bins are selected for this cell's depth category</li>
            <li>No data is loaded for the selected date range</li>
            <li>Cell has no occupancy data</li>
          </ul>
        </div>
      </div>
    );
  }
  
  return (
    <div className="time-series-container">
      <div className="time-series-header">
        <h4>Risk Over Time - Cell {selectedCell}</h4>
        <div className="time-series-stats">
          <span>Min Risk: {minRisk?.toFixed(4)}</span>
          <span>Tolerance: ±{tolerance.toFixed(2)}</span>
          <span>Data Points: {timeSeriesData.length}</span>
        </div>
      </div>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="index"
              type="number"
              scale="linear"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatXAxis}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={['dataMin - 0.1', 'dataMax + 0.1']}
              label={{ value: 'Risk Probability', angle: -90, position: 'insideLeft' }}
              tickFormatter={(value) => value.toFixed(3)}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Reference line for tolerance */}
            {toleranceLine && (
              <ReferenceLine 
                y={toleranceLine} 
                stroke="#ef4444" 
                strokeDasharray="5 5"
                label="Tolerance Threshold"
              />
            )}
            
            {/* Two lines - one for in-time-of-day, one for out-of-time-of-day */}
            <Line
              type="monotone"
              dataKey="probabilityInTime"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              name="Within Time Filter"
            />
            <Line
              type="monotone"
              dataKey="probabilityOutTime"
              stroke="#94a3b8"
              strokeWidth={1}
              dot={false}
              connectNulls={false}
              name="Outside Time Filter"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-line in-time"></div>
          <span>Within selected time periods</span>
        </div>
        <div className="legend-item">
          <div className="legend-line out-time"></div>
          <span>Outside selected time periods</span>
        </div>
        <div className="legend-item">
          <div className="legend-line tolerance"></div>
          <span>Tolerance threshold (min + {tolerance.toFixed(2)})</span>
        </div>
      </div>
    </div>
  );
};

export default RiskTimeSeries;