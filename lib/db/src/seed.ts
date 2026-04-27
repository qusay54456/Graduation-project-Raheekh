import bcrypt from "bcrypt";
import { sqlite } from "./index";

console.log("Seeding database...");

sqlite.exec(`
  DELETE FROM ratings;
  DELETE FROM reservations;
  DELETE FROM spots;
  DELETE FROM parking_lots;
  DELETE FROM password_reset_codes;
  DELETE FROM users;
  DELETE FROM sqlite_sequence WHERE name IN ('users','parking_lots','spots','reservations','ratings','password_reset_codes');
`);

const supervisorHash = await bcrypt.hash("supervisor123", 10);
const userHash = await bcrypt.hash("user123", 10);

const insertUser = sqlite.prepare(
  "INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)"
);
insertUser.run(1, "محمد سليمان", "supervisor@parknow.ps", supervisorHash, "supervisor");
insertUser.run(2, "أحمد الخطيب", "user@parknow.ps", userHash, "user");

type LotSeed = {
  name: string;
  location: string;
  lat: number;
  lng: number;
  pricePerHour: number;
  spots: number;
};

const lots: LotSeed[] = [
  // رام الله (Ramallah) — 6 lots (3 original + 3 new)
  { name: "موقف المنارة المركزي", location: "رام الله - دوار المنارة", lat: 31.9038, lng: 35.2034, pricePerHour: 5, spots: 16 },
  { name: "موقف البيرة الرئيسي", location: "البيرة - شارع الاستقلال", lat: 31.9122, lng: 35.2157, pricePerHour: 4, spots: 14 },
  { name: "موقف المدينة التجاري", location: "رام الله - شارع الإرسال", lat: 31.8975, lng: 35.1978, pricePerHour: 7, spots: 20 },
  { name: "موقف الإرسال السياحي", location: "رام الله - شارع الإرسال السفلي", lat: 31.8965, lng: 35.1963, pricePerHour: 6, spots: 12 },
  { name: "موقف رام الله التحتا", location: "رام الله - الطاحونة", lat: 31.9156, lng: 35.2089, pricePerHour: 4, spots: 15 },
  { name: "موقف الطيرة", location: "رام الله - حي الطيرة", lat: 31.8842, lng: 35.1854, pricePerHour: 5, spots: 10 },

  // نابلس (Nablus) — 3 lots
  { name: "موقف دوار الشهداء", location: "نابلس - دوار الشهداء", lat: 32.2211, lng: 35.2544, pricePerHour: 6, spots: 18 },
  { name: "موقف رفيديا", location: "نابلس - حي رفيديا", lat: 32.2243, lng: 35.2399, pricePerHour: 5, spots: 14 },
  { name: "موقف البلدة القديمة", location: "نابلس - البلدة القديمة", lat: 32.2208, lng: 35.2602, pricePerHour: 4, spots: 12 },

  // الخليل (Hebron) — 3 lots
  { name: "موقف وسط البلد", location: "الخليل - وسط المدينة", lat: 31.5326, lng: 35.0998, pricePerHour: 5, spots: 16 },
  { name: "موقف باب الزاوية", location: "الخليل - باب الزاوية", lat: 31.5294, lng: 35.0950, pricePerHour: 6, spots: 13 },
  { name: "موقف عين سارة", location: "الخليل - شارع عين سارة", lat: 31.5398, lng: 35.1027, pricePerHour: 4, spots: 11 },

  // بيت لحم (Bethlehem) — 3 lots
  { name: "موقف ساحة المهد", location: "بيت لحم - ساحة المهد", lat: 31.7044, lng: 35.2056, pricePerHour: 8, spots: 20 },
  { name: "موقف باب زقاق", location: "بيت لحم - باب زقاق", lat: 31.7081, lng: 35.1997, pricePerHour: 6, spots: 14 },
  { name: "موقف بيت ساحور", location: "بيت ساحور - الشارع الرئيسي", lat: 31.7020, lng: 35.2158, pricePerHour: 4, spots: 12 },

  // جنين (Jenin) — 2 lots
  { name: "موقف مركز المدينة", location: "جنين - وسط المدينة", lat: 32.4602, lng: 35.2950, pricePerHour: 4, spots: 14 },
  { name: "موقف السوق التجاري", location: "جنين - السوق التجاري", lat: 32.4581, lng: 35.2986, pricePerHour: 3, spots: 10 },

  // طولكرم (Tulkarm) — 2 lots
  { name: "موقف وسط طولكرم", location: "طولكرم - وسط المدينة", lat: 32.3104, lng: 35.0237, pricePerHour: 4, spots: 12 },
  { name: "موقف شارع نابلس", location: "طولكرم - شارع نابلس", lat: 32.3128, lng: 35.0294, pricePerHour: 3, spots: 10 },

  // قلقيلية (Qalqilya) — 2 lots
  { name: "موقف البلدة", location: "قلقيلية - البلدة القديمة", lat: 32.1896, lng: 34.9706, pricePerHour: 3, spots: 11 },
  { name: "موقف السوق المركزي", location: "قلقيلية - السوق المركزي", lat: 32.1922, lng: 34.9728, pricePerHour: 4, spots: 13 },

  // أريحا (Jericho) — 2 lots
  { name: "موقف المدينة السياحي", location: "أريحا - وسط المدينة", lat: 31.8568, lng: 35.4567, pricePerHour: 7, spots: 18 },
  { name: "موقف عين السلطان", location: "أريحا - عين السلطان", lat: 31.8714, lng: 35.4445, pricePerHour: 6, spots: 14 },

  // سلفيت (Salfit) — 1 lot
  { name: "موقف وسط سلفيت", location: "سلفيت - وسط المدينة", lat: 32.0833, lng: 35.1782, pricePerHour: 3, spots: 10 },

  // طوباس (Tubas) — 1 lot
  { name: "موقف طوباس المركزي", location: "طوباس - وسط المدينة", lat: 32.3214, lng: 35.3691, pricePerHour: 3, spots: 10 },
];

const insertLot = sqlite.prepare(
  "INSERT INTO parking_lots (id, owner_id, name, location, total_spots, lat, lng, price_per_hour, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)"
);
const insertSpot = sqlite.prepare(
  "INSERT INTO spots (lot_id, spot_number, status) VALUES (?, ?, 'available')"
);

lots.forEach((lot, idx) => {
  const lotId = idx + 1;
  insertLot.run(lotId, 1, lot.name, lot.location, lot.spots, lot.lat, lot.lng, lot.pricePerHour);
  for (let i = 1; i <= lot.spots; i++) {
    insertSpot.run(lotId, `A${i}`);
  }
});

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
