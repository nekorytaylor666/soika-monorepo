# Install required packages for T4 GPU
"""
!pip install cupy-cuda12x  # For CUDA 12.2
!pip install bertopic
!pip install --upgrade cudf-cuda12 dask-cuda-12 cuml-cuda12 cugraph-cuda12
!pip install psycopg2-binary
!pip install plotly
!pip install umap-learn
!pip install hdbscan
!pip install sentence-transformers
"""

import psycopg2
import numpy as np
import pandas as pd
from bertopic import BERTopic
from collections import defaultdict
import cupy as cp
from cuml.preprocessing import normalize
from cuml.manifold import UMAP
from cuml.cluster import HDBSCAN
import warnings
warnings.filterwarnings("ignore")

DATABASE_URL = "postgres://soika_admin:nekorytaylor123@soika.gefest.agency:5432/soika"

def parse_embedding(embedding_str):
    """Convert embedding string to numpy array"""
    if embedding_str is None:
        return None
    values = embedding_str.strip('[]').split(',')
    return cp.array([float(x) for x in values], dtype=cp.float32)  # Specify dtype for better performance

def fetch_ktru_data():
    """Fetch KTRU codes with embeddings from database"""
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    query = """
    SELECT
        code,
        name_ru,
        description_ru,
        embedding::text
    FROM ktru_codes
    WHERE embedding IS NOT NULL
    LIMIT 1000;  -- Start with a smaller subset for testing
    """

    cursor.execute(query)
    results = cursor.fetchall()

    df = pd.DataFrame(results, columns=['code', 'name_ru', 'description_ru', 'embedding'])
    df['embedding'] = df['embedding'].apply(parse_embedding)
    df['document'] = df['name_ru'].fillna('') + ' ' + df['description_ru'].fillna('')

    cursor.close()
    conn.close()

    return df

def analyze_ktru_topics():
    print("Fetching KTRU data...")
    df = fetch_ktru_data()

    print(f"Processing {len(df)} KTRU codes...")

    # Prepare embeddings and documents
    embeddings = cp.vstack(df['embedding'].values)
    documents = df['document'].tolist()

    # Normalize embeddings
    embeddings = normalize(embeddings)

    # Configure GPU-accelerated UMAP with cuML
    umap_model = UMAP(
        n_neighbors=15,
        n_components=5,
        min_dist=0.0,
        metric='cosine',
        random_state=42,
        init="random"  # Specific to cuML implementation
    )

    # Configure HDBSCAN with cuML
    hdbscan_model = HDBSCAN(
        min_cluster_size=15,
        metric='euclidean',
        gen_min_span_tree=True,
        prediction_data=True
    )

    print("\nFitting BERTopic model...")
    topic_model = BERTopic(
        language="russian",
        min_topic_size=20,
        n_gram_range=(1, 3),
        calculate_probabilities=True,
        verbose=True,
        umap_model=umap_model,
        hdbscan_model=hdbscan_model
    )

    # Convert to numpy for BERTopic
    embeddings_np = cp.asnumpy(embeddings)

    try:
        topics, probs = topic_model.fit_transform(documents, embeddings=embeddings_np)

        # Free up GPU memory
        del embeddings
        cp.get_default_memory_pool().free_all_blocks()

        df['topic'] = topics

        print("\n=== Topic Analysis ===")
        topic_info = topic_model.get_topic_info()

        # Save results before visualization to ensure data is captured
        output_df = df[['code', 'name_ru', 'description_ru', 'topic']].copy()
        topic_names = topic_info.set_index('Topic')['Name'].to_dict()
        output_df['topic_name'] = output_df['topic'].map(topic_names)
        output_df.to_csv("ktru_topics.csv", index=False, encoding='utf-8')

        # Generate visualizations
        print("\nGenerating visualizations...")
        topic_model.visualize_topics().write_html("topic_visualization.html")
        topic_model.visualize_documents(df['document']).write_html("document_visualization.html")

        # Print topic analysis
        for topic in topic_info.itertuples():
            if topic.Topic != -1:
                print(f"\nTopic {topic.Topic}: {topic.Name}")
                print(f"Size: {topic.Count} items")

                topic_items = df[df['topic'] == topic.Topic]
                print("\nSample items:")
                for _, item in topic_items.head().iterrows():
                    print(f"\nCode: {item['code']}")
                    print(f"Name: {item['name_ru']}")

                topic_keywords = topic_model.get_topic(topic.Topic)
                print("\nTop keywords and their relevance:")
                for keyword, score in topic_keywords[:5]:
                    print(f"- {keyword}: {score:.3f}")

                print("-" * 80)

        return topic_model, df

    except Exception as e:
        print(f"Error during topic modeling: {str(e)}")
        raise

if __name__ == "__main__":
    # Set memory limit for CuPy to 90% of available GPU memory
    total_memory = cp.cuda.runtime.memGetInfo()[1]
    cp.cuda.set_allocator(cp.cuda.MemoryPool().malloc)
    cp.cuda.set_pinned_memory_allocator(cp.cuda.PinnedMemoryPool().malloc)

    try:
        topic_model, df = analyze_ktru_topics()
    except Exception as e:
        print(f"Error: {str(e)}")
