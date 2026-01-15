# Firebase / Firestore seeding

## Install deps
npm i firebase-admin dotenv

## Setup env
Copy data/.env.example -> .env and fill values.

## Service account
Firebase Console → Project settings → Service accounts → Generate new private key
Save as: data/serviceAccountKey.json

## Run seed
node ./data/seed-firestore.mjs
