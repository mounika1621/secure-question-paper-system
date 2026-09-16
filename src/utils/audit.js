const supabase = require("../config/supabase");

async function audit(req, action, questionPaperId = null, details = {}) {
  const { error } = await supabase.from("audit_logs").insert({
    user_id: req.user?.id || null,
    action,
    question_paper_id: questionPaperId,
    ip_address: req.ip,
    details
  });

  if (error) console.error("Audit log error:", error.message);
}

module.exports = audit;