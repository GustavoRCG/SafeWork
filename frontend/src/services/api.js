import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000", // Substitua pela porta exata onde a sua API FastAPI está rodando
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
