import psycopg2

# Employee database
EMPLOYEE_DATABASE_URL = "postgresql://doadmin:AVNS_t3dZlVEidpe5D7Oqoue@db-mchacks13-rdek-do-user-32143408-0.h.db.ondigitalocean.com:25060/defaultdb"


# Receipts database
RECEIPTS_DATABASE_URL = "postgresql://doadmin:AVNS_Uf3hBRDfQfHECgzKeVZ@db-mchacks13-transactions-do-user-32143408-0.k.db.ondigitalocean.com:25060/defaultdb"


def get_employee_conn():
    return psycopg2.connect(EMPLOYEE_DATABASE_URL)


def get_receipts_conn():
    return psycopg2.connect(RECEIPTS_DATABASE_URL)
