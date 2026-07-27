---
title: "Configuring MongoDB with Homebrew on macOS: Converting a Standalone Instance to a Replica Set"
description: "Convert a standalone MongoDB instance to a replica set on macOS using Homebrew. Covers mongod.conf changes, replication settings, and local verification steps."
publishDate: "2024-04-05T18:33:37.000Z"
tags: ["mongo", "configuration", "homebrew", "mac"]
coverImage:
  alt: "configuring mongodb with homebrew on macos converting a standalone instance to a replica set"
  src: "./cover.webp"
canonicalUrl: "https://towardsdev.com/configuring-mongodb-with-homebrew-on-macos-converting-a-standalone-instance-to-a-replica-set-482623476dcf"
postType: "Tutorial"
---

Setting up a MongoDB replica set in your local environment can be essential for testing and development purposes, especially when you need to mimic a production-like setup. In this guide, we’ll walk through the steps to configure a MongoDB replica set on your local machine.

## Recipe

1. **Modify mongod.conf for Replication**

Open the **mongod.conf** file and add the **replication** key to enable replication.

- Location of **mongod.conf**:
- **/usr/local/etc/mongod.conf** (on Intel processors)
- **/opt/homebrew/etc/mongod.conf** (on [Apple M1 processors](https://support.apple.com/en-us/HT211814))

Add replication:

```yaml title="mongod.conf"
replication:
  replSetName: rs
```

Original Configuration:

```yaml title="mongod.conf (Original)"
systemLog:
  destination: file
  path: /usr/local/var/log/mongodb/mongo.log
  logAppend: true
storage:
  dbPath: /usr/local/var/mongodb
net:
  bindIp: 127.0.0.1
```

Modified Configuration:

```yaml title="mongod.conf (Modified)"
systemLog:
  destination: file
  path: /usr/local/var/log/mongodb/mongo.log
  logAppend: true
storage:
  dbPath: /usr/local/var/mongodb
net:
  bindIp: 127.0.0.1
replication:
  replSetName: rs
```

1. **Restart MongoDB Service**

In the console, restart the MongoDB instance using:

```bash title="terminal"
brew services restart mongodb-community
```

1. **Connect to MongoDB Shell**

In the console, connect to the MongoDB shell using the command:

```bash title="terminal"
mongosh
```

1. **Initialize Replica Set**

Start the replica set with:

```bash title="terminal"
rs.initiate({_id: "rs", members: [{_id: 0, host: "127.0.0.1:27017"}] })
```

1. **Switch to Primary Instance (Optional)**

Change to the primary instance using `rs.status`

1. **Check Replica Set Status**

Verify the status of the replica set using `rs.status()`. If everything is working properly, this command will print a JSON with all the configurations.

1. 🕺 **That’s it!** 😎

## Conclusion

Configuring a MongoDB replica set in your local environment is a crucial step in replicating real-world scenarios for testing and development. By following these simple steps, you can set up a replica set seamlessly and efficiently, enabling you to work with MongoDB in a more versatile and robust manner.

---

[Configuring MongoDB with Homebrew on macOS: Converting a Standalone Instance to a Replica Set](https://towardsdev.com/configuring-mongodb-with-homebrew-on-macos-converting-a-standalone-instance-to-a-replica-set-482623476dcf) was originally published in [Towards Dev](https://towardsdev.com) on Medium, where people are continuing the conversation by highlighting and responding to this story.
