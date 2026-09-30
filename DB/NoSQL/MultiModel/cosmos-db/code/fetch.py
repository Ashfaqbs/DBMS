from azure.cosmos import CosmosClient, PartitionKey
import urllib3

# ─────────────────────────────────────────────────────────
# Suppress SSL warnings (emulator’s self-signed cert)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ─────────────────────────────────────────────────────────
# Connection settings (emulator)
endpoint = "https://localhost:8081/"
key = "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="

# ─────────────────────────────────────────────────────────
# Initialize client with endpoint discovery disabled
client = CosmosClient(
    endpoint,
    credential=key,
    connection_verify=False,
    consistency_level="Session",
    enable_endpoint_discovery=False
)

# ─────────────────────────────────────────────────────────
# Reference the existing database and container
db = client.get_database_client("DemoDB")
container = db.get_container_client("Products")

# ─────────────────────────────────────────────────────────
# 1) Point Read: retrieve the item with id "1"
item = container.read_item(item="1", partition_key="1")
print("Point Read Result:")
print(item)

# ─────────────────────────────────────────────────────────
# 2) SQL Query: retrieve all items in the container
query = "SELECT * FROM c"
items = list(container.query_items(
    query=query,
    enable_cross_partition_query=True
))

print("\nSQL Query Results:")
for doc in items:
    print(doc)
