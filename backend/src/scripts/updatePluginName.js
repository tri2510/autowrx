/**
 * Migration script to update plugin name from "Vehicle Edge Runtime" to "Deployment"
 *
 * Usage:
 *   node src/scripts/updatePluginName.js
 */

const mongoose = require('mongoose');

// Get MongoDB connection string from environment or use default
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/autowrx';

async function updatePluginName() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URL);
    console.log('Connected to MongoDB');

    const Plugin = mongoose.model('Plugin', new mongoose.Schema({
      name: String,
      slug: String,
    }, { collection: 'plugins' }));

    // Update plugin name
    const result = await Plugin.updateOne(
      { slug: 'vehicle-edge-runtime' },
      { $set: { name: 'Deployment' } }
    );

    if (result.matchedCount === 0) {
      console.log('⚠️  No plugin found with slug "vehicle-edge-runtime"');
      console.log('Available plugins:');
      const plugins = await Plugin.find({}, { name: 1, slug: 1 });
      plugins.forEach(p => console.log(`  - ${p.name} (${p.slug})`));
    } else if (result.modifiedCount === 0) {
      console.log('ℹ️  Plugin name already set to "Deployment"');
    } else {
      console.log('✅ Successfully updated plugin name from "Vehicle Edge Runtime" to "Deployment"');
    }

  } catch (error) {
    console.error('❌ Error updating plugin name:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updatePluginName();
