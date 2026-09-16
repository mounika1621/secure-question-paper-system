const router = require("express").Router();
const multer = require("multer");
const supabase = require("../config/supabase");
const { requireAuth, requireRole } = require("../middleware/auth");
const { encryptBuffer, decryptBuffer, sha256 } = require("../utils/security");
const audit = require("../utils/audit");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only PDF or DOCX files are allowed"));
    }
    cb(null, true);
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("question_papers")
      .select("id,title,subject,file_name,file_size,sha256_hash,status,exam_date,uploaded_by,approved_by,approved_at,released_at,created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not load question papers" });
  }
});

router.post(
  "/upload",
  requireAuth,
  requireRole("setter", "admin"),
  upload.single("paper"),
  async (req, res) => {
    try {
      const { title, subject, exam_date } = req.body;

      if (!req.file || !title || !exam_date) {
        return res.status(400).json({ error: "Title, exam date and paper file are required" });
      }

      const originalHash = sha256(req.file.buffer);
      const encrypted = encryptBuffer(req.file.buffer);
      const storagePath = `${Date.now()}-${req.user.id}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}.enc`;

      const { error: uploadError } = await supabase.storage
        .from("question-papers")
        .upload(storagePath, encrypted, {
          contentType: "application/octet-stream",
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from("question_papers")
        .insert({
          title,
          subject: subject || null,
          encrypted_file_path: storagePath,
          file_name: req.file.originalname,
          file_size: req.file.size,
          sha256_hash: originalHash,
          status: "PENDING_REVIEW",
          exam_date,
          uploaded_by: req.user.id
        })
        .select()
        .single();

      if (error) throw error;

      await audit(req, "QUESTION_PAPER_UPLOADED", data.id, {
        title,
        hash: originalHash
      });

      res.status(201).json({
        message: "Question paper encrypted and uploaded successfully",
        paper: data
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message || "Upload failed" });
    }
  }
);

router.post(
  "/:id/approve",
  requireAuth,
  requireRole("reviewer", "admin"),
  async (req, res) => {
    try {
      const { data: paper, error: findError } = await supabase
        .from("question_papers")
        .select("*")
        .eq("id", req.params.id)
        .single();

      if (findError) throw findError;

      if (paper.status !== "PENDING_REVIEW") {
        return res.status(400).json({ error: "Only pending papers can be approved" });
      }

      const { data, error } = await supabase
        .from("question_papers")
        .update({
          status: "APPROVED",
          approved_by: req.user.id,
          approved_at: new Date().toISOString()
        })
        .eq("id", paper.id)
        .select()
        .single();

      if (error) throw error;

      await audit(req, "QUESTION_PAPER_APPROVED", paper.id);
      res.json({ message: "Question paper approved", paper: data });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Approval failed" });
    }
  }
);

router.post(
  "/:id/reject",
  requireAuth,
  requireRole("reviewer", "admin"),
  async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("question_papers")
        .update({ status: "REJECTED" })
        .eq("id", req.params.id)
        .select()
        .single();

      if (error) throw error;

      await audit(req, "QUESTION_PAPER_REJECTED", req.params.id);
      res.json({ message: "Question paper rejected", paper: data });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Rejection failed" });
    }
  }
);

router.get(
  "/:id/download",
  requireAuth,
  requireRole("controller", "admin"),
  async (req, res) => {
    try {
      const { data: paper, error } = await supabase
        .from("question_papers")
        .select("*")
        .eq("id", req.params.id)
        .single();

      if (error) throw error;

      if (paper.status !== "APPROVED" && paper.status !== "RELEASED") {
        return res.status(403).json({ error: "Question paper is not approved" });
      }

      const examTime = new Date(paper.exam_date).getTime();
      if (Date.now() < examTime) {
        return res.status(403).json({ error: "Question paper is locked until the examination date and time" });
      }

      const { data: encrypted, error: downloadError } = await supabase.storage
        .from("question-papers")
        .download(paper.encrypted_file_path);

      if (downloadError) throw downloadError;

      const encryptedBuffer = Buffer.from(await encrypted.arrayBuffer());
      const plain = decryptBuffer(encryptedBuffer);

      // Integrity verification before release
      if (sha256(plain) !== paper.sha256_hash) {
        await audit(req, "INTEGRITY_CHECK_FAILED", paper.id);
        return res.status(409).json({ error: "Integrity verification failed" });
      }

      await supabase
        .from("question_papers")
        .update({
          status: "RELEASED",
          released_at: new Date().toISOString()
        })
        .eq("id", paper.id);

      await audit(req, "QUESTION_PAPER_RELEASED", paper.id);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${paper.file_name}"`);
      res.send(plain);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Release failed" });
    }
  }
);

module.exports = router;