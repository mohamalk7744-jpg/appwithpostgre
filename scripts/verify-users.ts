import "dotenv/config";
import { getDb } from "../server/db";
import { users } from "../drizzle/schema";

async function main() {
  console.log("Verifying users in database...");
  
  try {
    const db = await getDb();
    if (!db) {
      console.error("Failed to initialize database connection.");
      process.exit(1);
    }

    const allUsers = await db.select().from(users);
    console.log("Total users in database:", allUsers.length);
    
    console.table(allUsers.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      openId: u.openId
    })));

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
