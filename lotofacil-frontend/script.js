const API_URL = "http://localhost:3000";
let currentConcurso = null;

// Elementos da página do visualizador
const visualizadorConcursos = document.getElementById("visualizador-concursos");
const loadingElement = document.getElementById("loading");
const resultInfoElement = document.getElementById("result-info");
const gridContainer = document.getElementById("grid-container");
const concursoInput = document.getElementById("concurso-input");
const btnPrev = document.getElementById("btn-prev");
const btnNext = document.getElementById("btn-next");
const btnBuscar = document.getElementById("btn-buscar");

// Elementos da página de análise de pares
const analisePares = document.getElementById("analise-pares");
const loadingPares = document.getElementById("loading-pares");
const paresTableBody = document.getElementById("pares-table-body");
const linkPares = document.getElementById("link-pares");

// Elementos da nova página de movimento
const tabelaMovimento = document.getElementById("tabela-movimento");
const loadingMovimento = document.getElementById("loading-movimento");
const movimentoTableBody = document.getElementById("movimento-table-body");
const linkMovimento = document.getElementById("link-movimento");

const montarEtestar = document.getElementById("montar");
const linkMontar = document.getElementById("link-montar");
const linkInicio = document.getElementById("link-inicio");

// Cria o painel de 25 números uma única vez
for (let i = 1; i <= 25; i++) {
  const gridItem = document.createElement("div");
  gridItem.textContent = String(i).padStart(2, "0");
  gridItem.classList.add("grid-item", "not-drawn");
  gridContainer.appendChild(gridItem);
}

async function fetchConcurso(concursoNumber) {
  loadingElement.classList.remove("hidden");
  resultInfoElement.innerHTML = "";

  try {
    const url = concursoNumber
      ? `${API_URL}/concursos/${concursoNumber}`
      : `${API_URL}/concursos/ultimo`;
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok && data && data.dezenas) {
      currentConcurso = data.concurso;
      concursoInput.value = currentConcurso;
      resultInfoElement.innerHTML = `<h2 class="text-xl font-semibold">Concurso: ${data.concurso}</h2>`;

      const dezenasSorteadas = new Set(data.dezenas);
      const gridItems = gridContainer.querySelectorAll(".grid-item");

      // Atualiza cada número, sem recriar os elementos
      gridItems.forEach((item) => {
        const number = item.textContent;
        const isDrawn = dezenasSorteadas.has(number);
        if (isDrawn) {
          item.classList.add("drawn");
          item.classList.remove("not-drawn");
        } else {
          item.classList.add("not-drawn");
          item.classList.remove("drawn");
        }
      });
    } else {
      resultInfoElement.innerHTML = `<p class="text-red-500">Concurso ${concursoNumber} não encontrado.</p>`;
      concursoInput.value = "";
    }
  } catch (error) {
    console.error("Erro ao buscar resultado:", error);
    resultInfoElement.innerHTML = `<p class="text-red-500">Erro ao carregar o resultado. Verifique sua conexão e o servidor.</p>`;
  } finally {
    loadingElement.classList.add("hidden");
  }
}

async function fetchPares() {
  loadingPares.classList.remove("hidden");
  paresTableBody.innerHTML = "";

  try {
    const url = `${API_URL}/analise/pares`;
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok && data) {
      // Preenche a tabela com os dados de pares
      data.forEach((item) => {
        const row = document.createElement("tr");
        // Ajusta a formatação para ter o zero à esquerda
        const [num1, num2] = item.par.split("-");
        const formattedPar = `${String(num1).padStart(2, "0")}-${String(
          num2
        ).padStart(2, "0")}`;
        row.innerHTML = `
                            <td>${formattedPar}</td>
                            <td>${item.total}</td>
                        `;
        paresTableBody.appendChild(row);
      });
    } else {
      paresTableBody.innerHTML = `<tr><td colspan="2" class="text-center">Nenhum dado de pares encontrado.</td></tr>`;
    }
  } catch (error) {
    console.error("Erro ao buscar análise de pares:", error);
    paresTableBody.innerHTML = `<tr><td colspan="2" class="text-center text-red-500">Erro ao carregar a análise de pares.</td></tr>`;
  } finally {
    loadingPares.classList.add("hidden");
  }
}

