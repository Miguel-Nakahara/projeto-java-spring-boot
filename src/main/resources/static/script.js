"use strict";

const api = "/jogador";
const $ = id => document.getElementById(id);
const ratings = {
    horrivel: 45,
    ruim: 55,
    mediano: 67,
    bom: 75,
    otimo: 83,
    craque: 90,
    lenda: 99
};
const labels = {
    horrivel: "Horrível",
    ruim: "Ruim",
    mediano: "Mediano",
    bom: "Bom",
    otimo: "Ótimo",
    craque: "Craque",
    lenda: "Lenda"
};
let players = [];
let selected = null;
let editing = null;
let toastTimer;

const money = value => new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
}).format(Number(value) || 0);

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
}[character]));

function notify(message, error = false) {
    clearTimeout(toastTimer);
    $("notice").textContent = message;
    $("notice").classList.toggle("error", error);
    $("notice").hidden = false;
    toastTimer = setTimeout(() => $("notice").hidden = true, 5000);
}

async function request(url, options = {}) {
    let response;
    try {
        response = await fetch(url, options);
    } catch {
        throw new Error("Não foi possível conectar ao Spring Boot. Verifique se o servidor está em execução.");
    }

    const raw = await response.text();
    let data = null;
    if (raw) {
        try {
            data = JSON.parse(raw);
        } catch {
            data = raw;
        }
    }

    if (!response.ok) {
        const message = typeof data === "object" && data
            ? data.detail || data.message || data.error
            : data;
        if (response.status === 404) {
            throw new Error(message || "Jogador ou rota não encontrado.");
        }
        if (response.status === 409) {
            throw new Error(message || "Já existe um jogador com esse nome.");
        }
        throw new Error(message || `A API retornou o erro ${response.status}.`);
    }

    return data;
}

function getRating(player) {
    const category = String(player.desempenho || "").toLowerCase();
    return ratings[category] || 0;
}

function getCardClass(player) {
    const category = String(player.desempenho || "").toLowerCase();
    if (category === "lenda" || category === "craque") return "special";
    if (category === "horrivel" || category === "ruim" || category === "mediano") return "silver";
    return "gold";
}

function playerCard(player, compact = false) {
    const category = String(player.desempenho || "").toLowerCase();
    const rating = getRating(player);
    return `
        <div class="player-card ${getCardClass(player)} ${compact ? "compact" : "large"}">
            <div class="card-topline"><span>FC 27</span><span>ULTIMATE TEAM</span></div>
            <div class="card-rating">${rating || "—"}<span>GER</span></div>
            <div class="card-player-art" aria-hidden="true">
                <svg viewBox="0 0 150 164">
                    <circle cx="75" cy="42" r="29" fill="currentColor" opacity=".82"/>
                    <path d="M24 158v-29c0-29 18-48 51-48s51 19 51 48v29z" fill="currentColor" opacity=".6"/>
                    <path d="M55 84l20 17 20-17 9 74H46z" fill="currentColor" opacity=".25"/>
                    <path d="M63 101h24v57H63z" fill="#fff" opacity=".12"/>
                </svg>
            </div>
            <div class="card-player-name">${escapeHtml(player.name || "Jogador")}</div>
            <div class="card-details">
                <div><strong>${escapeHtml(player.idade ?? "—")}</strong><span>IDADE</span></div>
                <div><strong>${escapeHtml(labels[category] || player.desempenho || "—")}</strong><span>DESEMPENHO</span></div>
            </div>
            <div class="card-value">${player.valor == null ? "Valor não informado" : money(player.valor)}</div>
        </div>
    `;
}

function getVisiblePlayers() {
    const term = $("buscarNome").value.trim().toLocaleLowerCase("pt-BR");
    if (!term) return players;
    return players.filter(player => String(player.name || "").toLocaleLowerCase("pt-BR").includes(term));
}

function renderSummary() {
    $("count").textContent = players.length;
    $("listCount").textContent = players.length;
    $("total").textContent = money(players.reduce((sum, player) => sum + (Number(player.valor) || 0), 0));
    $("legends").textContent = players.filter(player => String(player.desempenho).toLowerCase() === "lenda").length;
}

