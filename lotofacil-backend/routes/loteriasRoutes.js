import express from "express";
import Lotofacil from "../models/Lotofacil.js"; // Certifique-se de que o caminho está correto

const router = express.Router();

// 🔹 Rota: Análise de frequência de pares (duplas)
router.get("/analise/pares", async (req, res) => {
  try {
    const todosConcursos = await Lotofacil.find({});
    const contagemPares = {};
    for (const concurso of todosConcursos) {
      const dezenas = concurso.dezenas
        .map((d) => parseInt(d))
        .sort((a, b) => a - b);
      for (let i = 0; i < dezenas.length - 1; i++) {
        for (let j = i + 1; j < dezenas.length; j++) {
          // Usa padStart para garantir dois dígitos, adicionando '0' se necessário
          const num1 = String(dezenas[i]).padStart(2, "0");
          const num2 = String(dezenas[j]).padStart(2, "0");
          const par = `${num1}-${num2}`;
          contagemPares[par] = (contagemPares[par] || 0) + 1;
        }
      }
    }
    const resultado = Object.keys(contagemPares).map((par) => ({
      par: par,
      total: contagemPares[par],
    }));
    resultado.sort((a, b) => b.total - a.total);
    res.json(resultado);
  } catch (error) {
    res.status(500).json({
      error: "Erro ao calcular a frequência de pares: " + error.message,
    });
  }
});

// 🔹 Rota: Buscar todos os concursos
router.get("/concursos/todos", async (req, res) => {
  try {
    const todosConcursos = await Lotofacil.find().sort({ concurso: 1 });
    res.json(todosConcursos);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erro ao buscar todos os concursos: " + error.message });
  }
});

// 🔹 Rota: últimos concursos (para tabela de movimentação)
router.get("/concursos/ultimos/:qtd", async (req, res) => {
  try {
    const qtd = parseInt(req.params.qtd) || 10;
    const concursos = await Lotofacil.find().sort({ concurso: -1 }).limit(qtd);
    res.json(concursos.reverse());
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erro ao buscar concursos: " + error.message });
  }
});

// 🔹 Rota: último concurso
router.get("/concursos/ultimo", async (req, res) => {
  try {
    const ultimo = await Lotofacil.findOne().sort({ concurso: -1 });
    if (!ultimo) {
      return res.status(404).json({ error: "Nenhum concurso encontrado" });
    }
    res.json(ultimo);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erro ao buscar último concurso: " + error.message });
  }
});

// 🔹 Rota: análise de frequência
router.get("/analise/frequencia", async (req, res) => {
  try {
    const pipeline = [
      { $unwind: "$dezenas" },
      { $group: { _id: "$dezenas", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ];
    const resultado = await Lotofacil.aggregate(pipeline);
    res.json(
      resultado.map((item) => ({
        dezena: item._id,
        total: item.total,
      }))
    );
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erro ao calcular frequência: " + error.message });
  }
});

// 🔹 Rota: Buscar concurso específico por número
router.get("/concursos/:numero", async (req, res) => {
  try {
    const numeroDoConcurso = parseInt(req.params.numero, 10);
    const concurso = await Lotofacil.findOne({ concurso: numeroDoConcurso });
    if (!concurso) {
      return res.status(404).json({ message: "Concurso não encontrado." });
    }
    res.json(concurso);
  } catch (error) {
    res.status(500).json({
      error: "Erro ao buscar o concurso: " + error.message,
    });
  }
});

export default router;