async function fetchMovimento(quantidade = 10) {
  loadingMovimento.classList.remove("hidden");
  movimentoTableBody.innerHTML = "";

  try {
    const url = `${API_URL}/concursos/ultimos/${quantidade}`;
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok && data.length > 0) {
      // Criar tabela
      const table = document.createElement("table");
      table.classList.add("table", "table-bordered", "text-center");

      // Cabeçalho
      const thead = document.createElement("thead");
      const headRow = document.createElement("tr");
      headRow.innerHTML = `<th>CONCURSO</th>`;
      for (let i = 1; i <= 25; i++) {
        headRow.innerHTML += `<th>${String(i).padStart(2, "0")}</th>`;
      }
      thead.appendChild(headRow);
      table.appendChild(thead);

      // Corpo da tabela
      const tbody = document.createElement("tbody");

      data.forEach((concurso) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td><strong>${concurso.concurso}</strong></td>`;

        for (let i = 1; i <= 25; i++) {
          const numero = String(i).padStart(2, "0");
          const sorteado = concurso.dezenas.includes(numero);
          row.innerHTML += `
            <td style="padding:4px;">
              <span style="
                display:inline-block;
                width:28px; height:28px;
                line-height:28px;
                border-radius:6px;
                font-size:0.9rem;
                ${sorteado ? "background:#6a1b9a; color:#fff;" : "color:#555;"}
              ">${numero}</span>
            </td>
          `;
        }
        tbody.appendChild(row);
      });

      table.appendChild(tbody);
      movimentoTableBody.appendChild(table);
    } else {
      movimentoTableBody.innerHTML = `<p class="text-center">Nenhum dado encontrado.</p>`;
    }
  } catch (error) {
    console.error("Erro ao buscar tabela de movimento:", error);
    movimentoTableBody.innerHTML = `<p class="text-center text-red-500">Erro ao carregar a tabela.</p>`;
  } finally {
    loadingMovimento.classList.add("hidden");
  }
}

btnBuscar.addEventListener("click", () => {
  const numero = concursoInput.value;
  if (numero) {
    fetchConcurso(numero);
  }
});

btnPrev.addEventListener("click", () => {
  if (currentConcurso && currentConcurso > 1) {
    fetchConcurso(currentConcurso - 1);
  }
});

btnNext.addEventListener("click", () => {
  if (currentConcurso) {
    fetchConcurso(currentConcurso + 1);
  }
});

// Adiciona os eventos de clique para alternar as páginas
linkPares.addEventListener("click", (e) => {
  e.preventDefault();
  visualizadorConcursos.classList.add("hidden");
  tabelaMovimento.classList.add("hidden");
  montarEtestar.classList.add("hidden");
  analisePares.classList.remove("hidden");
  fetchPares();
});

linkMovimento.addEventListener("click", (e) => {
  e.preventDefault();
  visualizadorConcursos.classList.add("hidden");
  analisePares.classList.add("hidden");
  montarEtestar.classList.add("hidden");
  tabelaMovimento.classList.remove("hidden");
  fetchMovimento(); // Chama a nova função
});

linkMontar.addEventListener("click", (e) => {
  e.preventDefault();
  visualizadorConcursos.classList.add("hidden");
  analisePares.classList.add("hidden");
  tabelaMovimento.classList.add("hidden");
  montarEtestar.classList.remove("hidden");
  iniciarMontarTeste();
});

linkInicio.addEventListener("click", (e) => {
  e.preventDefault();
  visualizadorConcursos.classList.remove("hidden");
  analisePares.classList.add("hidden");
  tabelaMovimento.classList.add("hidden");
  montarEtestar.classList.add("hidden");
  fetchConcurso();
});

// Carregar o último concurso ao iniciar a página
document.addEventListener("DOMContentLoaded", () => {
  fetchConcurso();
});
