import os
import numpy as np
import pandas as pd
import cupy as cp
import cudf
from cuml.cluster import HDBSCAN
from cuml.manifold import UMAP
from openai import OpenAI
from bertopic import BERTopic
from sklearn.feature_extraction.text import CountVectorizer
import nltk
from nltk.corpus import stopwords
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots

# Download Russian stop words
nltk.download('stopwords')
russian_stop_words = stopwords.words('russian')

# Add custom contract-specific stop words
custom_stop_words = russian_stop_words + [
    'договор', 'контракт', 'услуга', 'работа', 'поставка',
    'руб', 'рубль', 'копейка', 'шт', 'штука',
    'заказчик', 'исполнитель', 'поставщик',
    'сумма', 'цена', 'стоимость',
    'срок', 'дата', 'период'
]

def create_russian_topic_model(df, embeddings_matrix):
    print("Converting data to GPU format...")
    # Convert embeddings to GPU
    embeddings_gpu = cp.array(embeddings_matrix)

    # Initialize UMAP for dimensionality reduction
    umap_model = UMAP(
        n_components=5,
        n_neighbors=15,
        min_dist=0.0,
        metric='cosine',
        random_state=42,
        verbose=True
    )

    print("Performing dimensionality reduction with UMAP...")
    # Reduce dimensions
    reduced_embeddings = umap_model.fit_transform(embeddings_gpu)

    print("Initializing HDBSCAN...")
    # Initialize HDBSCAN with cuML implementation
    hdbscan_model = HDBSCAN(
        min_cluster_size=10,
        min_samples=5,
        metric='euclidean',
        prediction_data=True,
        gen_min_span_tree=True,
        verbose=True
    )

    # Initialize CountVectorizer with Russian specifics
    vectorizer_model = CountVectorizer(
        stop_words=custom_stop_words,
        min_df=5,
        ngram_range=(1, 2)
    )

    print("Creating BERTopic model...")
    # Create BERTopic model
    topic_model = BERTopic(
        hdbscan_model=hdbscan_model,
        vectorizer_model=vectorizer_model,
        verbose=True
    )

    print("Fitting BERTopic model...")
    # Fit the model using reduced embeddings
    topics, probs = topic_model.fit_transform(
        df['description'].tolist(),
        embeddings=reduced_embeddings.get()  # Convert back to CPU for BERTopic
    )

    # Add topics to dataframe
    df['topic'] = topics
    df['probability'] = probs
    df['topic_name'] = df['topic'].astype(str)  # Simply use topic numbers as names

    return topic_model, df

def visualize_topics(df, embeddings_matrix, topic_model):
    print("Creating visualizations...")
    
    # Create 2D UMAP projection for visualization
    umap_2d = UMAP(
        n_components=2,
        n_neighbors=15,
        min_dist=0.0,
        metric='cosine',
        random_state=42
    )
    
    # Convert embeddings to GPU and then project to 2D
    embeddings_gpu = cp.array(embeddings_matrix)
    coords_2d = umap_2d.fit_transform(embeddings_gpu).get()
    
    # Create DataFrame for plotting
    plot_df = pd.DataFrame({
        'x': coords_2d[:, 0],
        'y': coords_2d[:, 1],
        'topic': df['topic_name'],
        'description': df['description'].str[:100] + '...'  # Truncate for tooltips
    })
    
    # Create scatter plot
    fig = px.scatter(
        plot_df,
        x='x',
        y='y',
        color='topic',
        hover_data=['description'],
        title='Визуализация тем контрактов',
        labels={'topic': 'Тема'},
        template='plotly_white'
    )
    
    # Update layout
    fig.update_layout(
        width=1200,
        height=800,
        showlegend=True,
        legend_title_text='Темы',
        font=dict(size=12)
    )
    
    # Save interactive plot
    fig.write_html("topic_visualization.html")
    print("Visualization saved as 'topic_visualization.html'")
    
    # Create topic size distribution plot
    topic_sizes = df['topic_name'].value_counts()
    
    fig_dist = px.bar(
        x=topic_sizes.index,
        y=topic_sizes.values,
        title='Распределение размеров тем',
        labels={'x': 'Тема', 'y': 'Количество документов'},
        template='plotly_white'
    )
    
    fig_dist.write_html("topic_distribution.html")
    print("Topic distribution plot saved as 'topic_distribution.html'")



def analyze_topics_russian(df):
    # Print topic distribution
    topic_dist = df['topic_name'].value_counts()
    print("\nРаспределение тем:")
    print(topic_dist)

    # Print sample documents for each topic
    print("\nПримеры документов для каждой темы:")
    for topic_name in df['topic_name'].unique():
        if topic_name != 'Шум':
            print(f"\n--- {topic_name} ---")
            sample_docs = df[df['topic_name'] == topic_name]['description'].head(3)
            for i, doc in enumerate(sample_docs, 1):
                print(f"{i}. {doc[:200]}...")

def save_results_to_postgres(df):
    conn = psycopg2.connect(
        "postgres://soika_admin:nekorytaylor123@soika.gefest.agency:5432/soika"
    )
    cur = conn.cursor()

    # Create topics table if it doesn't exist
    cur.execute("""
        CREATE TABLE IF NOT EXISTS contract_topics (
            contract_id INT PRIMARY KEY,
            topic_id INT,
            topic_name TEXT,
            topic_probability FLOAT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Insert or update results
    for _, row in df.iterrows():
        cur.execute("""
            INSERT INTO contract_topics (contract_id, topic_id, topic_name, topic_probability)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (contract_id)
            DO UPDATE SET
                topic_id = EXCLUDED.topic_id,
                topic_name = EXCLUDED.topic_name,
                topic_probability = EXCLUDED.topic_probability,
                created_at = CURRENT_TIMESTAMP
        """, (row['id'], row['topic'], row['topic_name'], row['probability']))

    conn.commit()
    cur.close()
    conn.close()

# Usage example
def main():
    # Fetch data using the previous function
    # df, embeddings = fetch_data_from_postgres()

    print(f"Загружено {len(df)} документов с размерностью эмбеддингов {embeddings.shape}")

    # Create topic model
    topic_model, df_with_topics = create_russian_topic_model(df, embeddings)

    # Analyze topics
    analyze_topics_russian(df_with_topics)

    # Add visualization
    visualize_topics(df_with_topics, embeddings, topic_model)

    # Save results
    # save_results_to_postgres(df_with_topics)

    print("\nРезультаты сохранены в базу данных")
main()