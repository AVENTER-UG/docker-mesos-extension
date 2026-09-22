/**
 * Tests for master utility functions
 */
import { 
  isLeader, 
  getMasterStatus, 
  extractMasters,
  formatClusterInfo,
  masterHttpEndpoint
} from './masterUtils';

// Mock data to work with
const mockMasterA = {
  id: 'master-a-id',
  hostname: 'master-a.example.com',
  pid: '12345',
  version: '1.8.0',
  start_time: 1609459200,
  elected_time: 1609459250
};

const mockMasterB = {
  id: 'master-b-id', 
  hostname: 'master-b.example.com',
  pid: '12346',
  version: '1.8.0',
  start_time: 1609459205,
  elected_time: 1609459255
};

const mockStateData = {
  id: 'master-a-id',
  hostname: 'master-a.example.com',
  pid: '12345',
  version: '1.8.0',
  start_time: 1609459200,
  elected_time: 1609459250,
  leader_info: {
    id: 'master-a-id'
  },
  cluster: 'test-cluster'
};

const mockClusterState = {
  ...mockStateData,
  masters: [mockMasterA, mockMasterB, { ...mockMasterA, id: 'master-c-id', hostname: 'master-c.example.com' }],
  leader_info: { id: 'master-a-id' },
};

describe('Master Utility Functions', () => {
  test('isLeader correctly identifies the leader', () => {
    expect(isLeader(mockMasterA, 'master-a-id')).toBe(true);
    expect(isLeader(mockMasterB, 'master-a-id')).toBe(false);
  });

  test('getMasterStatus creates proper status object', () => {
    const status = getMasterStatus(mockMasterA, 'master-a-id');
    expect(status.id).toBe('master-a-id');
    expect(status.hostname).toBe('master-a.example.com');
    expect(status.isLeader).toBe(true);
    expect(status.isOnline).toBe(true);
  });

  test('extractMasters returns proper master data', () => {
    const masters = extractMasters(mockStateData);
    expect(masters.length).toBe(1);
    expect(masters[0].id).toBe('master-a-id');
  });

  test('formatClusterInfo returns formatted cluster info', () => {
    const clusterInfo = formatClusterInfo(mockStateData);
    expect(clusterInfo.cluster).toBe('test-cluster');
    expect(clusterInfo.version).toBe('1.8.0');
    expect(clusterInfo.masterCount).toBe(1);
    expect(clusterInfo.isLeader).toBe(true);
  });

  test('formatClusterInfo lists every manager, including the leader', () => {
    const clusterInfo = formatClusterInfo(mockClusterState);

    expect(clusterInfo.masters.map((master) => master.id)).toEqual(['master-a-id', 'master-b-id', 'master-c-id']);
    expect(clusterInfo.masterCount).toBe(3);
  });

  test('extractMasters includes the leader and all followers from manager state', () => {
    const masters = extractMasters({
      id: 'leader-id',
      hostname: 'leader.example.com',
      pid: 'master@leader.example.com:5050',
      port: 5050,
      leader_info: { id: 'leader-id' },
      followers: [
        { id: 'follower-a-id', pid: 'master@follower-a.example.com:5050', port: 5050, hostname: 'follower-a.example.com' },
        { id: 'follower-b-id', pid: 'master@follower-b.example.com:5050', port: 5050, hostname: 'follower-b.example.com' },
      ],
    });

    expect(masters.map((master) => master.id)).toEqual(['leader-id', 'follower-a-id', 'follower-b-id']);
    expect(masters[0]).toMatchObject({ hostname: 'leader.example.com', port: 5050 });
    expect(masters[1]).toMatchObject({ hostname: 'follower-a.example.com', port: 5050 });
  });

  test('builds a safe master metrics endpoint from hostname and pid port', () => {
    expect(masterHttpEndpoint({ hostname: 'master-a.example.com', pid: 'master@master-a.example.com:5050' }, '/metrics/snapshot', 'development'))
      .toBe('/master-api/master-a.example.com/5050/metrics/snapshot');
    expect(masterHttpEndpoint({ hostname: 'bad/host', pid: 'master@bad/host:5050' }, '/metrics/snapshot', 'development')).toBeNull();
  });
});