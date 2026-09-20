#!/usr/bin/env python3
"""
Generates data/courts.ts — the static "database" for PicklePad.

All venue names, phone numbers, street addresses and building names in this file
are FICTIONAL and were invented for this demo. Coordinates are deliberately
offset from any real venue and are only accurate to the neighbourhood level, so
the map reads correctly for Bengaluru without pointing at a real business.
Run:  python3 scripts/generate-courts.py
"""
import json
import random

random.seed(20260920)

# (fictional venue name, Bengaluru locality, approx locality lat, lng, pincode)
SEED = [
    ("Dinkyard Sports Club",        "Sarjapur Road",        12.8951, 77.6939, "560035"),
    ("Third Shot Arena",            "MG Road",              12.9747, 77.6081, "560001"),
    ("Kingpin Pickle Courts",       "Basaveshwaranagar",    12.9858, 77.5412, "560079"),
    ("Volley Vista Club",           "Basavanagudi",         12.9432, 77.5712, "560004"),
    ("The Paddle Yard",             "Jayamahal",            12.9959, 77.5952, "560006"),
    ("Smashadda Pickleball",        "Hennur",               13.0712, 77.6544, "560077"),
    ("Rally Republic",              "Chandra Layout",       12.9622, 77.5262, "560072"),
    ("Court No. 7",                 "Bhoganahalli",         12.9271, 77.6968, "560103"),
    ("Lob & Lime",                  "Subramanyapura",       12.8918, 77.5340, "560061"),
    ("Banyan Paddle Club",          "Kundalahalli",         12.9785, 77.7108, "560048"),
    ("Netcord Sports Hub",          "Whitefield",           12.9835, 77.7519, "560066"),
    ("Pickle Pavilion",             "Mahadevapura",         12.9968, 77.7019, "560048"),
    ("Drop Zone Arena",             "Varthur",              12.9461, 77.7532, "560087"),
    ("Tandem Courts",               "Koramangala",          12.9396, 77.6259, "560095"),
    ("The Kitchen Line",            "Agara",                12.9252, 77.6507, "560102"),
    ("Greenpaddle Collective",      "Koramangala",          12.9320, 77.6324, "560034"),
    ("Ace & Dink Academy",          "Indiranagar",          12.9736, 77.6371, "560038"),
    ("Flyover Courts",              "KR Puram",             13.0248, 77.6735, "560016"),
    ("Monsoon Pickle Club",         "New Thippasandra",     12.9772, 77.6551, "560075"),
    ("Baseline Bengaluru",          "Indiranagar",          12.9763, 77.6365, "560038"),
    ("Sunspot Paddle Park",         "HSR Layout",           12.9026, 77.6424, "560068"),
    ("Paddle Parliament",           "Doddakannelli",        12.9077, 77.6907, "560035"),
    ("The Dink District",           "Bellandur",            12.9317, 77.6930, "560103"),
    ("Overhead Sports Arena",       "Green Glen Layout",    12.9282, 77.6730, "560103"),
    ("Terrace Ten Courts",          "JP Nagar",             12.8765, 77.5534, "560062"),
    ("Crosscourt Club",             "Jayanagar",            12.9328, 77.5816, "560011"),
    ("Nightlight Pickle Arena",     "Kumaraswamy Layout",   12.9030, 77.5713, "560111"),
    ("Wristflick Sports Co.",       "Bannerghatta Road",    12.9324, 77.6030, "560029"),
    ("The Rally Room",              "Jayanagar",            12.9199, 77.5756, "560070"),
    ("Slice & Serve Arena",         "JP Nagar",             12.8939, 77.5769, "560078"),
    ("Pickleport Courts",           "Yelahanka",            13.0971, 77.5967, "560064"),
    ("Urban Volley Yard",           "Amrutahalli",          13.0681, 77.6003, "560092"),
    ("Hopstep Pickleball",          "Sahakar Nagar",        13.0593, 77.5941, "560092"),
    ("Two Bounce Club",             "New BEL Road",         13.0303, 77.5717, "560094"),
    ("The Sideline Club",           "Kalyan Nagar",         13.0369, 77.6390, "560043"),
    ("Tikitaka Paddle Club",        "Thanisandra",          13.0621, 77.6355, "560077"),
    ("Cloudcourt Rooftop",          "Malleshwaram",         13.0130, 77.5588, "560055"),
    ("Anchor Point Arena",          "Munnekolala",          12.9473, 77.7158, "560037"),
    ("Pickle Junction",             "Doddanekundi",         12.9791, 77.6956, "560037"),
    ("Deuce & Dink Courts",         "Brookefield",          12.9619, 77.7136, "560037"),
    ("Paddlewala Sports Park",      "Electronic City",      12.8452, 77.6602, "560100"),
    ("Lakeview Pickle Deck",        "Hebbal",               13.0358, 77.5970, "560024"),
    ("Sixty Feet Courts",           "Rajajinagar",          12.9917, 77.5540, "560010"),
    ("Banashankari Paddle Works",   "Banashankari",         12.9255, 77.5468, "560070"),
    ("The Dink Depot",              "BTM Layout",           12.9166, 77.6101, "560076"),
    ("Steelyard Pickle Arena",      "Yeshwanthpur",         13.0234, 77.5510, "560022"),
]

