import { getDb } from '../server/db.ts';
import { users } from '../drizzle/schema.ts';

async function addUsers() {
  try {
    console.log('Connecting to database...');
    const db = await getDb();
    
    if (!db) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }

    console.log('✅ Connected to database');
    console.log('Adding users...');

    // إضافة المعلمين والطالب
    await db.insert(users).values([
      {
        openId: 'teacher_001',
        email: 'teacher@example.com',
        name: 'أحمد محمود',
        loginMethod: 'email',
        role: 'admin',
        lastSignedIn: new Date(),
      },
      {
        openId: 'teacher_002',
        email: 'teacher2@example.com',
        name: 'فاطمة علي',
        loginMethod: 'email',
        role: 'admin',
        lastSignedIn: new Date(),
      },
      {
        openId: 'student_001',
        email: 'student@example.com',
        name: 'محمد أحمد',
        loginMethod: 'email',
        role: 'user',
        lastSignedIn: new Date(),
      },
    ]);

    console.log('✅ Users added successfully!');
    console.log('\n📋 Test Accounts:');
    console.log('👨‍🏫 Teacher: teacher@example.com / password123');
    console.log('👨‍🏫 Teacher 2: teacher2@example.com / password123');
    console.log('👨‍🎓 Student: student@example.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addUsers();
