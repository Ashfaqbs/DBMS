# Elasticsearch hot, warm, and frozen data tiers

Elasticsearch **data tiers** group data nodes by the kind of storage and workload they are designed for. They are node roles and allocation targets—not extra layers in an index, and not replicas. Elasticsearch can move an index between tiers as its access pattern changes, commonly using **Index Lifecycle Management (ILM)**.

## The tiers

| Tier | Node role | Typical data/workload | Storage and performance |
|---|---|---|---|
| **Hot** | `data_hot` | New, frequently updated data; the active write index and most frequently searched data | Fast storage and more CPU/IOPS; optimized for indexing and low-latency searches |
| **Warm** | `data_warm` | Older data that is searched less often and is mostly read-only | Usually larger, less expensive storage; lower indexing demand |
| **Frozen** | `data_frozen` | The oldest, rarely accessed data that still needs to remain searchable | Uses searchable snapshots and a local cache; lower storage cost, with searches typically slower and dependent on cache hits |

A common retention path is **hot → warm → cold → frozen**. Cold is another built-in data tier (`data_cold`), often useful between warm and frozen; it is omitted from the requested three-tier overview but can be included in an ILM policy. Not every deployment needs every tier.

## How data gets there

An index is allocated to eligible nodes according to its tier preference. ILM can roll over an active hot index and later apply lifecycle actions to move it to warm, cold, or frozen storage. The exact ages and actions depend on retention and query requirements; a transition is not automatic merely because a node joins the cluster. In particular, frozen-tier storage relies on **searchable snapshots**—it is not simply an ordinary full copy of every index on a cheap disk. Check the Elasticsearch version and subscription/licensing requirements before planning searchable snapshots for production.

Tier roles do not change the fundamental shard model: each shard copy is assigned to one node at a time, and replicas still provide shard-copy redundancy. Keep replicas and snapshots/backups in the design; moving an index to a cheaper tier is not a backup strategy. A node may be configured with more than one role, but production clusters commonly separate tiers so their hardware and workloads can be sized independently.

## Example production layout

```text
Clients → load balancer → coordinating-only node pool
                               │
              ┌────────────────┼─────────────────┐
              ▼                ▼                 ▼
         Hot nodes         Warm nodes       Frozen nodes
         data_hot          data_warm         data_frozen
         fast SSDs          larger disks      searchable-snapshot
         active writes      older indices     cache / rare queries

         Separate master-eligible nodes manage cluster metadata.
```

The coordinating nodes route requests and merge search results; they are not the hot/warm/frozen tiers. Master-eligible nodes also remain a separate cluster-management role. Data tiers are a way to place index shards on suitable **data** nodes.

## Kubernetes role examples

For the Elasticsearch StatefulSets in the production topology, assign the corresponding Elasticsearch node role to each tier's pods. For example, the node setting can be expressed as:

```yaml
# Hot data nodes
- name: node.roles
  value: "data_hot,ingest"

# Warm data nodes
- name: node.roles
  value: "data_warm"

# Frozen data nodes (for searchable-snapshot workloads)
- name: node.roles
  value: "data_frozen"
```

These are role-setting examples, not complete manifests. Give each tier its own storage class, capacity, and resource sizing as appropriate. Hot and warm nodes normally need persistent storage for their shard data; frozen deployments also need a correctly configured searchable-snapshot repository and cache. Configure ILM and verify the resulting index allocation and shard placement in the actual cluster.
