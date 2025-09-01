// syncLotofacil.js
import mongoose from "mongoose";
import axios from "axios";
import dotenv from "dotenv";

import Lotofacil from "./Lotofacil.js"; // Certifique-se de que o caminho está correto

dotenv.config();

// Função auxiliar para atrasar a execução
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 🔹 Função de sincronização completa
async function syncLotofacil() {
  try {
    console.log("Conectando ao banco de dados...");
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Conexão com o banco de dados estabelecida ✅");

    // 1 - Encontrar o último concurso salvo no banco
    const ultimoSalvo = await Lotofacil.findOne().sort({ concurso: -1 });
    // Se não houver nenhum, a sincronização começa do concurso 1
    const ultimoNumeroSalvo = ultimoSalvo ? ultimoSalvo.concurso : 0;

    console.log(`Último concurso salvo no banco: ${ultimoNumeroSalvo}`);

    // 2 - Buscar o último concurso disponível na API
    const { data: ultimoApi } = await axios.get(
      "https://api.guidi.dev.br/loteria/lotofacil/ultimo"
    );
    const ultimoApiNumero = Number(ultimoApi.numero);

    console.log(`Último concurso disponível na API: ${ultimoApiNumero}`);

    // 3 - Se já está atualizado, encerra
    if (ultimoNumeroSalvo >= ultimoApiNumero) {
      console.log("O banco de dados já está atualizado. ✅");
      return;
    }

    // 4 - Itera e busca todos os concursos faltantes
    for (let i = ultimoNumeroSalvo + 1; i <= ultimoApiNumero; i++) {
      let tentativas = 0;
      const maxTentativas = 5;
      let sucesso = false;

      while (tentativas < maxTentativas && !sucesso) {
        try {
          const { data } = await axios.get(
            `https://api.guidi.dev.br/loteria/lotofacil/${i}`
          );

          // Cria o documento com os campos que você precisa
          const docParaSalvar = {
            concurso: data.numero,
            dezenas: data.listaDezenas,
          };

          await Lotofacil.create(docParaSalvar);
          console.log(`✅ Concurso ${i} salvo com sucesso!`);
          sucesso = true; // Marca como sucesso para sair do loop while
        } catch (err) {
          // Ignora erros de "documento duplicado" (código 11000) e continua
          if (err.code === 11000) {
            console.warn(`⚠️ Aviso: O concurso ${i} já existe. Ignorando...`);
            sucesso = true; // Sai do loop já que o documento já está lá
          } else {
            tentativas++;
            console.error(
              `❌ Tentativa ${tentativas} falhou para o concurso ${i}:`,
              err.message
            );
            if (tentativas < maxTentativas) {
              const tempoEspera = 2000 * tentativas; // Espera mais a cada tentativa
              console.log(
                `Aguardando ${
                  tempoEspera / 1000
                } segundos para tentar novamente...`
              );
              await sleep(tempoEspera);
            }
          }
        }
      }

      if (!sucesso) {
        console.error(
          `🔴 Falha crítica: O concurso ${i} não pôde ser salvo após ${maxTentativas} tentativas. Pulando para o próximo.`
        );
      }
    }

    console.log("Sincronização completa concluída. 🚀");
  } catch (error) {
    console.error("❌ Erro geral na sincronização:", error.message);
  } finally {
    // Garante que a conexão com o banco de dados seja fechada
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log("Conexão com o banco de dados encerrada.");
    }
  }
}

// Inicia a função de sincronização
syncLotofacil();
