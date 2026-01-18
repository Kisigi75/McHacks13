from fastapi import FastAPI
import psycopg2
import json

app = FastAPI()

DATABASE_URL = "postgresql://doadmin:AVNS_Uf3hBRDfQfHECgzKeVZ@db-mchacks13-transactions-do-user-32143408-0.k.db.ondigitalocean.com:25060/defaultdb"

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
