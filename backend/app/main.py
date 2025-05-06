from fastapi import Body, FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from llama_index.core import load_index_from_storage
from llama_index.core.embeddings import BaseEmbedding
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, StorageContext
from llama_index.readers.file import PyMuPDFReader, DocxReader
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
import replicate
import os
from shutil import rmtree
from dotenv import load_dotenv
from pathlib import Path
import aiofiles


# Load environment variables
load_dotenv()

# Initialize Replicate API
REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN")
if not REPLICATE_API_TOKEN:
    raise ValueError("REPLICATE_API_TOKEN not found in environment variables")
os.environ["REPLICATE_API_TOKEN"] = REPLICATE_API_TOKEN

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure directories
BASE_DIR = Path(__file__).parent.parent
UPLOAD_DIR = BASE_DIR / "data" / "uploads"
INDEX_DIR = BASE_DIR / "data" / "index"

# Create directories if they don't exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
INDEX_DIR.mkdir(parents=True, exist_ok=True)

# Initialize local embedding model
embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload file for processing"""
    try:
        # Validate file extension
        valid_extensions = {'.pdf', '.docx', '.txt'}
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in valid_extensions:
            raise HTTPException(400, "Unsupported file type. Please upload PDF, DOCX, or TXT files.")
        
        # Save file
        file_path = UPLOAD_DIR / file.filename
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(await file.read())
        
        return {"status": "success", "file_path": str(file_path)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Upload failed: {str(e)}")

@app.post("/index")
async def index_documents():
    """Index all uploaded documents"""
    try:
        # Check if there are files to index
        if not any(UPLOAD_DIR.iterdir()):
            raise HTTPException(400, "No documents found. Please upload files first.")
        
        # Configure file readers for different formats
        file_extractor = {
            ".pdf": PyMuPDFReader(),
            ".docx": DocxReader(),
        }
        
        documents = SimpleDirectoryReader(
            input_dir=str(UPLOAD_DIR),
            file_extractor=file_extractor,
            required_exts=[".pdf", ".docx", ".txt"]
        ).load_data()
        
        index = VectorStoreIndex.from_documents(
            documents,
            embed_model=embed_model,

        )
        index.storage_context.persist(persist_dir=str(INDEX_DIR))
        return {"status": "success", "message": f"Indexed {len(documents)} documents"}
    except ImportError as e:
        raise HTTPException(400, f"Missing required dependency: {str(e)}")
    except Exception as e:
        raise HTTPException(500, f"Indexing failed: {str(e)}")

@app.post("/ask")
async def ask_question(question: str = Body(..., embed=True)):
    try:
        # Ensure index exists
        if not any(INDEX_DIR.iterdir()):
            raise HTTPException(400, "No documents found. Please upload and index documents first.")

        # Load stored index
        storage_context = StorageContext.from_defaults(persist_dir=str(INDEX_DIR))
        index = load_index_from_storage(
            storage_context=storage_context,
            embed_model=embed_model
        )

        # Retrieve top-k relevant context chunks
        retriever = index.as_retriever(similarity_top_k=3)
        nodes = retriever.retrieve(question)
        context = "\n\n".join([f"{i+1}. {node.text}" for i, node in enumerate(nodes)])

        # Run inference using Replicate's LLaMA 2 7B Chat
        output = replicate.run(
            "meta/llama-2-7b-chat",
            input={
                "prompt": f"""Use the following document excerpts to answer the question as accurately as possible.

Document Excerpts:
{context}

Question: {question}

Answer:""",
                "temperature": 0.7,
                "max_new_tokens": 500
            }
        )

        # Combine output tokens to a string
        answer = "".join(output)

        return {
            "question": question,
            "answer": answer,
            "source_nodes": [
                {"text": node.text, "score": node.score} for node in nodes
            ]
        }

    except Exception as e:
        raise HTTPException(500, f"Failed to get answer: {str(e)}")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "upload_dir": str(UPLOAD_DIR),
        "index_dir": str(INDEX_DIR),
        "embedding_model": "BAAI/bge-small-en-v1.5 (local)",
        "llm": "Replicate (LLaMA 2 7B)"
    }

from shutil import rmtree

@app.delete("/delete")
async def delete_all_data():
    try:
        # Delete all uploaded files
        if UPLOAD_DIR.exists():
            for file in UPLOAD_DIR.iterdir():
                if file.is_file():
                    file.unlink()  # Remove the file
            print(f"All files in {UPLOAD_DIR} deleted successfully.")
        else:
            print(f"Directory {UPLOAD_DIR} does not exist.")

        # Delete index directory and recreate it
        if INDEX_DIR.exists():
            rmtree(INDEX_DIR)  # Remove the entire directory
            print(f"Index directory {INDEX_DIR} deleted.")
        
        # Recreate the index directory
        INDEX_DIR.mkdir(parents=True, exist_ok=True)
        print(f"Index directory {INDEX_DIR} recreated successfully.")

        return {"status": "success", "message": "All uploaded files and index deleted, index recreated."}
    
    except Exception as e:
        # In case of any failure, return error message
        raise HTTPException(status_code=500, detail=f"Failed to delete files and index: {str(e)}")
