import os
import json
from datetime import datetime
import psycopg2
from psycopg2.extras import Json
from scanning import scan_receipt

# DB #1: People database (employees table)
PEOPLE_DATABASE_URL = "postgresql://doadmin:AVNS_t3dZlVEidpe5D7Oqoue@db-mchacks13-rdek-do-user-32143408-0.h.db.ondigitalocean.com:25060/defaultdb"

# DB #2: Receipts database
RECEIPTS_DATABASE_URL = "postgresql://doadmin:AVNS_Uf3hBRDfQfHECgzKeVZ@db-mchacks13-transactions-do-user-32143408-0.k.db.ondigitalocean.com:25060/defaultdb"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS receipts (
  id SERIAL PRIMARY KEY,

  person_id INTEGER NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  department TEXT NOT NULL,

  merchant TEXT NOT NULL,
  receipt_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  currency TEXT,
  total NUMERIC(12,2) NOT NULL,
  category TEXT,

  items JSONB NOT NULL
);
"""

def prompt(msg: str, allow_empty: bool = False) -> str:
    while True:
        val = input(msg).strip()
        if val or allow_empty:
            return val

def parse_date(s: str):
    if not s:
        return None

    s = s.strip()

    # Try multiple common receipt date formats
    formats = [
        "%Y-%m-%d",   # 2025-10-03
        "%y/%m/%d",   # 25/10/03
        "%d/%m/%y",   # 03/10/25
        "%d/%m/%Y",   # 03/10/2025
        "%m/%d/%Y",   # 10/03/2025 (US)
    ]

    for fmt in formats:
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue

    # If none matched, fail clearly
    raise ValueError(f"Unrecognized date format: '{s}'")


def fetch_person_by_id(people_conn, person_id: int):
    with people_conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, first_name, last_name, department
            FROM employees
            WHERE id = %s
            """,
            (person_id,),
        )
        row = cur.fetchone()
        if not row:
            return None
        return {"id": row[0], "first_name": row[1], "last_name": row[2], "department": row[3]}


def load_receipt_json(path: str) -> dict:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Could not find JSON file: {path}")

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Minimal validation / defaults
    if "merchant" not in data or not data["merchant"]:
        raise ValueError("JSON missing 'merchant'")
    if "total" not in data or data["total"] is None:
        raise ValueError("JSON missing 'total'")
    if "items" not in data or not isinstance(data["items"], list):
        raise ValueError("JSON missing 'items' list")

    return data

def main():
    # Connect to both DBs
    people_conn = psycopg2.connect(PEOPLE_DATABASE_URL)
    receipts_conn = psycopg2.connect(RECEIPTS_DATABASE_URL)
    receipts_conn.autocommit = False

    try:
        # Ensure receipts table exists
        with receipts_conn.cursor() as cur:
            cur.execute(CREATE_TABLE_SQL)
        receipts_conn.commit()

        # 1) person id -> name from PEOPLE DB
        print("\n--- Person ---")
        person_id = int(prompt("Person ID (from employees DB): "))
        person = fetch_person_by_id(people_conn, person_id)
        if person is None:
            raise ValueError(f"No employee found with id={person_id} in PEOPLE DB")

        print(f"✅ Found employee: {person['first_name']} {person['last_name']} ({person['department']}) (id={person_id})")


        # 2) load receipt data from file
        print("\n--- Receipt image ---")
        image_filename = prompt("Image filename (e.g. PHOTO-2026-01-17-21-56-38.jpg): ")
        receipt = scan_receipt(image_filename)

        merchant = receipt.get("merchant")
        currency = receipt.get("currency", "")
        total = float(receipt.get("total"))
        receipt_date = parse_date(receipt.get("date", "")) if receipt.get("date") else None
        items = receipt.get("items", [])

        # 3) ask category + created_at
        print("\n--- Extra fields ---")
        category = prompt("Category (e.g. groceries, restaurant): ", allow_empty=True)
        created_at_str = prompt("Created at (ISO) [ENTER=now]: ", allow_empty=True)

        created_at = None
        if created_at_str:
            created_at = datetime.fromisoformat(created_at_str)

        # 4) insert
        with receipts_conn.cursor() as cur:
            cols = [
                "person_id", "first_name", "last_name", "department",
                "merchant", "receipt_date", "currency", "total", "category", "items"
            ]
            vals = [
                person_id, person["first_name"], person["last_name"], person["department"],
                merchant, receipt_date, currency, total, category, Json(items)
            ]

            if created_at is not None:
                cols.insert(6, "created_at")   # after receipt_date (index depends on your list)
                vals.insert(6, created_at)

            placeholders = ", ".join(["%s"] * len(vals))
            col_list = ", ".join(cols)

            sql = f"""
                INSERT INTO receipts ({col_list})
                VALUES ({placeholders})
                RETURNING id;
            """

            cur.execute(sql, tuple(vals))
            row = cur.fetchone()
            if row is None:
                raise RuntimeError("Insert succeeded but no id returned (missing RETURNING id?)")
            receipt_id = row[0]


        receipts_conn.commit()

        print(f"\n✅ Inserted receipt id={receipt_id}")
        print(f"   person={person['first_name']} {person['last_name']} (id={person_id})")
        print(f"   merchant={merchant}, total={total}, currency={currency}, items={len(items)}")

    except Exception as e:
        receipts_conn.rollback()
        print("\n❌ Failed:", e)
        raise
    finally:
        people_conn.close()
        receipts_conn.close()

if __name__ == "__main__":
    main()
