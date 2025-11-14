/**
 * Seed Mock Content for Testing
 * Creates mock videos with valid MongoDB ObjectIds for Flutter app testing
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Define Content Schema (matching backend model)
const contentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['video', 'image', 'text', 'live'], default: 'video' },
  caption: { type: String, maxlength: 2200 },
  videoUrl: String,
  thumbnailUrl: String,
  duration: Number,
  hashtags: [{ type: String, lowercase: true }],
  status: { type: String, enum: ['draft', 'processing', 'active', 'removed', 'reported', 'archived'], default: 'active' },
  isPrivate: { type: Boolean, default: false },
  allowComments: { type: Boolean, default: true },
  allowDuet: { type: Boolean, default: true },
  allowStitch: { type: Boolean, default: true },
  allowDownload: { type: Boolean, default: true },
  viewsCount: { type: Number, default: 0 },
  likesCount: { type: Number, default: 0 },
  sharesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 }
}, { timestamps: true });

const Content = mongoose.model('Content', contentSchema);

// Get or create test user
const getTestUser = async () => {
  const User = mongoose.model('User', new mongoose.Schema({ username: String }));
  let user = await User.findOne({ username: 'testuser1' });
  if (!user) {
    user = await User.create({
      username: 'testuser1',
      email: 'testuser1@mixillo.com'
    });
  }
  return user;
};

// Mock content data
const getMockContent = (userId) => [
  {
    userId,
    type: 'video',
    caption: '🎉 Welcome to Mixillo! Check out this amazing dance trend',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    duration: 596,
    hashtags: ['dance', 'trending', 'fun'],
    status: 'active',
    isPrivate: false,
    allowComments: true,
    allowDuet: true,
    allowStitch: true,
    allowDownload: true,
    viewsCount: 12534,
    likesCount: 892,
    sharesCount: 45,
    commentsCount: 123
  },
  {
    userId,
    type: 'video',
    caption: '😂 Funny pet moments compilation',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnailUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg',
    duration: 653,
    hashtags: ['pets', 'funny', 'animals'],
    status: 'active',
    isPrivate: false,
    allowComments: true,
    viewsCount: 8765,
    likesCount: 654,
    sharesCount: 32,
    commentsCount: 87
  },
  {
    userId,
    type: 'video',
    caption: '🎵 Latest music video drop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
    duration: 15,
    hashtags: ['music', 'newrelease', 'viral'],
    status: 'active',
    isPrivate: false,
    viewsCount: 15432,
    likesCount: 1234,
    sharesCount: 67,
    commentsCount: 234
  },
  {
    userId,
    type: 'video',
    caption: '🍔 Delicious food recipe tutorial',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg',
    duration: 15,
    hashtags: ['food', 'cooking', 'recipe'],
    status: 'active',
    viewsCount: 9876,
    likesCount: 543,
    sharesCount: 28,
    commentsCount: 156
  },
  {
    userId,
    type: 'video',
    caption: '💪 Fitness motivation and workout tips',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumbnailUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg',
    duration: 60,
    hashtags: ['fitness', 'workout', 'health'],
    status: 'active',
    viewsCount: 11234,
    likesCount: 789,
    sharesCount: 41,
    commentsCount: 98
  }
];

// Seed function
const seedContent = async () => {
  try {
    await connectDB();

    // Get or create test user
    console.log('👤 Getting test user...');
    const testUser = await getTestUser();
    console.log(`✅ Using user: ${testUser._id}`);

    // Get mock content with userId
    const mockContent = getMockContent(testUser._id);

    // Clear existing mock content
    console.log('🗑️  Clearing existing mock content...');
    await Content.deleteMany({ userId: testUser._id });

    // Insert mock content
    console.log('📦 Inserting mock content...');
    const inserted = await Content.insertMany(mockContent);

    console.log(`\n✅ Successfully seeded ${inserted.length} mock videos:`);
    inserted.forEach((content, index) => {
      console.log(`   ${index + 1}. ${content.caption.substring(0, 50)}...`);
      console.log(`      _id: ${content._id}`);
      console.log(`      API: GET /api/content/${content._id}`);
      console.log(`      View: POST /api/content/${content._id}/view`);
    });

    console.log('\n📝 Use these ObjectIds in your Flutter app for testing\n');

  } catch (error) {
    console.error('❌ Seed Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
};

// Run seeder
seedContent();
