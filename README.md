# Document Upload and Indexing System

## Project Overview

This web application allows users to upload documents, index them, and ask questions. The system uses **LLaMA 2** for generating answers based on the content of the indexed document. The frontend is built with **React** and the backend with **FastAPI**.

## Setup and Run Instructions

### Backend Setup (FastAPI)

1. Clone the repository:
    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```

2. Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```

3. Run the backend server:
    ```bash
    uvicorn app:app --reload  # Runs on http://localhost:8000
    ```

### Frontend Setup (React)

1. Clone the repository:
    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```

2. Install JavaScript dependencies:
    ```bash
    npm install
    ```

3. Run the frontend server:
    ```bash
    npm start  # Runs on http://localhost:3000
    ```

### Communication

- Frontend (React) runs on port 3000.
- Backend (FastAPI) runs on port 8000.

## LLaMA 2 Integration

LLaMA 2 is integrated into the backend to generate answers based on uploaded and indexed documents. The backend communicates with LLaMA 2 via the **Replicate API**.

## Research Resources

1. [React Documentation](https://reactjs.org/docs/getting-started.html)
2. [FastAPI Documentation](https://fastapi.tiangolo.com/)
3. [LLaMA 2 by Meta](https://ai.facebook.com/blog/large-language-model-llama-meta-ai/)
4. [Replicate API](https://replicate.com/docs)

## Design Decisions

- **Frontend**: React with Ant Design for a clean and responsive UI.
- **Backend**: FastAPI for high performance and easy integration with LLaMA 2 for text generation.
- **State Management**: React's `useState` to manage file upload, indexing, and query states.

## License

This project is licensed under the MIT License.
