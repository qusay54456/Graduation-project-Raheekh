import bcrypt from "bcrypt";
import { sqlite } from "./index";

console.log("Seeding database...");

sqlite.exec(`
  DELETE FROM reservations;
  DELETE FROM spots;
  DELETE FROM parking_lots;
  DELETE FROM users;
  DELETE FROM sqlite_sequence WHERE name IN ('users','parking_lots','spots','reservations');
`);

const supervisorHash = await bcrypt.hash("supervisor123", 10);
const userHash = await bcrypt.hash("user123", 10);

const insertUser = sqlite.prepare(
  "INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)"
);
insertUser.run(1, "محمد سليمان", "supervisor@parknow.ps", supervisorHash, "supervisor");
insertUser.run(2, "أحمد الخطيب", "user@parknow.ps", userHash, "user");

const lots = [
  { id: 1, name: "موقف المنارة المركزي", location: "رام الله - دوار المنارة", lat: 31.9038, lng: 35.2034, pricePerHour: 5 },
  { id: 2, name: "موقف البيرة الرئيسي", location: "البيرة - شارع الاستقلال", lat: 31.9122, lng: 35.2157, pricePerHour: 4 },
  { id: 3, name: "موقف المدينة التجاري", location: "رام الله - شارع الإرسال", lat: 31.8975, lng: 35.1978, pricePerHour: 7 },
];

const insertLot = sqlite.prepare(
  "INSERT INTO parking_lots (id, owner_id, name, location, total_spots, lat, lng, price_per_hour, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)"
);
const insertSpot = sqlite.prepare(
  "INSERT INTO spots (lot_id, spot_number, status) VALUES (?, ?, 'available')"
);

for (const lot of lots) {
  insertLot.run(lot.id, 1, lot.name, lot.location, 5, lot.lat, lot.lng, lot.pricePerHour);
  for (let i = 1; i <= 5; i++) {
    insertSpot.run(lot.id, `A${i}`);
  }
}

const userCount = (sqlite.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number }).c;
const lotCount = (sqlite.prepare("SELECT COUNT(*) as c FROM parking_lots").get() as { c: number }).c;
const spotCount = (sqlite.prepare("SELECT COUNT(*) as c FROM spots").get() as { c: number }).c;

console.log("Seed complete:");
console.log(`  Users: ${userCount}`);
console.log(`  Lots: ${lotCount}`);
console.log(`  Spots: ${spotCount}`);
console.log("");
console.log("Test accounts:");
console.log("  supervisor@parknow.ps / supervisor123");
console.log("  user@parknow.ps / user123");

sqlite.close();
