### Q1: What is the cosine similarity formula and how is it used in vector databases?

**Answer:**
Cosine similarity is a formula used to measure how similar two vectors are by comparing the angle between them.

**Formula:**
`cosine_similarity(A, B) = (A · B) / (||A|| × ||B||)`

Where:

* `A · B`: dot product of the vectors
* `||A||` and `||B||`: magnitudes (lengths) of each vector

**Usage in vector DBs:**
When you convert text, images, or other data into embeddings (numerical vectors), cosine similarity helps identify which stored vectors are closest (most similar) to a query vector. This is the basis for similarity search.

**Analogy:**
Imagine all your data as arrows pointing in different directions. Cosine similarity tells you which arrows are pointing in nearly the same direction.

---

### Q2: How do dimensions in embeddings work, and why are they important?

**Answer:**
A vector’s dimension is the number of numerical features it contains. For example, a 300-dimensional vector means it has 300 values representing the data.

* **Higher dimensions** allow for capturing more nuances.
* **Lower dimensions** are faster to compute and store.

**Trade-off:**
Higher dimensions = better accuracy but more compute.
Lower dimensions = faster but potentially less meaningful.

**Analogy:** Think of dimensions like ingredients in a recipe. More ingredients can give better flavor (detail), but also make it harder to cook (compute).

---

### Q3: Does the text get automatically converted into numbers when using a vector database?

**Answer:**
Yes. When you insert text into a vector DB, it uses an **embedding model** to convert that text into a vector (numerical format) before storing it.

You can either:

* Manually pass vectors (if you’ve already created them), or
* Let the vector DB handle the embedding from raw text.

---

### Q4: How do I know what vector size (number of dimensions) to start with?

**Answer:**
Start with standard sizes used in pre-trained embeddings:

* **300 dimensions** is common for word vectors like GloVe.
* Sentence-level models may use 384, 768, or higher.

**Tuning tip:**
Run small experiments with varying dimension sizes to test:

* Retrieval accuracy
* Latency/speed

---

### Q5: How can I evaluate whether my vector dimension size is ideal?

**Answer:**
Use the following steps:

1. Run search with current dimension.
2. Measure response time and match accuracy.
3. Repeat with lower and higher dimensions.
4. Compare to find a good balance.

**Signs it may be too high:**

* Slow searches
* Minimal improvement in relevance

**Too low:**

* Poor relevance or fuzzy matches

---

### Q6: What’s the role of vectors in AI, especially in search and recommendation systems?

**Answer:**
Vectors are the bridge that let AI understand real-world data like text, images, and audio by converting them into a format (numbers) it can work with.

**Used in:**

* Semantic search
* Recommendation engines
* Classification
* Clustering

**Analogy:** Vectors are like DNA for data—they encode its essence so algorithms can analyze and compare it.

---

### Q7: What is the RAG (Retrieval-Augmented Generation) pipeline?

**Answer:**
RAG = Embedding Model + Vector DB + LLM (Large Language Model)

**Steps:**

1. Documents are chunked and passed into the embedding model → turned into vectors
2. Vectors are stored in a vector database
3. A user query is also embedded into a vector
4. Vector DB finds closest matches
5. Retrieved chunks are passed to the LLM to generate a final answer

**Analogy:** Like a smart librarian (vector DB) pulling the right books, and a storyteller (LLM) summarizing them for you.

---

### Q8: What gets stored—word, sentence, or paragraph embeddings?

**Answer:**
Depends on your chunking strategy:

* You can embed each **word**, **sentence**, or even a **paragraph**.
* Some systems embed the **entire document** into one vector, but this is less common.

**Best practice:** Chunk your data into meaningful pieces (sentences or paragraphs), and embed each one separately.

---

### Q9: How does embedding work for continuous data like audio or video?

**Answer:**
Same concept as text, but specialized models are used:

* Audio is chunked into time windows and features (like MFCCs) are embedded.
* Video can be split into frames or scenes and converted into embeddings using vision models.

**Analogy:** Just like breaking a book into chapters and summarizing each, you break audio/video into units and embed each part.

---

### Q10: What does the LLM do in RAG?

**Answer:**
The LLM (like GPT or LLaMA) takes the retrieved text chunks and formulates a coherent answer in natural language.

* It does **not search or retrieve**.
* It generates responses **based on the context** provided from the vector DB.

**Think of it as:** The final narrator using the notes handed over by the librarian.

---

### Q11: Who does the most work in RAG?

**Answer:**
All parts play critical roles:

* **Embedding model** ensures data is vectorized meaningfully.
* **Vector DB** ensures relevant data is found quickly.
* **LLM** ensures a fluent and accurate answer is generated.

**Conclusion:** It's a pipeline where weak links anywhere affect the end result.

---
