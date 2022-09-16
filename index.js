const redis = require("redis");
const db_file = "./db/chinook/chinook.db";
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(db_file, (err) => {
  if (err) {
    return console.log(err.message);
  }
  console.log("Connected to chinook databse.");
});
const client = redis.createClient();
client.on("error", (err) => console.log(err));

const query = "SELECT * from playlist_track";
console.time("Query Time");
client.get(query, (err, value) => {
  if (err) {
    return console.log(err);
  }
  if (value) {
    client.DEL(query);
    console.log(`Redis Cache: ${value.length} records`);
    return console.timeEnd("Query Time");
  } else {
    db.serialize(() => {
      db.all(query, (err, value) => {
        if (err) {
          return console.log(err);
        }
        if (value) {
          console.log(`Sqlite Query: ${value.length} records.`);
          console.timeEnd("Query Time");
        }

        client.set(query, value.length, (err) => {
          if (err) {
            return console.log(err);
          }
          // client.expire(query,20)
        });
        return db.close();
      });
    });
  }
});
