import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Script to clean up the database index issue
async function cleanupDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('signs');

    // Remove all documents with null word field
    const deleteResult = await collection.deleteMany({ word: null });
    console.log(`Deleted ${deleteResult.deletedCount} documents with null word field`);

    // Remove duplicate documents if any
    const duplicates = await collection.aggregate([
      { $group: { _id: "$word", count: { $sum: 1 }, docs: { $push: "$_id" } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    for (let duplicate of duplicates) {
      // Keep the first document, delete the rest
      const docsToDelete = duplicate.docs.slice(1);
      await collection.deleteMany({ _id: { $in: docsToDelete } });
      console.log(`Removed ${docsToDelete.length} duplicate(s) for word: ${duplicate._id}`);
    }

    console.log('Database cleanup completed');
    process.exit(0);
  } catch (error) {
    console.error('Database cleanup failed:', error);
    process.exit(1);
  }
}

cleanupDatabase();
