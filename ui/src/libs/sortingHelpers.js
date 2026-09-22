/**
 * Sort items by timestamp field in newest-to-oldest order (newest first, oldest last)
 * @param {Array} items - Array of items to sort
 * @param {string} timestampField - The field name containing timestamps
 * @returns {Array} Sorted array with newest items first
 */
export function sortByTimestamp(items = [], timestampField = 'timestamp') {
  // Create a copy of the items array to avoid mutating original data
  return [...items].sort((a, b) => {
    const timestampA = Number(a[timestampField]);
    const timestampB = Number(b[timestampField]);
    
    // Handle missing/null/invalid timestamps - put them at the end
    if (!Number.isFinite(timestampA) || timestampA <= 0) return 1;
    if (!Number.isFinite(timestampB) || timestampB <= 0) return -1;
    
    // Sort newest first (descending order)
    return timestampB - timestampA;
  });
}

/**
 * Sort items with fallback for missing timestamps
 * @param {Array} items - Array of items to sort 
 * @param {Function} getTimestamp - Function that extracts timestamp from item
 * @returns {Array} Sorted array with newest items first
 */
export function sortByTimestampWithFallback(items = [], getTimestamp) {
  // Create a copy of the items array to avoid mutating original data
  return [...items].sort((a, b) => {
    const timestampA = Number(getTimestamp(a));
    const timestampB = Number(getTimestamp(b));
    
    // Handle missing/null/invalid timestamps - put them at the end  
    if (!Number.isFinite(timestampA) || timestampA <= 0) return 1;
    if (!Number.isFinite(timestampB) || timestampB <= 0) return -1;
    
    // Sort newest first (descending order)
    return timestampB - timestampA;
  });
}