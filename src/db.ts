import Database from "better-sqlite3";
import * as path from "path";
import * as fs from "fs";

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), "hermes.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
  }
  return _db;
}

export function initDb(): void {
  const db = getDb();

  // Knowledge base — primary alchemical/herbal texts
  db.exec(`
    CREATE TABLE IF NOT EXISTS texts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author TEXT NOT NULL,
      work TEXT NOT NULL,
      year TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      keywords TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      deliver_at TEXT NOT NULL,
      delivered INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  seedKnowledgeBase(db);
}

function seedKnowledgeBase(db: Database.Database): void {
  const count = (db.prepare("SELECT COUNT(*) as n FROM texts").get() as { n: number }).n;
  if (count > 0) return;

  const texts = [
    {
      author: "Paracelsus",
      work: "Archidoxis Magica",
      year: "1570",
      category: "alchemy",
      content: `The three primes (tria prima) are the foundation of all matter: Sulphur (the soul, the principle of combustibility), Mercury (the spirit, the principle of fluidity and volatility), and Salt (the body, the principle of solidity). All metals and substances are composed of these three principles in varying proportions and purities. The Great Work (Magnum Opus) proceeds through stages: nigredo (blackening, putrefaction), albedo (whitening, purification), citrinitas (yellowing), and rubedo (reddening, perfection). The Philosopher's Stone is not a mere stone but the perfected principle capable of transmuting base metals into gold and healing all diseases. Every herb and mineral carries a signature (signatura) that reveals its healing virtue to the trained eye — the walnut resembles the brain and cures head ailments; the eyebright heals the eye; yellow plants treat jaundice of the liver. The macrocosm is reflected in the microcosm of man. To know the stars is to know the body, for each planet governs an organ: Saturn rules the spleen, Jupiter the liver, Mars the gall bladder, Sun the heart, Venus the kidneys, Mercury the lungs, and Moon the brain.`,
      keywords: "tria prima, sulphur mercury salt, philosopher stone, transmutation, nigredo albedo rubedo, signature, macrocosm microcosm, planetary correspondences",
    },
    {
      author: "Nicholas Culpeper",
      work: "The Complete Herbal",
      year: "1653",
      category: "herbalism",
      content: `Each herb is governed by a planet and sign, and must be gathered in accordance with celestial timing for fullest virtue. Herbs of Mars (prickly, hot, stimulating): nettle, garlic, hawthorn, wormwood — good for fevers, infections, and strengthening iron in the blood. Herbs of Venus (sweet, moisture-loving): lady's mantle, mint, thyme, rose — for the reproductive system, kidneys, throat. Herbs of the Moon (watery, nocturnal): cleavers, chickweed, white poppy, moonwort — for the brain, fluids, sleep. Herbs of the Sun (yellow, aromatic): St John's wort, calendula, chamomile, rosemary — for the heart, vitality, digestion. Herbs of Saturn (cold, bitter, slow): comfrey, mullein, horsetail, Solomon's seal — for bones, joints, structure, melancholic conditions. Herbs of Jupiter (expansive, sweet, liver-supporting): dandelion, agrimony, melissa, hyssop — for liver, blood purification, cheerfulness. Herbs of Mercury (quick, nervous, dual-natured): lavender, fennel, parsley, dill — for the lungs, nerves, communication. Gather roots in autumn when the sap descends; leaves at the peak of the growing season; flowers when in full bloom before seed sets; best gathered in the planetary hour of the ruling planet.`,
      keywords: "planetary herbs, mars nettle garlic wormwood, venus rose mint thyme, moon chickweed, sun calendula rosemary, saturn comfrey mullein, jupiter dandelion melissa, mercury lavender fennel, gathering timing",
    },
    {
      author: "Hermes Trismegistus",
      work: "Emerald Tablet (Tabula Smaragdina)",
      year: "c. 8th century CE",
      category: "hermetic philosophy",
      content: `True, without falsehood, certain and most true: that which is above is the same as that which is below, and that which is below is the same as that which is above, for the performance of the miracle of the one thing. And as all things were from One, by the mediation of One, so all things follow from this One thing by adaptation. Its father is the Sun; its mother is the Moon; the wind has carried it in its belly; its nurse is the Earth. This is the father of all the perfection of the whole world. Its power is integral if it is turned towards the Earth. Separate the Earth from Fire, the subtle from the gross, gently and with great care. It ascends from the Earth to the Heavens, and again it descends to the Earth, and receives the power of the above and the below. Thus you will have the glory of the whole world. All obscurity will flee from you. This is the strong strength of all strength, for it overcomes every subtle thing and penetrates every solid. The most brief summary of the world was created thus. Hence I am called Hermes Trismegistus, having the three parts of the philosophy of the whole world.`,
      keywords: "as above so below, one thing, sun moon wind earth, separate earth fire, ascend descend, hermetic, three parts philosophy",
    },
    {
      author: "Jakob Böhme",
      work: "Aurora (Morgenröte im Aufgang)",
      year: "1612",
      category: "theosophy",
      content: `In the beginning was the Unground (Ungrund) — the eternal abyss of divinity, the Nothing that is the Everything, the dark fire of will that desires to know itself. From this Unground arises the eternal Grund, the foundation, through a process of seven nature-spirits or qualities (Quellgeister): (1) Harshness/Contraction — the astringent drawing-in, related to Saturn and lead; (2) Desire/Bitterness — the sting of consciousness, related to Mercury; (3) Anguish/Turning — the anxiety of contradiction, the lightning of transformation; (4) Fire — the turning-point, the birth of light from darkness, related to Mars and iron; (5) Love/Light — the mild heart, the Son, related to Sun and gold; (6) Sound/Life — the word made flesh, the expression of the divine nature; (7) The Kingdom/Body — the objective world, salt, related to Moon. The entire cosmos is a theogonic process, a drama of divine self-revelation. Each stone, each herb, each metal carries the signature of the eternal world within it. Sulfur, Mercury, and Salt in Böhme become the body of God: Sulfur is the eternal desire-fire, Mercury is the speaking or sounding Word, Salt is the body of wisdom.`,
      keywords: "ungrund, seven spirits quellgeister, harshness desire anguish fire love sound kingdom, theogony, signature, sulphur mercury salt divine, lead mercury iron gold",
    },
    {
      author: "Michael Maier",
      work: "Atalanta Fugiens",
      year: "1618",
      category: "alchemy",
      content: `The fifty emblems of Atalanta Fugiens encode the secrets of the Great Work. Nature is the guide — follow her and you shall not err. The work requires patience, for nature proceeds slowly and surely, not by sudden leaps. The matter of the work is One Thing, found everywhere, despised by fools and prized by the wise. It is found on dung-heaps, in the most humble places, for spirit dwells in matter however base. The Philosophical Mercury is the key — not common mercury the metal, but the living spirit that can dissolve gold and then coagulate again. Solve et coagula (dissolve and coagulate) is the central operation: the philosopher must learn to dissolve fixed things and fix volatile things. The Red Man and White Woman must be united in the alchemical wedding (coniunctio): Sun (gold, sulfur, masculine) with Moon (silver, mercury, feminine) in the vessel to produce the Hermaphrodite, the perfect Stone. The four elements must be balanced: Fire tempers, Water dissolves, Air separates, Earth fixes. The stages: putrefaction in the sealed vessel (putrefactio), separation of principles (separatio), purification (purificatio), conjunction (coniunctio), fixation (fixatio), and multiplication (multiplicatio).`,
      keywords: "atalanta fugiens, fifty emblems, solve coagula, philosophical mercury, red man white woman, coniunctio, alchemical wedding, sun gold moon silver, four elements, putrefactio separatio fixatio multiplicatio",
    },
    {
      author: "John Gerard",
      work: "Herball or Generall Historie of Plantes",
      year: "1597",
      category: "herbalism",
      content: `Rosemary (Rosmarinus officinalis): Hot and dry in the second degree. Governed by the Sun in Aries. The distilled water comforts the brain, the memory, the inward senses, restores speech to those that are stuck dumb. Boiled in wine it remedies cold afflictions of the brain. Good for dim eyes when the smoke is blown into them. Valerian (Valeriana officinalis): Hot and dry, moderately. The roots prevent the falling sickness (epilepsy). Provokes urine, is good against the plague. The cats are greatly delighted with the smell of Valerian. Elder (Sambucus nigra): The leaves and bark purge watery humors. The bark of the root, boiled in wine, causes vomiting, good for dropsy. The flowers distilled give a water useful for all hot inflammations of the face and skin. The berries boiled in wine provoke sweat. Betony (Stachys betonica): Under Jupiter in Aries. Good against all diseases of the head and brain. Cures pains in the head whether arising from cold or heat. The roots are vomitory. Good for the sight. Dried and taken as snuff it cleanses the head. Chamomile (Matricaria chamomilla): Hot and dry. The flowers boiled in posset drink cause sweating, cure agues. Oil of chamomile is excellent for all cold griefs of the joints, the sinews, and all pains proceeding from wind and cold. Most gentle and comfortable for all bodies.`,
      keywords: "rosemary sun aries memory brain, valerian epilepsy sleep, elder purge dropsy flowers skin, betony jupiter head brain, chamomile cold joints fever, materia medica, humors",
    },
  ];

  const insert = db.prepare(
    "INSERT INTO texts (author, work, year, category, content, keywords) VALUES (?, ?, ?, ?, ?, ?)"
  );

  for (const t of texts) {
    insert.run(t.author, t.work, t.year, t.category, t.content, t.keywords);
  }

  console.log(`[DB] Seeded ${texts.length} primary alchemical/herbal texts`);
}

