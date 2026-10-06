"use strict";
// Servir os três arquivos no mesmo domínio da API Spring Boot.
const api = "/jogador";
const $ = id => document.getElementById(id);
const ratings = {
    horrivel:45,
    ruim:55,
    mediano:67,
    bom:75,
    otimo:83,
    craque:90,
    lenda:99
};
const labels = {
    horrivel:"Horrível",
    ruim:"Ruim",
    mediano:"Mediano",
    bom:"Bom",
    otimo:"Ótimo",
    craque:"Craque",
    lenda:"Lenda"
};
let players = [];
let selected = null;
let editing = null;
let toastTimer;
const money = value => new Intl.NumberFormat("pt-BR", {
    style:"currency",currency:"BRL",maximumFractionDigits:0
}).format(Number(value)||0);
const esc = value => String(value??"").replace(/[&<>"']/g, c => ( {
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));
function notify(message,error=false) {
    clearTimeout(toastTimer);
    $("notice").textContent=message;
    $("notice").classList.toggle("error",error);
    $("notice").hidden=false;
    toastTimer=setTimeout(()=>$("notice").hidden=true,6000);
}
function card(p) {
    const cat=String(p.desempenho||"").toLowerCase(),
        known=Object.hasOwn(ratings,cat);
    return `<div class="card ${cat==='lenda'||cat==='craque'?'special':['horrivel','ruim','mediano'].includes(cat)?'silver':''}"><div class="rating">${known?ratings[cat]:'—'}<span class="position">${known?'GER':'S/NOTA'}</span></div><div class="portrait"><svg viewBox="0 0 120 130" aria-hidden="true"><circle cx="60" cy="35" r="25" fill="currentColor"/><path d="M8 125V100Q8 70 39 65L60 78L81 65Q112 70 112 100V125Z" fill="currentColor"/><path d="M48 84H72V120H48Z" fill="white" opacity=".15"/></svg></div><div class="player-name">${esc(p.name||'Jogador')}</div><div class="card-data"><div><strong>${esc(p.idade??'—')}</strong>IDADE</div><div><strong style="font-size:13px">${p.valor==null?'—':esc(money(p.valor))}</strong>VALOR</div></div><div class="card-foot">${esc(labels[cat]||p.desempenho||'SEM DESEMPENHO')}</div></div>`;
}
function render() {
    const grid=$("grid");
    grid.replaceChildren();
    $("count").textContent=players.length;
    $("total").textContent=money(players.reduce((sum,p)=>sum+(Number(p.valor)||0),0));
    $("legends").textContent=players.filter(p=>String(p.desempenho).toLowerCase()==='lenda').length;
    if(!players.length) {
        grid.innerHTML='<div class="empty"><div class="empty-icon">♧</div><h3>Seu próximo craque começa aqui.</h3><p>Adicione um jogador ou busque um nome cadastrado para exibir sua carta.</p><button class="primary" id="emptyAdd">＋ Adicionar jogador</button></div>';
        $("emptyAdd").onclick=()=>openEditor();
        return;
    }
    players.forEach(p=> {
        const b=document.createElement('button');b.className='player'; b.setAttribute('aria-label','Ver detalhes de '+p.name); b.innerHTML=card(p)+'<span class="player-hint">VER DETALHES ↗</span>'; b.onclick=()=>openDetail(p);grid.append(b);
    });
}
function openEditor(p=null) {
    editing=p;
    $("playerForm").reset();
    $("formError").hidden=true;
    $("editorTitle").textContent=p?'Editar jogador':'Adicionar jogador';
    $("nome").value=p?.name??'';
    for(const key of ['idade','valor'])$(key).value=p?.[key]??'';
    $("categoria").value=String(p?.desempenho||'mediano').toLowerCase();
    $("editor").showModal();
}
function openDetail(p) {
    selected=p;
    $("detailContent").innerHTML='<div class="detail-card">'+card(p)+'</div><div class="details"><div><span>Nome cadastrado</span><strong>'+esc(p.name)+'</strong></div><div><span>ID na API</span><strong>'+esc(p.id??'Não informado')+'</strong></div></div>';
    $("detail").showModal();
}
async function request(url,options= {
}) {
    let resp;
    try {
        resp=await fetch(url,options)
    } catch {
        throw new Error('Não foi possível conectar à API /jogador. Abra a página pelo servidor Spring Boot.');
    }
    const raw=await resp.text();
    let data=null;
    if(raw) {
        try {
            data=JSON.parse(raw)
        } catch {
        }
    }
    if(!resp.ok) {
        if(resp.status===404)throw new Error('Rota ou jogador não encontrado (404).');
        if(resp.status===409)throw new Error('Já existe um jogador com esse nome.');
        throw new Error(`A API retornou erro ${resp.status}. ${resp.status>=500?'Confira o log do Spring Boot: o serviço atual também retorna erro 500 quando não encontra o jogador.':'A operação não foi concluída.'}`);
    }
    return data;
}
function validPlayer(data) {
    if(!data||typeof data!=='object'||Array.isArray(data)||typeof data.name!=='string')throw new Error('A API não retornou um jogador válido.');
    return data;
}
function findByName(name) {
    return request(`${api}?name=${encodeURIComponent(name)}`).then(validPlayer);
}
function upsert(p,oldId=null) {
    players=players.filter(x=>x.name!==p.name && (p.id==null||x.id!==p.id) && (oldId==null||x.id!==oldId));
    players.push(p);
    render();
}
$("add").onclick=()=>openEditor();
$("clear").onclick=()=> {
    players=[];
    $("searchForm").reset();
    render();
};
$("playerForm").onsubmit=async e=> {
    e.preventDefault();
    const btn=e.submitter;
    btn.disabled=true;
    $("formError").hidden=true;
    const existing=editing;
    try {
        const name=$("nome").value.trim();
        if(!name)throw new Error('Informe um nome válido.');
        const idade=$("idade").value===''?null:Number($("idade").value);
        const valor=$("valor").value===''?null:Number($("valor").value);
        const desempenho=$("categoria").value;
        if(idade!==null&&(!Number.isInteger(idade)||idade<1||idade>120))throw new Error('A idade deve ser um número inteiro entre 1 e 120.');
        if(valor!==null&&(!Number.isFinite(valor)||valor<0))throw new Error('Informe um valor válido, maior ou igual a zero.');
        if(!Object.hasOwn(ratings,desempenho))throw new Error('Selecione o desempenho do jogador.');
        if(existing?.id==null&&existing)throw new Error('Busque o jogador novamente: o ID é obrigatório para atualizar.');
        // O serviço usa jogador.getId(): enviar o ID na URL e no JSON evita criar outro registro.
        const body= {
            name,
            idade,
            valor,
            desempenho
        };
        if(existing)body.id=existing.id;
        await request(existing?`${api}?id=${encodeURIComponent(existing.id)}`:api, {
            method:existing?'PUT':'POST',headers: {
                'Content-Type':'application/json'
            }
            ,body:JSON.stringify(body)
        });
        // POST e PUT retornam ResponseEntity<Void>; recuperar os dados persistidos por nome.
        try {
            const saved=await findByName(name);
            upsert(saved,existing?.id);
            $("editor").close();
            notify(existing?'Jogador atualizado!':'Jogador cadastrado!');
        } catch(err) {
            if(existing) {
                players=players.filter(p=>p.id!==existing.id);
                render();
            }
            $("editor").close();
            notify('A API confirmou o salvamento, mas não foi possível carregar a carta. Busque por "'+name+'". '+err.message,true);
        }
    } catch(err) {
        $("formError").textContent=err.message;
        $("formError").hidden=false;
    } finally {
        btn.disabled=false;
    }
};
$("searchForm").onsubmit=async e=> {
    e.preventDefault();
    const btn=e.submitter;
    btn.disabled=true;
    try {
        const name=$("buscarNome").value.trim();
        if(!name)throw new Error('Informe o nome do jogador.');
        upsert(await findByName(name));
        notify('Jogador encontrado.');
    } catch(err) {
        notify(err.message,true);
    } finally {
        btn.disabled=false;
    }
};
$("edit").onclick=()=> {
    $("detail").close();
    openEditor(selected);
};
$("remove").onclick=()=> {
    $("detail").close();
    $("deleteError").hidden=true;
    $("confirmText").textContent=`Excluir ${selected.name}? Essa ação remove o cadastro na API e não pode ser desfeita nesta página.`;
    $("confirm").showModal();
};
$("confirmRemove").onclick=async()=> {
    const btn=$("confirmRemove");
    btn.disabled=true;
    try {
        if(!selected.name)throw new Error('O jogador não possui nome para exclusão.');
        await request(`${api}?name=${encodeURIComponent(selected.name)}`, {
            method:'DELETE'
        });
        players=players.filter(p=>p.name!==selected.name);
        render();
        $("confirm").close();
        notify('Jogador excluído.');
    } catch(err) {
        $("deleteError").textContent=err.message;
        $("deleteError").hidden=false;
    } finally {
        btn.disabled=false;
    }
};
for(const dialog of document.querySelectorAll('dialog')) {
    dialog.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>dialog.close());
    dialog.addEventListener('click',e=> {
        const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();
    });
}
render();
