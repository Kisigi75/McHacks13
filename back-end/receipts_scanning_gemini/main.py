from fastapi import FastAPI,UploadFile, File, Form
import psycopg2
from psycopg2.extras import Json
from datetime import date
from scanning import scan_receipt
from db import conn 
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = "_"

@app.get("/receipts")
def get_receipts():
    conn = psycopg2.connect(DATABASE_URL)
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
            "category": r[9],
            "items": r[10],
        }
        for r in rows
    ]


@app.post("/scan")
async def scan(receipt: UploadFile = File(...), person_id: str = Form(...), category: str = Form("")):
    file_bytes = await receipt.read()
    mime = receipt.content_type or "image/jpeg"
    result = scan_receipt(file_bytes, mime)
    return result


@app.get("/employees")
def get_employees():
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

