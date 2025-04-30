PS C:\Users\ashfa> docker exec -it mongo_local_standard mongosh -u admin -p admin123 --authenticationDatabase admin
Current Mongosh Log ID: 680fab21c036180936964032
Connecting to:          mongodb://<credentials>@127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&authSource=admin&appName=mongosh+2.3.1
Using MongoDB:          8.0.0
Using Mongosh:          2.3.1

For mongosh info see: https://www.mongodb.com/docs/mongodb-shell/

------
   The server generated these startup warnings when booting
   2025-04-28T16:13:21.052+00:00: Using the XFS filesystem is strongly recommended with the WiredTiger storage engine. See http://dochub.mongodb.org/core/prodnotes-filesystem
   2025-04-28T16:13:22.771+00:00: For customers running the updated tcmalloc-google memory allocator, we suggest setting the contents of sysfsFile to 'defer+madvise'
   2025-04-28T16:13:22.771+00:00: We suggest setting the contents of sysfsFile to 0.
   2025-04-28T16:13:22.771+00:00: Your system has glibc support for rseq built in, which is not yet supported by tcmalloc-google and has critical performance implications. Please set the environment variable GLIBC_TUNABLES=glibc.pthread.rseq=0
   2025-04-28T16:13:22.771+00:00: vm.max_map_count is too low
   2025-04-28T16:13:22.772+00:00: We suggest setting swappiness to 0 or 1, as swapping can cause performance problems.
------

test> db
test
test> use mymongodb
switched to db mymongodb
mymongodb> db.createCollection("users")
{ ok: 1 }
mymongodb> db.users.insertOne({ name: "Ashfaq", role: "Admin" })
{
  acknowledged: true,
  insertedId: ObjectId('680fab65c036180936964033')
}
mymongodb>



In UI

![alt text](/Mongo/images/image.png)