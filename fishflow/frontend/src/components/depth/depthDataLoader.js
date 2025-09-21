/**
 * Extract required months from date range
 * @param {Object} dateRange - {start: "2024-01-15", end: "2024-03-20"}
 * @returns {Array} - ["2024-01", "2024-02", "2024-03"]
 */
const getRequiredMonths = (dateRange) => {
  if (!dateRange.start || !dateRange.end) return [];
  
  const months = [];
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  
  while (current <= endDate) {
    const monthStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    months.push(monthStr);
    current.setMonth(current.getMonth() + 1);
  }
  
  return months;
};

/**
 * Extract required depth bins from depth filter object
 * @param {Object} depthBins - {25: [25], 50: [25, 50], 100: [25, 50, 75]}
 * @returns {Array} - [25, 50, 75] (unique depths)
 */
const getRequiredDepthBins = (depthBins) => {
  if (!depthBins || typeof depthBins !== 'object') return [];
  
  const allDepths = new Set();
  Object.values(depthBins).forEach(depths => {
    if (Array.isArray(depths)) {
      depths.forEach(depth => allDepths.add(depth));
    }
  });
  
  return Array.from(allDepths).sort((a, b) => a - b);
};

/**
 * Generate data chunk keys for tracking what's loaded
 * @param {string} scenarioId
 * @param {Array} months - ["2024-01", "2024-02"]
 * @param {Array} depthBins - [25, 50, 75]
 * @returns {Array} - ["scenario_2024-01_25", "scenario_2024-01_50", ...]
 */
const generateChunkKeys = (scenarioId, months, depthBins) => {
  const keys = [];
  months.forEach(month => {
    depthBins.forEach(depth => {
      keys.push(`${scenarioId}_${month}_${depth}`);
    });
  });
  return keys;
};

/**
 * Determine which chunks need to be loaded
 * @param {string} scenarioId
 * @param {Array} months
 * @param {Array} depthBins
 * @param {Object} loadedChunks - Set/Object tracking what's already loaded
 * @returns {Array} - [{month, depth}, ...] for chunks that need loading
 */
const getMissingChunks = (scenarioId, months, depthBins, loadedChunks) => {
  const missing = [];
  
  months.forEach(month => {
    depthBins.forEach(depth => {
      const key = `${scenarioId}_${month}_${depth}`;
      if (!loadedChunks[key]) {
        missing.push({ month, depth });
      }
    });
  });
  
  return missing;
};

/**
 * Load a single data chunk
 * @param {string} scenarioId
 * @param {string} month - "2024-01"
 * @param {number} depth - 25
 * @returns {Promise} - API response data
 */
const loadDataChunk = async (scenarioId, month, depth) => {
  try {
    const response = await fetch(
      `http://localhost:8000/v1/depth/scenario/${scenarioId}/occupancy?month=${month}-01&depth_bin=${depth}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to load data for ${month}, depth ${depth}: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error loading chunk ${scenarioId}_${month}_${depth}:`, error);
    throw error;
  }
};

/**
 * Load multiple data chunks with progress tracking
 * @param {string} scenarioId
 * @param {Array} chunks - [{month, depth}, ...]
 * @param {Function} onProgress - (loaded, total) => {}
 * @returns {Promise<Object>} - {chunkKey: data, ...}
 */
const loadDataChunks = async (scenarioId, chunks, onProgress = null) => {
  const results = {};
  let loaded = 0;
  
  // Load chunks in parallel but with some concurrency limit
  const concurrency = 3;
  
  for (let i = 0; i < chunks.length; i += concurrency) {
    const batch = chunks.slice(i, i + concurrency);
    
    const batchPromises = batch.map(async ({ month, depth }) => {
      try {
        const data = await loadDataChunk(scenarioId, month, depth);
        const key = `${scenarioId}_${month}_${depth}`;
        results[key] = data;
        loaded++;
        
        if (onProgress) {
          onProgress(loaded, chunks.length);
        }
        
        return { key, success: true };
      } catch (error) {
        const key = `${scenarioId}_${month}_${depth}`;
        console.error(`Failed to load chunk ${key}:`, error);
        loaded++;
        
        if (onProgress) {
          onProgress(loaded, chunks.length);
        }
        
        return { key, success: false, error };
      }
    });
    
    await Promise.all(batchPromises);
  }
  
  return results;
};

/**
 * Main function to determine and load required data
 * @param {string} scenarioId
 * @param {Object} filterState - {depthBins, dateRange, timeOfDay}
 * @param {Object} currentData - Currently loaded data chunks
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} - New data chunks to add to state
 */
const loadRequiredData = async (scenarioId, filterState, currentData, onProgress = null) => {
  if (!scenarioId || !filterState) {
    return {};
  }
  
  // Determine what we need
  const requiredMonths = getRequiredMonths(filterState.dateRange);
  const requiredDepthBins = getRequiredDepthBins(filterState.depthBins);
  
  if (requiredMonths.length === 0 || requiredDepthBins.length === 0) {
    console.log('No data required for current filters');
    return {};
  }
  
  // Find missing chunks
  const missingChunks = getMissingChunks(scenarioId, requiredMonths, requiredDepthBins, currentData);
  
  if (missingChunks.length === 0) {
    console.log('All required data already loaded');
    return {};
  }
  
  console.log(`Loading ${missingChunks.length} missing data chunks:`, missingChunks);
  
  // Load missing chunks
  const newData = await loadDataChunks(scenarioId, missingChunks, onProgress);
  
  return newData;
};

// Export functions for use in DepthModel
export {
  getRequiredMonths,
  getRequiredDepthBins,
  generateChunkKeys,
  getMissingChunks,
  loadDataChunk,
  loadDataChunks,
  loadRequiredData
};