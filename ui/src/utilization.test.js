import { normalizeMetricsResponse, utilizationSnapshot } from "./utilization";

test("normalizes flat and Mesos v1 metric responses", () => {
  const entries = [{ name: "slave/cpus_utilization", value: 42.5 }, { name: "slave/mem_utilization", value: 81 }];
  expect(normalizeMetricsResponse({ "slave/cpus_utilization": 42.5 })).toEqual({ "slave/cpus_utilization": 42.5 });
  expect(normalizeMetricsResponse({ metrics: entries })).toEqual({ "slave/cpus_utilization": 42.5, "slave/mem_utilization": 81 });
  expect(normalizeMetricsResponse({ metrics: { "slave/cpus_utilization": 42.5 } })).toEqual({ "slave/cpus_utilization": 42.5 });
  expect(normalizeMetricsResponse(entries)).toEqual({ "slave/cpus_utilization": 42.5, "slave/mem_utilization": 81 });
  expect(normalizeMetricsResponse({ get_metrics: { metrics: entries } })).toEqual({ "slave/cpus_utilization": 42.5, "slave/mem_utilization": 81 });
});

test("reads normalized agent utilization values", () => {
  expect(utilizationSnapshot({ "slave/cpus_utilization": 42.5, "slave/load_utilization": 150 }, "slave"))
    .toEqual({ cpus: 42.5, mem: null, disk: null, gpus: null, load: 100 });
});
