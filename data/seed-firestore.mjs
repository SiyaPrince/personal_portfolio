/**
 * Seed Firestore from ./data/projects.seed.json
 *
 * Usage:
 *  1) npm i firebase-admin dotenv
 *  2) copy data/.env.example -> .env and fill values
 *  3) put serviceAccountKey.json at ./data/serviceAccountKey.json
 *  4) node ./data/seed-firestore.mjs
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import "dotenv/config";

import admin from "firebase-admin";

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!PROJECT_ID) {
  console.error("Missing FIREBASE_PROJECT_ID in .env");
  process.exit(1);
}
if (!CREDENTIALS_PATH) {
  console.error("Missing GOOGLE_APPLICATION_CREDENTIALS in .env");
  process.exit(1);
}

const absoluteCredPath = path.resolve(CREDENTIALS_PATH);
if (!fs.existsSync(absoluteCredPath)) {
  console.error(`Service account key not found at: ${absoluteCredPath}`);
  process.exit(1);
}

const seedPath = path.resolve("./data/projects.seed.json");
if (!fs.existsSync(seedPath)) {
  console.error(`Seed file not found at: ${seedPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(seedPath, "utf-8");
let projects;
try {
  projects = JSON.parse(raw);
  if (!Array.isArray(projects)) throw new Error("Seed JSON must be an array.");
} catch (e) {
  console.error("Invalid JSON in projects.seed.json:", e);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(absoluteCredPath, "utf-8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: PROJECT_ID
  });
}

const db = admin.firestore();

const toTimestamp = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : admin.firestore.Timestamp.fromDate(d);
};

const normalizeProject = (p) => {
  const title = String(p.title ?? "").trim();
  if (!title) return null;

  const tags = Array.isArray(p.tags) ? p.tags.map(String) : [];
  const featured = Boolean(p.featured);

  return {
    title,
    description: String(p.description ?? "").trim(),
    category: String(p.category ?? "Other").trim(),
    status: String(p.status ?? "Unknown").trim(),
    tags,
    featured,
    repoUrl: p.repoUrl ? String(p.repoUrl) : "",
    liveUrl: p.liveUrl ? String(p.liveUrl) : "",
    thumbnail: p.thumbnail ? String(p.thumbnail) : "",
    sortOrder: Number.isFinite(Number(p.sortOrder)) ? Number(p.sortOrder) : 0,
    publishedAt: toTimestamp(p.publishedAt),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
};

console.log(`Seeding ${projects.length} projects into Firestore collection: projects`);

let added = 0;
let skipped = 0;

for (const p of projects) {
  const normalized = normalizeProject(p);
  if (!normalized) {
    skipped++;
    continue;
  }

  // Use a stable doc id derived from title (simple slug)
  const slug = normalized.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);

  await db.collection("projects").doc(slug).set(normalized, { merge: true });
  added++;
}

console.log(`Done. Added/updated: ${added}, skipped: ${skipped}`);
