from azure.cosmos import CosmosClient, PartitionKey
import urllib3

# ─────────────────────────────────────────────────────────
# 1) Suppress SSL warnings (we trust our emulator)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ─────────────────────────────────────────────────────────
# 2) Emulator connection settings
endpoint = "https://localhost:8081/"
key = "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="

# ─────────────────────────────────────────────────────────
# 3) Initialize client with endpoint discovery OFF
client = CosmosClient(
    endpoint,
    credential=key,
    connection_verify=False,            # skip cert validation
    consistency_level="Session",        # optional
    enable_endpoint_discovery=False     # 🔑 force localhost usage
)

# ─────────────────────────────────────────────────────────
# 4) Create/Get database & container
db = client.create_database_if_not_exists(id="DemoDB")
container = db.create_container_if_not_exists(
    id="Products",
    partition_key=PartitionKey(path="/id"),
    offer_throughput=400
)

# ─────────────────────────────────────────────────────────
# 5) Upsert a test document
item = {
    "id": "1",
    "name": "SSD",
    "category": "Storage",
    "price": 2500
}
container.upsert_item(item)
print("✅ Document inserted successfully!")
