/**
 * Utility functions for handling master server details and statuses
 */

/**
 * Determines if a master server is the current leader based on its ID
 * @param {Object} master - Master server object from Mesos state
 * @param {string} leaderId - Current leader's ID from state data
 * @returns {boolean} Whether the master is the leader
 */
export function isLeader(master, leaderId) {
  return master.id === leaderId;
}

/**
 * Normalizes and validates master status 
 * @param {Object} master - Master server object from Mesos state
 * @param {string} currentLeaderId - Current leader's ID from state data  
 * @returns {Object} Formatted status information for the master
 */
export function getMasterStatus(master, currentLeaderId) {
  // This is a simplified status - in real implementation, you'd want to check actual connectivity
  const leader = isLeader(master, currentLeaderId);
  
  return {
    id: master.id,
    hostname: master.hostname || 'unknown',
    isLeader: leader,
    isOnline: true, // Simplified - would need more complex health checks
    pid: master.pid || 'unknown',
    version: master.version || 'unknown',
    startTime: master.start_time ? new Date(master.start_time * 1000).toISOString() : null,
    electedTime: master.elected_time ? new Date(master.elected_time * 1000).toISOString() : null
  };
}

/**
 * Extracts all masters from Mesos state data
 * @param {Object} stateData - The complete state response from Mesos /state endpoint
 * @returns {Array} List of master objects with normalized information
 */
export function extractMasters(stateData) {
  if (!stateData || typeof stateData !== "object") return [];

  const configuredMasters = [
    stateData.masters,
    stateData.cluster_info?.masters,
    stateData.cluster?.masters,
  ].find(Array.isArray);
  const masters = configuredMasters ? [...configuredMasters] : [];

  if (stateData.id && stateData.hostname) {
    masters.unshift({
      id: stateData.id,
      hostname: stateData.hostname,
      pid: stateData.pid,
      port: stateData.port,
      version: stateData.version,
      start_time: stateData.start_time,
      elected_time: stateData.elected_time,
      leader_info: stateData.leader_info,
    });
  }

  if (Array.isArray(stateData.followers)) {
    masters.push(...stateData.followers);
  }

  return masters.filter((master, index, allMasters) => {
    const identity = master?.id || master?.hostname;
    return identity && allMasters.findIndex((candidate) => (candidate?.id || candidate?.hostname) === identity) === index;
  });
}

/**
 * Formats cluster information for display
 * @param {Object} stateData - The complete state response from Mesos /state endpoint
 * @returns {Object} Formatted cluster information
 */
export function formatClusterInfo(stateData) {
  if (!stateData) return null;
  
  const currentLeaderId = stateData.leader_info?.id || null;
  const masters = extractMasters(stateData);
  
  return {
    cluster: stateData.cluster || 'unknown',
    version: stateData.version || 'unknown',
    startTime: stateData.start_time ? new Date(stateData.start_time * 1000).toISOString() : null,
    leader: stateData.leader || null,
    currentLeaderId,
    masters: masters,
    masterCount: masters.length,
    isLeader: String(stateData.id) === String(currentLeaderId)
  };
}

export function masterHttpEndpoint(master, path = "/metrics/snapshot", environment = process.env.NODE_ENV) {
  const hostname = master?.hostname;
  const explicitPort = Number(master?.port);
  const pidPort = String(master?.pid || "").match(/:(\d+)$/)?.[1];
  const port = Number.isInteger(explicitPort) && explicitPort > 0 && explicitPort <= 65535
    ? explicitPort
    : Number(pidPort) || 5050;
  if (!hostname || !/^[A-Za-z0-9.-]+$/.test(hostname) || !Number.isInteger(port) || port < 1 || port > 65535) return null;
  if (environment === "development") return `/master-api/${encodeURIComponent(hostname)}/${port}${path}`;
  return `//${hostname}:${port}${path}`;
}