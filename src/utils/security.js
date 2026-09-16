const crypto = require("crypto");

function encryptBuffer(buffer) {
  const iv = crypto.randomBytes(12);
  const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");

  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be exactly 64 hexadecimal characters");
  }

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Stored object = IV + authentication tag + ciphertext
  return Buffer.concat([iv, tag, ciphertext]);
}

function decryptBuffer(stored) {
  const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
  const iv = stored.subarray(0, 12);
  const tag = stored.subarray(12, 28);
  const ciphertext = stored.subarray(28);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function generateEncryptionKey() {
  return crypto.randomBytes(32).toString("hex");
}

module.exports = { encryptBuffer, decryptBuffer, sha256, generateEncryptionKey };