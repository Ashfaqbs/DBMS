To access your MongoDB container via the terminal and perform basic operations, follow these steps:

## Accessing the MongoDB Container

1. **Open the Terminal**: Start by opening your terminal.

2. **Use Docker Exec Command**: To access the terminal of your running MongoDB container, execute the following command:
   ```bash
    docker exec -it e9a416d7d199 bash
   ```
   Here, `e9a416d7d199` is your container ID. This command opens an interactive bash shell inside the container[1][2].

3. **Start MongoDB Shell**: Once inside the container, you can start the MongoDB shell by typing:
   ```bash
   mongosh
   ```
   If you are using a newer version of MongoDB, you may need to use `mongosh` instead[3][4].

## Performing Basic Operations

Once you are in the MongoDB shell, you can perform various operations:

1. **Create a Database**: To create or switch to a database named "food", use:
   ```javascript
   use food
   ```

2. **Create a Collection**: To create a collection named "fruits", run:
   ```javascript
   db.createCollection("fruits")
   ```

3. **Insert Documents**: You can insert documents into the "fruits" collection with:
   ```javascript
   db.fruits.insertMany([
       { name: "apple", origin: "usa", price: 5 },
       { name: "orange", origin: "italy", price: 3 },
       { name: "mango", origin: "malaysia", price: 3 }
   ])
   ```

4. **Query Documents**: To retrieve and display all documents in the "fruits" collection, use:
   ```javascript
   db.fruits.find().pretty()
   ```

5. **Exit the Shell**: When you're done, you can exit both the MongoDB shell and the container shell by typing:
   ```bash
   exit
   ```

## Summary of Commands

| Operation                  | Command                                                                                      |
|----------------------------|----------------------------------------------------------------------------------------------|
| Access Container            | `sudo docker exec -it e9a416d7d199 bash`                                                   |
| Start MongoDB Shell        | `mongo` or `mongosh`                                                                        |
| Create/Switch Database     | `use food`                                                                                   |
| Create Collection           | `db.createCollection("fruits")`                                                             |
| Insert Documents            | `db.fruits.insertMany([...])`                                                               |
| Query Documents             | `db.fruits.find().pretty()`                                                                  |
| Exit                       | `exit`                                                                                       |

- Verifying from MongoDB compass GUI :

![alt text](image-4.png)

![alt text](image-5.png)

By following these steps, you can effectively manage your MongoDB instance running in a Docker container directly from your terminal.

Citations:
[1] https://www.bmc.com/blogs/mongodb-docker-container/
[2] https://earthly.dev/blog/mongodb-docker/
[3] https://stackoverflow.com/questions/32944729/how-to-start-a-mongodb-shell-in-docker-container
[4] https://forums.docker.com/t/how-mongodb-work-in-docker-how-to-connect-with-mongodb/44763
[5] https://tsmx.net/docker-local-mongodb/
[6] https://www.geeksforgeeks.org/how-to-run-mongodb-as-a-docker-container/