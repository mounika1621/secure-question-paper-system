const router = require("express").Router();
const bcrypt = require("bcryptjs");
const supabase = require("../config/supabase");
const { requireAuth, requireRole } = require("../middleware/auth");

router.post("/users", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;
    if (!full_name || !email || !password || !["setter","reviewer","admin","controller"].includes(role)) {
      return res.status(400).json({ error: "Invalid user details" });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const { data, error } = await supabase
      .from("users")
      .insert({
        full_name,
        email: email.toLowerCase().trim(),
        password_hash,
        role
      })
      .select("id,full_name,email,role,created_at")
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Could not create user" });
  }
});

router.get("/audit-logs", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not load audit logs" });
  }
});

module.exports = router;