BUILDINGS = [
    "Anvaya Arcade", "Pragati Point", "Nirvaan Square", "Kaveri Heights",
    "Shanthi Business Park", "Tarangini Plaza", "Vismaya Towers", "Ekanta Complex",
    "Saanjh Arcade", "Mahalakshmi Landmark", "Neeladri House", "Chitraka Centre",
    "Ravindra Arcade", "Bhoomi One", "Suvarna Crest", "Hasiru Hub",
    "Kalpataru Court", "Manthan Plaza", "Adhira Arena Block", "Samvit Square",
]

STREETS = [
    "1st Cross Road", "4th Main Road", "7th Cross Road", "80 Feet Road",
    "Service Road", "2nd Main Road", "11th Cross Road", "Ring Road Service Lane",
    "Outer Link Road", "5th Main Road", "Club Road", "Depot Road",
]

SURFACES = ["Cushioned acrylic", "Synthetic hard court", "Acrylic hard court", "Wooden indoor", "Sport tile"]

AMENITY_POOL = [
    "Floodlights", "Paddle rental", "Changing rooms", "Showers", "Free parking",
    "Cafe", "Drinking water", "Pro shop", "Coaching available", "Seating gallery",
    "First-aid kit", "Ball machine", "Locker room", "EV charging", "Restrooms",
    "Wi-Fi", "Air-conditioned", "Rooftop views", "Spectator deck", "Towel service",
]

TAG_POOL = [
    "beginner-friendly", "tournament-grade", "rooftop", "indoor", "outdoor",
    "late-night", "corporate-friendly", "kids-coaching", "ladies-batch",
    "open-play", "leagues", "air-conditioned", "budget", "premium",
]


