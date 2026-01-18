import psycopg2

DATABASE_URL = "postgresql://doadmin:AVNS_t3dZlVEidpe5D7Oqoue@db-mchacks13-rdek-do-user-32143408-0.h.db.ondigitalocean.com:25060/defaultdb"

conn = psycopg2.connect(DATABASE_URL)