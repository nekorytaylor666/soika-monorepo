import psycopg2
import numpy as np
import pandas as pd
from pgvector.psycopg2 import register_vector
from tqdm import tqdm

def fetch_data_from_postgres():
    # Connect to PostgreSQL and register vector type
    conn = psycopg2.connect(
        "postgres://soika_admin:nekorytaylor123@soika.gefest.agency:5432/soika"
    )
    register_vector(conn)

    # Create cursor
    cur = conn.cursor()

    # Get total count first
    cur.execute("""
        SELECT COUNT(*)
        FROM contracts
        WHERE embedding IS NOT NULL
        LIMIT 10000
    """)
    total_rows = cur.fetchone()[0]

    # Initialize lists
    ids, descriptions, embeddings = [], [], []

    # Batch size for fetching
    batch_size = 5000

    # Create progress bar
    pbar = tqdm(total=total_rows, desc="Fetching data")

    # Fetch data in batches using cursor
    cur.execute("""
        DECLARE data_cursor CURSOR FOR
        SELECT
            id,
            description_ru,
            COALESCE(
                trd_buy ->> 'nameRu',
                lot ->> 'nameRu',
                lot ->> 'descriptionRu'
            ) as name,
            embedding
        FROM contracts
        WHERE embedding IS NOT NULL
        LIMIT 10000
    """)

    while True:
        cur.execute(f"FETCH {batch_size} FROM data_cursor")
        batch = cur.fetchall()

        if not batch:
            break

        # Process batch
        for row in batch:
            if row[3] is not None:
                ids.append(row[0])
                # Combine name and description
                name = row[2] if row[2] else ''
                desc = row[1] if row[1] else ''
                full_description = f"{name}\n{desc}" if name and desc else name or desc
                descriptions.append(full_description)
                embeddings.append(np.array(row[3]))

        # Update progress bar
        pbar.update(len(batch))

    # Close cursor and connection
    cur.execute("CLOSE data_cursor")
    cur.close()
    conn.close()
    pbar.close()

    print("Creating DataFrame and embedding matrix...")

    # Create DataFrame
    df = pd.DataFrame({
        'id': ids,
        'description': descriptions
    })

    # Convert embeddings to numpy matrix
    print("Converting embeddings to matrix...")
    embeddings_matrix = np.vstack(embeddings)

    return df, embeddings_matrix

def main():
    try:
        print("Starting data fetch...")
        df, embeddings = fetch_data_from_postgres()
        print(f"Successfully loaded {len(df):,} documents")
        print(f"Embeddings shape: {embeddings.shape}")
        return df, embeddings
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        raise

df, embeddings = main() 