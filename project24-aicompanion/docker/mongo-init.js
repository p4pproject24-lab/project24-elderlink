// MongoDB initialization script
db = db.getSiblingDB('ai-companion');

// Create collections
db.createCollection('users');
db.createCollection('messages');
db.createCollection('reminders');
db.createCollection('locations');
db.createCollection('dailySummaries');
db.createCollection('connections');
db.createCollection('gameMessages');
db.createCollection('gameSessions');

// Create indexes for better performance
db.users.createIndex({ "firebaseUid": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "phoneNumber": 1 }, { unique: true });

db.messages.createIndex({ "userId": 1, "timestamp": -1 });
db.reminders.createIndex({ "userId": 1, "dueDate": 1 });
db.locations.createIndex({ "userId": 1, "timestamp": -1 });
db.dailySummaries.createIndex({ "userId": 1, "date": -1 });
db.connections.createIndex({ "elderlyUserId": 1, "caregiverUserId": 1 });

print('Database initialized successfully');