export function searchTexts(query: string): Array<{
  author: string;
  work: string;
  year: string;
  category: string;
  content: string;
}> {
  const db = getDb();
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 5);

  const rows = db
    .prepare("SELECT author, work, year, category, content, keywords FROM texts")
    .all() as Array<{
      author: string;
      work: string;
      year: string;
      category: string;
      content: string;
      keywords: string;
    }>;

  // Score by keyword/content matches
  const scored = rows.map((row) => {
    const haystack = (row.content + " " + row.keywords).toLowerCase();
    const score = terms.reduce(
      (acc, term) => acc + (haystack.includes(term) ? 1 : 0),
      0
    );
    return { ...row, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ author, work, year, category, content }) => ({
      author, work, year, category, content,
    }));
}

export function getAllTexts(): Array<{
  author: string;
  work: string;
  year: string;
  category: string;
}> {
  const db = getDb();
  return db
    .prepare("SELECT author, work, year, category FROM texts ORDER BY year")
    .all() as Array<{ author: string; work: string; year: string; category: string }>;
}

// Notes

export function addNote(title: string, body: string): number {
  const db = getDb();
  const result = db
    .prepare("INSERT INTO notes (title, body) VALUES (?, ?)")
    .run(title, body);
  return result.lastInsertRowid as number;
}