function renderList() {
    const grid = $("grid");
    const visiblePlayers = getVisiblePlayers();
    grid.replaceChildren();

    if (!visiblePlayers.length) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.innerHTML = players.length
            ? `<div class="empty-icon">⌕</div><h3>Nenhum jogador encontrado</h3><p>Não há atletas com o nome informado. Limpe a pesquisa para ver o elenco completo.</p>`
            : `<div class="empty-icon">♙</div><h3>Seu elenco ainda está vazio</h3><p>Cadastre o primeiro jogador para começar a montar seu mercado de transferências.</p><button class="primary-button" id="emptyAdd" type="button">＋ Cadastrar jogador</button>`;
        grid.append(empty);
        const emptyAdd = $("emptyAdd");
        if (emptyAdd) emptyAdd.onclick = () => openEditor();
        return;
    }

    visiblePlayers.forEach(player => {
        const row = document.createElement("button");
        row.type = "button";
        row.className = `player-row${selected && selected.id === player.id ? " selected" : ""}`;
        row.setAttribute("aria-label", `Selecionar ${player.name}`);
        row.setAttribute("aria-pressed", String(Boolean(selected && selected.id === player.id)));
        row.innerHTML = `
            <span class="row-identity"><span class="row-card">${playerCard(player, true)}</span><span class="row-player-name"><strong>${escapeHtml(player.name)}</strong><small>ID #${escapeHtml(player.id ?? "—")}</small></span></span>
            <span class="row-age">${escapeHtml(player.idade ?? "—")} <small>anos</small></span>
            <span class="row-performance"><i class="performance-dot ${escapeHtml(String(player.desempenho || "").toLowerCase())}"></i>${escapeHtml(labels[String(player.desempenho || "").toLowerCase()] || player.desempenho || "—")}</span>
            <span class="row-value">${player.valor == null ? "—" : money(player.valor)}</span>
            <span class="row-arrow">›</span>
        `;
        row.onclick = () => {
            selected = player;
            render();
        };
        grid.append(row);
    });
}

