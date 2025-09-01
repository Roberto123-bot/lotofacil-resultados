// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cron from "node-cron";
import axios from "axios";
import loteriasRoutes from "./routes/loteriasRoutes.js";

// Importa o modelo simplificado que você criou
import Lotofacil from "./models/Lotofacil.js";

// Carrega as variáveis de ambiente
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(loteriasRoutes);

// 🔹 Conexão MongoDB
mongoose.connect(process.env.MONGO_URI);

// 🔹 Função de sincronização simplificada
async function syncLotofacil() {
  try {
    // 1 - Buscar o último concurso na API
    const { data } = await axios.get(
      "https://api.guidi.dev.br/loteria/lotofacil/ultimo"
    );

    const concursoApi = data.numero;
    const dezenasApi = data.listaDezenas;

    console.log(`Último concurso disponível na API: ${concursoApi}`);

    // 2 - Verificar se o concurso já existe no banco
    const concursoExistente = await Lotofacil.findOne({
      concurso: concursoApi,
    });

    if (concursoExistente) {
      console.log(`O Concurso ${concursoApi} já está salvo no banco. ✅`);
      return; // Encerra a execução se o concurso já existe
    }

    // 3 - Criar e salvar o novo documento com concurso e dezenas
    const novoDoc = {
      concurso: concursoApi,
      dezenas: dezenasApi,
    };

    await Lotofacil.create(novoDoc);
    console.log(`✅ Concurso ${concursoApi} salvo com sucesso!`);
  } catch (error) {
    console.error("❌ Erro na sincronização:", error.message);
  }
}

// 🔹 Rota: forçar sincronização manual
app.get("/sync", async (req, res) => {
  try {
    await syncLotofacil();
    res.json({ message: "Sincronização concluída com sucesso 🚀" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao sincronizar: " + error.message });
  }
});

// 🔹 Cron: rodar automaticamente todo dia às 03h
cron.schedule("0 3 * * *", async () => {
  console.log("⏰ Rodando sincronização automática da Lotofácil...");
  await syncLotofacil();
});

// 🔹 Rodar uma vez ao iniciar
syncLotofacil();

// 🔹 Rota base
app.get("/", (req, res) => {
  res.send("Servidor ativo 🚀");
});

// 🔹 Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