export function listNotes(): Array<{
  id: number;
  title: string;
  body: string;
  created_at: string;
}> {
  const db = getDb();
  return db
    .prepare("SELECT id, title, body, created_at FROM notes ORDER BY created_at DESC")
    .all() as Array<{ id: number; title: string; body: string; created_at: string }>;
}

export function deleteNote(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM notes WHERE id = ?").run(id);
  return result.changes > 0;
}

// Reminders

export function addReminder(
  title: string,
  body: string,
  deliverAt: string
): number {
  const db = getDb();
  const result = db
    .prepare(
      "INSERT INTO reminders (title, body, deliver_at) VALUES (?, ?, ?)"
    )
    .run(title, body, deliverAt);
  return result.lastInsertRowid as number;
}

export function listReminders(includeDelivered = false): Array<{
  id: number;
  title: string;
  body: string;
  deliver_at: string;
  delivered: number;
  created_at: string;
}> {
  const db = getDb();
  const sql = includeDelivered
    ? "SELECT * FROM reminders ORDER BY deliver_at ASC"
    : "SELECT * FROM reminders WHERE delivered = 0 ORDER BY deliver_at ASC";
  return db.prepare(sql).all() as Array<{
    id: number;
    title: string;
    body: string;
    deliver_at: string;
    delivered: number;
    created_at: string;
  }>;
}

export function getDueReminders(): Array<{
  id: number;
  title: string;
  body: string;
  deliver_at: string;
}> {
  const db = getDb();
  const now = new Date().toISOString();
  return db
    .prepare(
      "SELECT id, title, body, deliver_at FROM reminders WHERE delivered = 0 AND deliver_at <= ?"
    )
    .all(now) as Array<{
      id: number;
      title: string;
      body: string;
      deliver_at: string;
    }>;
}

export function markReminderDelivered(id: number): void {
  const db = getDb();
  db.prepare("UPDATE reminders SET delivered = 1 WHERE id = ?").run(id);
}
