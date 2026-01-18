from fastapi import FastAPI,UploadFile, File, Form
from psycopg2.extras import Json
from scanning import scan_receipt
from fastapi.middleware.cors import CORSMiddleware
from db import get_employee_conn, get_receipts_conn
from datetime import datetime
from fx import rate_to_cad


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5179"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def parse_date_safe(s):
    if not s:
        return None
    for fmt in ("%Y-%m-%d", "%y/%m/%d", "%d/%m/%y", "%d/%m/%Y", "%d.%m.%Y", "%d.%m.%y",):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            pass
    return None

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
  items JSONB NOT NULL, 
  total_cad NUMERIC(12,2)
);
"""

def fetch_person_by_id(people_conn, person_id: int):
    with people_conn.cursor() as cur:
        cur.execute(
            "SELECT id, first_name, last_name, department FROM employees WHERE id=%s",
            (person_id,),
        )
        row = cur.fetchone()
        if not row:
            return None
        return {"id": row[0], "first_name": row[1], "last_name": row[2], "department": row[3]}

#Get receipts
@app.get("/receipts")
def get_receipts():
    conn = get_receipts_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            id,
            person_id,
            first_name,
            last_name,
            merchant,
            receipt_date,
            created_at,
            currency,
            total,
            total_cad,
            category,
            items
        FROM receipts
        ORDER BY created_at DESC
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    return [
        {
            "id": r[0],
            "person_id": r[1],
            "first_name": r[2],
            "last_name": r[3],
            "merchant": r[4],
            "receipt_date": r[5],
            "created_at": r[6],
            "currency": r[7],
            "total": float(r[8]),
            "total_cad": float(r[9]) if r[9] is not None else None,
            "category": r[10],
            "items": r[11],
        }
        for r in rows
    ]


#Get employee
@app.get("/employees")
def get_employees():
    conn = get_employee_conn()
    with conn.cursor() as cur:
        cur.execute("""
            SELECT id, first_name, last_name, department
            FROM employees
            ORDER BY id
        """)
        rows = cur.fetchall()

    return [
        {"id": r[0], "first_name": r[1], "last_name": r[2], "department": r[3]}
        for r in rows
    ]

#Scnanning endpoint
@app.post("/scan")
async def scan(
    receipt: UploadFile = File(...),
    person_id: int = Form(...),
    category: str = Form("")
):
    #read file + scan
    file_bytes = await receipt.read()
    mime = receipt.content_type or "image/jpeg"
    scanned = scan_receipt(file_bytes, mime)

    receipt_date = parse_date_safe(scanned.get("date"))
    currency = (scanned.get("currency")).upper().strip()
    total = float(scanned.get("total") or 0)

    if currency == "CAD":
        total_cad = round(total, 2)
    else:
        rate = rate_to_cad(currency, receipt_date.isoformat() if receipt_date else None)
        total_cad = round(total * rate, 2)

    gemini_category = scanned.get("category").strip().lower()
    final_category = gemini_category 


    # get the people from the employee table
    people_conn = get_employee_conn()
    try:
        person = fetch_person_by_id(people_conn, person_id)
    finally:
        people_conn.close()

    # add the receipts
    receipts_conn = get_receipts_conn()
    receipts_conn.autocommit = False
    try:
        with receipts_conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO receipts (person_id, first_name, last_name, department,
                    merchant, receipt_date, currency, total, total_cad, category, items
                )
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING id;
                """,
                (
                    person_id,person["first_name"],
                    person["last_name"],
                    person["department"],
                    scanned.get("merchant"),
                    parse_date_safe(scanned.get("date")),
                    scanned.get("currency"),
                    scanned.get("total"),
                    total_cad,
                    final_category,
                    Json(scanned.get("items", [])),
                ),
            )
            receipt_id = cur.fetchone()[0]

        receipts_conn.commit()
    finally:
        receipts_conn.close()

    return {
        "receipt_id": receipt_id,
        "person": f"{person['first_name']} {person['last_name']}",
        "category": final_category,
        **scanned,
    }