function renderInspector() {
    const container = $("detailContent");
    if (!selected) {
        container.innerHTML = `
            <div class="inspector-empty">
                <div class="empty-emblem">♙</div>
                <h2>Selecione um jogador</h2>
                <p>Escolha um atleta na lista para visualizar sua carta e acessar as opções de edição.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="selected-card-wrap">${playerCard(selected)}</div>
        <div class="selected-player-heading">
            <span class="eyebrow">JOGADOR SELECIONADO</span>
            <h2>${escapeHtml(selected.name)}</h2>
            <span class="selected-status"><i class="status-dot"></i> CADASTRADO NO CLUBE</span>
        </div>
        <div class="detail-stats">
            <div><span>IDADE</span><strong>${escapeHtml(selected.idade ?? "—")} anos</strong></div>
            <div><span>DESEMPENHO</span><strong>${escapeHtml(labels[String(selected.desempenho || "").toLowerCase()] || selected.desempenho || "—")}</strong></div>
            <div class="detail-value"><span>VALOR DE MERCADO</span><strong>${selected.valor == null ? "Não informado" : money(selected.valor)}</strong></div>
            <div><span>ID DO CADASTRO</span><strong>#${escapeHtml(selected.id ?? "—")}</strong></div>
        </div>
        <div class="inspector-actions">
            <button class="primary-button" id="edit" type="button">✎ Editar jogador</button>
            <button class="danger-outline-button" id="remove" type="button">Excluir jogador</button>
        </div>
    `;

    $("edit").onclick = () => openEditor(selected);
    $("remove").onclick = openDeleteConfirmation;
}

function render() {
    renderSummary();
    renderList();
    renderInspector();
}

async function loadPlayers(showNotice = false) {
    $("grid").innerHTML = '<div class="loading-state">Sincronizando jogadores com o servidor...</div>';
    try {
        const data = await request(`${api}/todos`);
        if (!Array.isArray(data)) throw new Error("A API não retornou uma lista válida de jogadores.");
        players = data;
        if (selected) {
            selected = players.find(player => player.id === selected.id) || null;
        }
        if (!selected && players.length) selected = players[0];
        render();
        if (showNotice) notify("Lista de jogadores atualizada.");
    } catch (error) {
        $("grid").innerHTML = `<div class="load-error"><strong>Não foi possível carregar o elenco</strong><span>${escapeHtml(error.message)}</span><button class="secondary-button" id="retry" type="button">Tentar novamente</button></div>`;
        $("retry").onclick = () => loadPlayers();
        renderSummary();
        renderInspector();
    }
}

function openEditor(player = null) {
    editing = player;
    $("playerForm").reset();
    $("formError").hidden = true;
    $("editorTitle").textContent = player ? "Editar jogador" : "Cadastrar jogador";
    $("nome").value = player?.name ?? "";
    $("idade").value = player?.idade ?? "";
    $("valor").value = player?.valor ?? "";
    $("categoria").value = String(player?.desempenho || "mediano").toLowerCase();
    $("editor").showModal();
    $("nome").focus();
}

function openDeleteConfirmation() {
    if (!selected) return;
    $("deleteError").hidden = true;
    $("confirmText").textContent = `Tem certeza de que deseja excluir ${selected.name}? O cadastro será removido do banco de dados e esta ação não poderá ser desfeita.`;
    $("confirm").showModal();
}

function validatePlayer(name, age, value, performance) {
    if (!name) throw new Error("Informe o nome do jogador.");
    if (!Number.isInteger(age) || age < 1 || age > 120) throw new Error("A idade deve ser um número inteiro entre 1 e 120.");
    if (!Number.isFinite(value) || value < 0) throw new Error("Informe um valor válido, maior ou igual a zero.");
    if (!Object.hasOwn(ratings, performance)) throw new Error("Selecione o desempenho do jogador.");
}

$("add").onclick = () => openEditor();
$("refresh").onclick = () => loadPlayers(true);

$("clear").onclick = () => {
    $("buscarNome").value = "";
    renderList();
};

$("searchForm").onsubmit = event => {
    event.preventDefault();
    renderList();
    if (!getVisiblePlayers().length && $("buscarNome").value.trim()) {
        notify("Nenhum jogador corresponde à pesquisa.", true);
    }
};

$("playerForm").onsubmit = async event => {
    event.preventDefault();
    const button = event.submitter;
    button.disabled = true;
    $("formError").hidden = true;

    const name = $("nome").value.trim();
    const idade = Number($("idade").value);
    const valor = Number($("valor").value);
    const desempenho = $("categoria").value;

    try {
        validatePlayer(name, idade, valor, desempenho);
        const body = { name, idade, valor, desempenho };
        const options = {
            method: editing ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        };
        const url = editing ? `${api}?id=${encodeURIComponent(editing.id)}` : api;
        await request(url, options);
        const oldId = editing?.id;
        $("editor").close();
        await loadPlayers();
        const saved = players.find(player => oldId != null ? player.id === oldId : player.name === name);
        if (saved) selected = saved;
        render();
        notify(editing ? "Jogador atualizado com sucesso." : "Jogador cadastrado com sucesso.");
        editing = null;
    } catch (error) {
        $("formError").textContent = error.message;
        $("formError").hidden = false;
    } finally {
        button.disabled = false;
    }
};

$("confirmRemove").onclick = async () => {
    if (!selected) return;
    const button = $("confirmRemove");
    const removedPlayer = selected;
    button.disabled = true;
    $("deleteError").hidden = true;

    try {
        await request(`${api}?name=${encodeURIComponent(removedPlayer.name)}`, { method: "DELETE" });
        players = players.filter(player => player.id !== removedPlayer.id);
        selected = players[0] || null;
        $("confirm").close();
        render();
        notify("Jogador excluído com sucesso.");
    } catch (error) {
        $("deleteError").textContent = error.message;
        $("deleteError").hidden = false;
    } finally {
        button.disabled = false;
    }
};

document.querySelectorAll("dialog").forEach(dialog => {
    dialog.querySelectorAll("[data-close]").forEach(button => {
        button.onclick = () => dialog.close();
    });
    dialog.addEventListener("click", event => {
        if (event.target === dialog) dialog.close();
    });
});

loadPlayers();
