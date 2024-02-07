import psycopg2
from psycopg2 import OperationalError
import configparser

config = configparser.ConfigParser()
config.read('config/app.ini')
def create_database():
    try:
        conn = psycopg2.connect(
            dbname='postgres',
            user=DATABASE_CONFIG['user'],
            password=DATABASE_CONFIG['password'],
            host=DATABASE_CONFIG['host']
        )
        conn.autocommit = True
        cursor = conn.cursor()
        cursor.execute("CREATE DATABASE music_database")
        print("Database created")

    except OperationalError as e:
        print(f"Error: {e}")

    finally:
        if conn:
            cursor.close()
            conn.close()

def create_tables():
    try:
        conn = psycopg2.connect(
            **DATABASE_CONFIG,
            dbname=DATABASE_CONFIG['dbname']
        )
        conn.autocommit = True
        cursor = conn.cursor()

        # Create users table
        cursor.execute('''CREATE TABLE IF NOT EXISTS users (
                            user_id SERIAL PRIMARY KEY,
                            username VARCHAR(50) UNIQUE,
                            password_hash VARCHAR(100)
                        )''')

        # Create music_files table
        cursor.execute('''CREATE TABLE IF NOT EXISTS music_files (
                            file_id SERIAL PRIMARY KEY,
                            file_name VARCHAR(100),
                            file_path VARCHAR(255),
                            user_id INTEGER,
                            FOREIGN KEY (user_id) REFERENCES users(user_id)
                        )''')

        print("Tables created successfully!")

    except OperationalError as e:
        print(f"Error: {e}")

    finally:
        if conn:
            cursor.close()
            conn.close()

if __name__ == "__main__":
    create_database()
    create_tables()