def main() -> None:
    courts = []
    for i, (name, area, lat, lng, pin) in enumerate(SEED):
        # Offset the coordinate within roughly a 400-900 m box around the locality
        # centre so no marker lands on a real business.
        jlat = round(lat + random.uniform(-0.007, 0.007), 6)
        jlng = round(lng + random.uniform(-0.007, 0.007), 6)

        indoor = random.random() < 0.45
        rooftop = (not indoor) and random.random() < 0.3
        num_courts = random.choice([2, 2, 3, 3, 4, 4, 5, 6, 8])
        price = random.choice([350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 900])
        if indoor:
            price += 100
        rating = round(random.uniform(3.9, 5.0), 1)
        reviews = random.randint(24, 640)
        open_h = random.choice([5, 6, 6, 7])
        close_h = random.choice([21, 22, 22, 23, 23])

        amenities = sorted(random.sample(AMENITY_POOL, random.randint(5, 9)))
        if indoor and "Air-conditioned" not in amenities:
            amenities.append("Air-conditioned")
        if not indoor and "Floodlights" not in amenities:
            amenities.append("Floodlights")
        amenities = sorted(set(amenities))

        tags = set(random.sample(TAG_POOL, 3))
        tags.add("indoor" if indoor else "outdoor")
        if rooftop:
            tags.add("rooftop")
        if close_h >= 23:
            tags.add("late-night")
        if price <= 450:
            tags.add("budget")
        if price >= 800:
            tags.add("premium")

        slug = (
            name.lower()
            .replace("&", "and")
            .replace(".", "")
            .replace("'", "")
            .replace(" ", "-")
        )

        courts.append(
            {
                "id": f"pc-{i + 1:03d}",
                "slug": slug,
                "name": name,
                "area": area,
                "city": "Bengaluru",
                # Fictional address: invented building name + generic street + real locality.
                "address": f"{random.randint(3, 214)}, {random.choice(BUILDINGS)}, "
                f"{random.choice(STREETS)}, {area}, Bengaluru {pin}",
                # Placeholder demo number — not a real, dialable line.
                "phone": f"+91 90000 1{i + 1:04d}",
                "lat": jlat,
                "lng": jlng,
                "courts": num_courts,
                "surface": random.choice(SURFACES),
                "indoor": indoor,
                "pricePerHour": price,
                "rating": rating,
                "reviews": reviews,
                "openHour": open_h,
                "closeHour": close_h,
                "amenities": amenities,
                "tags": sorted(tags),
                "hue": (i * 47) % 360,
            }
        )

    header = '''// ---------------------------------------------------------------------------
// PicklePad static "database".
//
// This file IS the database. There is no Postgres, no Mongo, no external API —
// every court, price and slot rule is derived from this module at runtime, which
// is what lets the whole app run on a free Vercel plan with zero add-ons.
//
// IMPORTANT — all data below is FICTIONAL. Venue names, phone numbers, building
// names and street addresses were invented for this demo. Coordinates are
// offset from any real location and are accurate only to the neighbourhood, so
// the map is geographically sensible for Bengaluru without representing, naming
// or pointing at any real business.
//
// Generated by scripts/generate-courts.py — edit that and re-run, or just edit
// the array below by hand.
// ---------------------------------------------------------------------------

export type Court = {
  id: string;
  slug: string;
  name: string;
  area: string;
  city: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  courts: number;
  surface: string;
  indoor: boolean;
  pricePerHour: number;
  rating: number;
  reviews: number;
  openHour: number;
  closeHour: number;
  amenities: string[];
  tags: string[];
  hue: number;
};

export const COURTS: Court[] = '''

    body = json.dumps(courts, indent=2, ensure_ascii=False)

    footer = ''';

/** Every distinct locality present in the dataset, alphabetised. */
export const AREAS: string[] = Array.from(
  new Set(COURTS.map((c) => c.area)),
).sort();

/** Every distinct amenity present in the dataset, alphabetised. */
export const AMENITIES: string[] = Array.from(
  new Set(COURTS.flatMap((c) => c.amenities)),
).sort();

/** Every distinct tag present in the dataset, alphabetised. */
export const TAGS: string[] = Array.from(
  new Set(COURTS.flatMap((c) => c.tags)),
).sort();

export const PRICE_RANGE = {
  min: Math.min(...COURTS.map((c) => c.pricePerHour)),
  max: Math.max(...COURTS.map((c) => c.pricePerHour)),
};

/**
 * Well-known Bengaluru locality centres, used as a manual fallback when the
 * browser denies geolocation. Neighbourhood centroids, not venue addresses.
 */
export const LANDMARKS: { name: string; lat: number; lng: number }[] = [
  { name: "MG Road", lat: 12.9747, lng: 77.6081 },
  { name: "Indiranagar", lat: 12.9719, lng: 77.6412 },
  { name: "Koramangala", lat: 12.9352, lng: 77.6245 },
  { name: "HSR Layout", lat: 12.9121, lng: 77.6446 },
  { name: "Whitefield", lat: 12.9698, lng: 77.7499 },
  { name: "Marathahalli", lat: 12.9591, lng: 77.6974 },
  { name: "Bellandur", lat: 12.9257, lng: 77.6764 },
  { name: "Sarjapur Road", lat: 12.9009, lng: 77.6874 },
  { name: "Jayanagar", lat: 12.9308, lng: 77.5838 },
  { name: "JP Nagar", lat: 12.9063, lng: 77.5857 },
  { name: "Banashankari", lat: 12.9255, lng: 77.5468 },
  { name: "Rajajinagar", lat: 12.9917, lng: 77.5540 },
  { name: "Malleshwaram", lat: 13.0035, lng: 77.5647 },
  { name: "Hebbal", lat: 13.0358, lng: 77.597 },
  { name: "Yelahanka", lat: 13.1007, lng: 77.5963 },
  { name: "Electronic City", lat: 12.8452, lng: 77.6602 },
  { name: "BTM Layout", lat: 12.9166, lng: 77.6101 },
  { name: "Hennur", lat: 13.0359, lng: 77.6431 },
];
'''

    with open("data/courts.ts", "w", encoding="utf-8") as fh:
        fh.write(header + body + footer)

    print(f"wrote data/courts.ts with {len(courts)} courts")


if __name__ == "__main__":
    main()
