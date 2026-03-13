const { DatabaseSync } = require('node:sqlite');
try {
  const db = new DatabaseSync('test.db');
  db.exec('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)');
  const insert = db.prepare('INSERT INTO test (name) VALUES (?)');
  const res = insert.run('John');
  console.log('Insert:', res);
  const select = db.prepare('SELECT * FROM test');
  console.log('Select:', select.all());
  console.log('Success!');
} catch(e) {
  console.error('Error:', e);
}
