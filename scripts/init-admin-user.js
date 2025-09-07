const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// User schema (copied from the model file)
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['ADMIN', 'DATA_ENTRY', 'SUBSCRIBER', 'USER'],
    required: true,
    default: 'USER',
    index: true
  },
  permissions: [{
    type: String,
    enum: [
      'VIEW_DASHBOARD',
      'ENTER_MF_DATA',
      'VERIFY_MF_DATA', 
      'EDIT_MF_DATA',
      'DELETE_MF_DATA',
      'MANAGE_USERS',
      'VIEW_ANALYTICS',
      'EXPORT_DATA'
    ]
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastLogin: Date,
  createdBy: String,
  
  // Profile Information
  phone: String,
  department: String,
  
  // Activity Tracking
  totalMfDataEntered: { type: Number, default: 0 },
  totalMfDataVerified: { type: Number, default: 0 },
  lastActivity: Date
}, {
  timestamps: true
});

// Pre-save hook to set permissions based on role
UserSchema.pre('save', function(next) {
  if (this.isModified('role')) {
    switch (this.role) {
      case 'ADMIN':
        this.permissions = [
          'VIEW_DASHBOARD',
          'ENTER_MF_DATA',
          'VERIFY_MF_DATA',
          'EDIT_MF_DATA',
          'DELETE_MF_DATA',
          'MANAGE_USERS',
          'VIEW_ANALYTICS',
          'EXPORT_DATA'
        ];
        break;
      case 'DATA_ENTRY':
        this.permissions = [
          'VIEW_DASHBOARD',
          'ENTER_MF_DATA',
          'EDIT_MF_DATA',
          'VIEW_ANALYTICS'
        ];
        break;
      case 'SUBSCRIBER':
        this.permissions = [
          'VIEW_DASHBOARD',
          'VIEW_ANALYTICS'
        ];
        break;
      case 'USER':
        this.permissions = [];
        break;
    }
  }
  next();
});

const User = mongoose.model('User', UserSchema);

async function initializeAdminUser() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    const mongoUrl = process.env.MONGODB_CONNECTION_URI || 'mongodb://localhost:27017/mutual-funds';
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'vinay.qss@gmail.com' });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
      
      // Update the user to ensure they have admin role and permissions
      existingAdmin.role = 'ADMIN';
      existingAdmin.name = 'Vinay QSS';
      existingAdmin.password = '654321'; // Plain text as specified in login API
      existingAdmin.isActive = true;
      existingAdmin.department = 'Administration';
      
      await existingAdmin.save();
      console.log('✅ Admin user updated successfully');
      
      console.log('\n📋 Admin User Details:');
      console.log('Email:', existingAdmin.email);
      console.log('Name:', existingAdmin.name);
      console.log('Role:', existingAdmin.role);
      console.log('Permissions:', existingAdmin.permissions);
      console.log('Active:', existingAdmin.isActive);
    } else {
      // Create new admin user
      const adminUser = new User({
        email: 'vinay.qss@gmail.com',
        password: '654321', // Plain text as specified in login API
        name: 'Vinay QSS',
        role: 'ADMIN',
        isActive: true,
        department: 'Administration',
        createdBy: 'system'
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully');
      
      console.log('\n📋 Admin User Details:');
      console.log('Email:', adminUser.email);
      console.log('Name:', adminUser.name);
      console.log('Role:', adminUser.role);
      console.log('Permissions:', adminUser.permissions);
      console.log('Active:', adminUser.isActive);
    }
    
    console.log('\n🎯 You can now login at /admin/login with:');
    console.log('Email: vinay.qss@gmail.com');
    console.log('Password: 654321');

  } catch (error) {
    console.error('❌ Error initializing admin user:', error);
    
    if (error.code === 11000) {
      console.error('   → Duplicate email error');
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the initialization
initializeAdminUser();