/**
 * One-shot seed Lambda.
 * Triggered manually (or as a CDK custom resource) to populate DynamoDB
 * with famous historical and fictional murder cases.
 * Safe to re-run — existing cases are skipped via a seeded flag.
 */
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import type { Case, CaseListItem } from '../../packages/shared/src/index';

const TABLE_NAME = process.env.TABLE_NAME!;
const ddb        = DynamoDBDocument.from(new DynamoDB());

function id(n: number) { return String(n); }
function caseKey(caseId: string) { return `CASE#${caseId}`; }
const LIST_KEY   = 'CASES';
const SEEDED_KEY = 'SEEDED_FLAG';

// ── Seed data ─────────────────────────────────────────────────────────────────
const SEED_CASES: Omit<Case, 'createdAt' | 'updatedAt'>[] = [
  {
    id: id(1),
    name: 'Jack the Ripper (1888)',
    description: 'Five canonical murders in Whitechapel, London. Perpetrator never identified.',
    board: {
      cards: [
        { id: 'r1', type: 'suspect',  title: 'Aaron Kosminski',   description: 'Polish barber; named in Chief Inspector Swanson\'s marginalia. DNA evidence debated.',          x: 60,  y: 110 },
        { id: 'r2', type: 'suspect',  title: 'Montague Druitt',   description: 'Barrister found drowned Nov 1888; Assistant Commissioner Macnaghten\'s prime suspect.',        x: 60,  y: 280 },
        { id: 'r3', type: 'suspect',  title: 'George Chapman',    description: 'Polish-born poisoner hanged 1903; suspected by Inspector Abberline.',                          x: 60,  y: 450 },
        { id: 'r4', type: 'evidence', title: 'Dear Boss Letter',  description: 'Postmarked 27 Sep 1888. Coined the name "Jack the Ripper". Possibly a journalist hoax.',       x: 320, y: 110 },
        { id: 'r5', type: 'evidence', title: 'From Hell Letter',  description: 'Sent with half a preserved kidney, claimed to be from victim Catherine Eddowes.',              x: 320, y: 250 },
        { id: 'r6', type: 'clue',     title: 'Whitechapel Murder Files', description: 'Scotland Yard files; multiple investigators, no conviction. Files opened 1976.',        x: 320, y: 390 },
        { id: 'r7', type: 'clue',     title: 'Juwes Writing',     description: '"The Juwes are the men that will not be blamed for nothing." Erased by Comm. Warren.',        x: 320, y: 530 },
        { id: 'r8', type: 'evidence', title: 'Five Canonical Victims', description: 'Polly Nichols, Annie Chapman, Elizabeth Stride, Catherine Eddowes, Mary Jane Kelly.',   x: 600, y: 180 },
        { id: 'r9', type: 'note',     title: 'Case Status',       description: 'Officially unsolved. Over 100 suspects named by various researchers since 1888.',              x: 600, y: 380 },
      ],
      connections: [
        { id: 'rc1', from: 'r4', to: 'r1' },
        { id: 'rc2', from: 'r5', to: 'r3' },
        { id: 'rc3', from: 'r6', to: 'r2' },
        { id: 'rc4', from: 'r7', to: 'r1' },
        { id: 'rc5', from: 'r8', to: 'r6' },
      ],
    },
  },
  {
    id: id(2),
    name: 'Black Dahlia — Elizabeth Short (1947)',
    description: 'Aspiring actress found bisected in Leimert Park, Los Angeles. Case never solved.',
    board: {
      cards: [
        { id: 'd1', type: 'evidence', title: 'Crime Scene',      description: 'Body found 15 Jan 1947, completely drained of blood, surgically bisected at the waist.', x: 60,  y: 110 },
        { id: 'd2', type: 'suspect',  title: 'Dr. George Hodel', description: 'L.A. physician; accused posthumously by his own son, LAPD Det. Steve Hodel, in 2003.', x: 60,  y: 290 },
        { id: 'd3', type: 'suspect',  title: 'Walter Bayley',    description: 'Surgeon who lived near dump site; died Jan 1948. Suspected by neighbor\'s granddaughter.', x: 60,  y: 460 },
        { id: 'd4', type: 'clue',     title: 'Sent Package',     description: 'Killer mailed Short\'s ID, address book and photos to LAPD. All prints wiped with gasoline.', x: 320, y: 110 },
        { id: 'd5', type: 'evidence', title: 'Autopsy Report',   description: 'Ligature marks on wrists and ankles. Hemp rope fibers. Precise surgical knowledge inferred.', x: 320, y: 260 },
        { id: 'd6', type: 'clue',     title: 'Phone Tip',        description: 'Caller claiming to be the killer contacted L.A. Examiner, promised more clues.', x: 320, y: 430 },
        { id: 'd7', type: 'note',     title: 'LAPD Files',       description: '150+ confessions taken; all cleared. Files partially declassified 1990s.', x: 600, y: 230 },
      ],
      connections: [
        { id: 'dc1', from: 'd1', to: 'd5' },
        { id: 'dc2', from: 'd4', to: 'd2' },
        { id: 'dc3', from: 'd6', to: 'd7' },
        { id: 'dc4', from: 'd5', to: 'd2' },
      ],
    },
  },
  {
    id: id(3),
    name: 'Zodiac Killer (1968–1969)',
    description: 'At least five confirmed killings in Northern California. Killer taunted police with ciphers.',
    board: {
      cards: [
        { id: 'z1', type: 'suspect',  title: 'Arthur Leigh Allen', description: 'Prime suspect identified by investigators; handwriting and DNA tests inconclusive.', x: 60,  y: 110 },
        { id: 'z2', type: 'suspect',  title: 'Gary Francis Poste', description: 'Named by cold-case team "The Case Breakers" in 2021. FBI has not confirmed.', x: 60,  y: 280 },
        { id: 'z3', type: 'evidence', title: 'Z-408 Cipher',       description: 'Three-part cipher sent to press Aug 1969. Solved in days by schoolteacher Donald Harden.', x: 320, y: 110 },
        { id: 'z4', type: 'evidence', title: 'Z-340 Cipher',       description: '340-character cipher sent 1969. Remained unsolved for 51 years; cracked Dec 2020.', x: 320, y: 260 },
        { id: 'z5', type: 'clue',     title: 'Bloody Shirt Piece', description: 'A swatch from Paul Stine\'s blood-soaked shirt included with authenticated letter.', x: 320, y: 420 },
        { id: 'z6', type: 'evidence', title: 'Five Victims',       description: 'David Faraday, Betty Lou Jensen, Darlene Ferrin, Bryan Hartnell, Paul Stine.', x: 600, y: 160 },
        { id: 'z7', type: 'note',     title: '"I Am Not Afraid"',  description: 'Z-408 decoded: "I like killing people because it is so much fun…"', x: 600, y: 380 },
      ],
      connections: [
        { id: 'zc1', from: 'z3', to: 'z1' },
        { id: 'zc2', from: 'z4', to: 'z7' },
        { id: 'zc3', from: 'z5', to: 'z6' },
        { id: 'zc4', from: 'z1', to: 'z6' },
      ],
    },
  },
  {
    id: id(4),
    name: 'O.J. Simpson Trial (1994)',
    description: 'Former NFL star acquitted of murdering Nicole Brown Simpson and Ron Goldman.',
    board: {
      cards: [
        { id: 'oj1', type: 'suspect',  title: 'O.J. Simpson',         description: 'Ex-husband of Nicole. Acquitted criminally 1995; found liable civilly 1997 ($33.5M).', x: 60,  y: 110 },
        { id: 'oj2', type: 'evidence', title: 'Bloody Glove',         description: 'Right-hand glove found at Rockingham estate. Left glove at crime scene. Key evidence.', x: 320, y: 110 },
        { id: 'oj3', type: 'clue',     title: 'Bronco Chase',         description: '95-million viewers watched slow-speed chase on June 17, 1994 before Simpson surrendered.', x: 320, y: 260 },
        { id: 'oj4', type: 'evidence', title: 'DNA Blood Trail',      description: 'Blood on Bronco, Rockingham driveway and inside house matched victims and Simpson.', x: 320, y: 410 },
        { id: 'oj5', type: 'suspect',  title: 'Det. Mark Fuhrman',    description: 'Evidence planting alleged; admitted to using racial slurs. Fifth Amendment invoked.', x: 60,  y: 330 },
        { id: 'oj6', type: 'clue',     title: '"If It Doesn\'t Fit"', description: 'Glove demonstration Jan 1995. Cochran\'s closing: "If it doesn\'t fit, you must acquit."', x: 600, y: 150 },
        { id: 'oj7', type: 'note',     title: 'Verdict Oct 3 1995',   description: 'Not guilty on both counts. 150 million people watched verdict live.', x: 600, y: 350 },
      ],
      connections: [
        { id: 'ojc1', from: 'oj2', to: 'oj1' },
        { id: 'ojc2', from: 'oj4', to: 'oj1' },
        { id: 'ojc3', from: 'oj5', to: 'oj4' },
        { id: 'ojc4', from: 'oj6', to: 'oj7' },
      ],
    },
  },
  {
    id: id(5),
    name: 'Agatha Christie — Murder on the Orient Express',
    description: '[FICTION] Hercule Poirot investigates the stabbing of Samuel Ratchett aboard the Orient Express.',
    board: {
      cards: [
        { id: 'oe1', type: 'suspect',  title: 'Samuel Ratchett',     description: 'Victim. Real identity: Cassetti, the kidnapper who murdered Daisy Armstrong.', x: 60,  y: 110 },
        { id: 'oe2', type: 'suspect',  title: 'Hector MacQueen',     description: 'Ratchett\'s American secretary. Daughter of the DA who prosecuted Cassetti.', x: 60,  y: 250 },
        { id: 'oe3', type: 'suspect',  title: 'Princess Dragomiroff', description: 'Daisy Armstrong\'s godmother. Organised the conspiracy aboard the train.', x: 60,  y: 410 },
        { id: 'oe4', type: 'clue',     title: '12 Stab Wounds',      description: 'Some wounds struck by a left-handed person, some by right-handed — two killers? No: 12 conspirators.', x: 320, y: 110 },
        { id: 'oe5', type: 'evidence', title: 'Burned Letter',       description: 'Fragment survived: "member L… Armstrong case." Links victim to the kidnapping.', x: 320, y: 260 },
        { id: 'oe6', type: 'clue',     title: 'Crimson Kimono',      description: 'Seen by Poirot; belongs to Mrs Hubbard. Key to establishing the alibi chain.', x: 320, y: 420 },
        { id: 'oe7', type: 'note',     title: 'Poirot\'s Solution',  description: 'All 12 passengers — each connected to the Armstrong family — each administered one of the 12 stab wounds.', x: 600, y: 250 },
      ],
      connections: [
        { id: 'oec1', from: 'oe1', to: 'oe4' },
        { id: 'oec2', from: 'oe5', to: 'oe1' },
        { id: 'oec3', from: 'oe3', to: 'oe7' },
        { id: 'oec4', from: 'oe6', to: 'oe7' },
        { id: 'oec5', from: 'oe2', to: 'oe3' },
      ],
    },
  },
  {
    id: id(6),
    name: 'Clue / Cluedo — Classic Setup',
    description: '[FICTION] Mr. Boddy is found dead at Tudor Mansion. Six suspects, six weapons, nine rooms.',
    board: {
      cards: [
        { id: 'cl1', type: 'suspect',  title: 'Miss Scarlett',  description: 'Seductive and cunning. Often starts in the Study.', x: 60,  y: 110 },
        { id: 'cl2', type: 'suspect',  title: 'Col. Mustard',   description: 'Military man with a temper. Frequently suspected in the Billiard Room.', x: 60,  y: 230 },
        { id: 'cl3', type: 'suspect',  title: 'Mrs. Peacock',   description: 'High society, politically connected. Strong alibi: Conservatory.', x: 60,  y: 350 },
        { id: 'cl4', type: 'suspect',  title: 'Rev. Green',     description: 'Nervous clergyman. US version: Mr. Green. Possible weapon: Candlestick.', x: 60,  y: 470 },
        { id: 'cl5', type: 'suspect',  title: 'Mrs. White',     description: 'Long-suffering housekeeper. Motive: years of abuse. Weapon: Rope.', x: 60,  y: 590 },
        { id: 'cl6', type: 'suspect',  title: 'Prof. Plum',     description: 'Absent-minded academic. Often linked to the Library and Lead Pipe.', x: 60,  y: 710 },
        { id: 'cl7', type: 'evidence', title: 'Six Weapons',    description: 'Candlestick, Knife, Lead Pipe, Revolver, Rope, Wrench.', x: 340, y: 200 },
        { id: 'cl8', type: 'clue',     title: 'Nine Rooms',     description: 'Kitchen, Ballroom, Conservatory, Billiard Room, Library, Study, Hall, Lounge, Dining Room.', x: 340, y: 400 },
        { id: 'cl9', type: 'note',     title: 'Classic Answer', description: 'Per original 1949 box: Miss Scarlett, in the Kitchen, with the Knife.', x: 620, y: 300 },
      ],
      connections: [
        { id: 'clc1', from: 'cl7', to: 'cl9' },
        { id: 'clc2', from: 'cl1', to: 'cl9' },
        { id: 'clc3', from: 'cl8', to: 'cl9' },
      ],
    },
  },
];

// ── Seed runner ───────────────────────────────────────────────────────────────
export const handler = async () => {
  // Check if already seeded
  const flag = await ddb.get({ TableName: TABLE_NAME, Key: { pk: SEEDED_KEY } });
  if (flag.Item) {
    console.log('Already seeded — skipping.');
    return { statusCode: 200, body: 'Already seeded' };
  }

  const now = new Date().toISOString();
  const listItems: CaseListItem[] = [];

  for (const seed of SEED_CASES) {
    const c: Case = { ...seed, createdAt: now, updatedAt: now };
    await ddb.put({ TableName: TABLE_NAME, Item: { pk: `CASE#${c.id}`, ...c } });
    listItems.push({ id: c.id, name: c.name, description: c.description, createdAt: now, updatedAt: now });
    console.log(`Seeded: ${c.name}`);
  }

  await ddb.put({ TableName: TABLE_NAME, Item: { pk: LIST_KEY, items: listItems } });
  await ddb.put({ TableName: TABLE_NAME, Item: { pk: SEEDED_KEY, seededAt: now } });

  console.log(`Done — ${SEED_CASES.length} cases seeded.`);
  return { statusCode: 200, body: `Seeded ${SEED_CASES.length} cases` };
};
