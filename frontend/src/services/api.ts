import axios from 'axios';

const API_BASE = 'https://localhost:8000';

export const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_BASE}/upload`, formData);
    return response.data;
};

export const indexDocuments = async () => {
    const response = await axios.post(`${API_BASE}/index`);
    return response.data;
};

export const askQuestion = async (question: string) => {
    const response = await axios.post(`${API_BASE}/ask`, { question });
};
