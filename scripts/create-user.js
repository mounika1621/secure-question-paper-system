require("dotenv").config();
const bcrypt = require("bcryptjs");
const supabase = require("../src/config/supabase");

async function main() {
  const [full_name, email, password, role] = process.argv.slice(2);

  if (!full_name || !email || !password || !["setter","reviewer","admin","controller"].includes(role)) {
    console.log('Usage: node scripts/create-user.js "Name" email password role');
    console.log("Roles: setter | reviewer | admin | controller");
    process.exit(1);
  }

  const password_hash = await bcrypt.hash(password, 12);
  const { data, error } = await supabase
    .from("users")
    .insert({ full_name, email: email.toLowerCase(), password_hash, role })
    .select("id,full_name,email,role")
    .single();

  if (error) throw error;
  console.log("Created user:", data);
}

main().catch(e => {
  console.error(e.message);
  process.exit(1);
});