from fastapi import FastAPI
from db import conn  # import the single connection

app = FastAPI()

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
        {
            "id": r[0],
            "first_name": r[1],
            "last_name": r[2],
            "department": r[3]
        }
        for r in rows
    ]

