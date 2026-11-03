import { STATUS } from './dominio/agendamento.js';
import { formatarData, formatarMoeda } from './dominio/regras.js';

export function mostrarEstado(elemento, tipo, texto, aoTentarNovamente) {
    elemento.hidden = false;
    elemento.className = `status status--${tipo}`;
    elemento.textContent = texto;

    if (aoTentarNovamente) {
        const botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'botao botao--secundario botao--pequeno';
        botao.textContent = 'Tentar novamente';
        botao.addEventListener('click', aoTentarNovamente);
        elemento.append(' ', botao);
    }
}

export function esconderEstado(elemento) {
    elemento.hidden = true;
    elemento.textContent = '';
}

export function renderizarServicos(servicos) {
    const lista = document.getElementById('lista-servicos');
    lista.replaceChildren();

    for (const servico of servicos) {
        const item = document.createElement('li');
        item.className = 'servico';

        const topo = document.createElement('div');
        topo.className = 'servico__topo';
        const nome = document.createElement('strong');
        nome.textContent = servico.nome;
        const preco = document.createElement('span');
        preco.className = 'servico__preco';
        preco.textContent = formatarMoeda(servico.preco);
        topo.append(nome, preco);

        const descricao = document.createElement('p');
        descricao.className = 'servico__descricao';
        descricao.textContent = servico.descricao;

        const meta = document.createElement('p');
        meta.className = 'servico__meta';
        const local = servico.domiciliar ? 'faz atendimento domiciliar' : 'somente na loja';
        meta.textContent = `${servico.duracaoMin} min · ${local}`;

        item.append(topo, descricao, meta);
        lista.append(item);
    }
}

export function popularSelectServicos(servicos) {
    const select = document.getElementById('servico');
    select.replaceChildren();

    const vazio = document.createElement('option');
    vazio.value = '';
    vazio.textContent = 'Selecione...';
    select.append(vazio);

    for (const servico of servicos) {
        const opcao = document.createElement('option');
        opcao.value = servico.id;
        opcao.textContent = `${servico.nome} - ${formatarMoeda(servico.preco)}`;
        select.append(opcao);
    }
}

export function limparErros(formulario) {
    for (const mensagem of formulario.querySelectorAll('.campo__erro')) {
        mensagem.hidden = true;
        mensagem.textContent = '';
    }
    for (const campo of formulario.querySelectorAll('[aria-invalid]')) {
        campo.removeAttribute('aria-invalid');
    }
}

export function mostrarErros(erros) {
    let primeiroInvalido = null;

    for (const [nome, texto] of Object.entries(erros)) {
        const campo = document.getElementById(nome);
        const mensagem = document.getElementById(`erro-${nome}`);
        if (!campo || !mensagem) continue;

        campo.setAttribute('aria-invalid', 'true');
        mensagem.setAttribute('role', 'alert');
        mensagem.textContent = texto;
        mensagem.hidden = false;

        if (!primeiroInvalido) primeiroInvalido = campo;
    }

    if (primeiroInvalido) primeiroInvalido.focus();
}    

let timerToast = null;

export function mostrarToast(texto, tipo = 'sucesso', duracaoMs = 4000) {
    const toast = document.getElementById('toast');
    clearTimeout(timerToast);
    toast.className = `toast toast--${tipo}`;
    toast.textContent = texto;
    toast.hidden = false;
    timerToast = setTimeout(() => {
        toast.hidden = true;
    }, duracaoMs);
}

export function mostrarGrupoEndereco(visivel) {
    document.getElementById('grupo-endereco').hidden = !visivel;
}

export function atualizarOpcaoDomiciliar(servico) {
    const caixa = document.getElementById('domiciliar');
    const dica = document.getElementById('dica-domiciliar');

    if (servico && servico.domiciliar) {
        caixa.disable = false;
        dica.textContent = 'Marque para atender na casa do tutor.';
    } else {
        caixa.checked = false;
        caixa.disable = true;
        dica.textContent = servico
            ? `"${servico.nome}" é realizado somente na loja.`
            : 'Escolha um serviço para ver se ele pode ser feito na casa do tutor.';
    }
    mostrarGrupoEndereco(caixa.checked);
}

export function preencherEndereco(endereco) {
    document.getElementById('logradouro').value = endereco.logradouro;
    document.getElementById('bairro').value = endereco.bairro;
    document.getElementById('cidade').value = endereco.cidade;
    document.getElementById('uf').value = endereco.uf;
}

export function mostrarAvisoFeriado(texto, pedirConfirmacao) {
    document.getElementById('feriado-texto').textContent = texto;
    document.querySelector('#feriado-aviso .campo--check').hidden = !pedirConfirmacao;
    document.getElementById('feriado-aviso').hidden = false;
}

export function esconderAvisoFeriado() {
    document.getElementById('feriado-aviso').hidden = true;
    document.getElementById('feriado-confirmar').checked = false;
}

const CLASSE_STATUS = {
    Agendador: 'agendado',
    Concluído: 'concluido',
    Cancelado: 'cancelado',
};

function criarElemento(tag, classe, texto) {
    const elemento = document.createElement(tag);
    if (classe) elemento.className = classe;
    if (texto !== undefined) elemento.textContent = texto;
    return elemento; 
}

function criarBotao(acao, texto, classes, desabilitado) {
    const botao = criarElemento('button', `botao botao--pequeno ${classes}`, texto);
    botao.type = 'button';
    botao.dataset.acao = acao;
    botao.disable = desabilitado;
    return botao;
}

function criarDetalhes(agendamento) {
    const lista = criarElemento('dl', 'item__detalhes');
    const linhas = [
        ['Protocolo', agendamento.protocolo],
        ['Telefone', agendamento.telefone],
        ['Resumo', agendamento.resumo()],
    ];
    if (agendamento.observacoes) {
        linhas.push(['Observações', agendamento.observacoes]);
    }
    for (const [rotulo, valor] of linhas) {
        lista.append(criarElemento('dt', '', rotulo), criarElemento('dd', '', valor));
    }
    return lista;
}

function criarItemAgenda(agendamento, expandido, atrasado) {
    const classeStatus = atrasado ? 'atrasado' :
    CLASSE_STATUS[agendamento.status];

    const item = criarElemento('li', 'item');
    item.dataset.protocolo = agendamento.protocolo;
    if (agendamento.status !== STATUS.agendado || atrasado) item.classList.add(`item--${classeStatus}`);
    if (expandido) item.classList.add('item--expandido');

    const alternar = criarElemento('button', 'item__toggle');
    alternar.type = 'button';
    alternar.dataset.acao = 'alternar';
    alternar.setAttribute('aria-expanded', String(expandido));
    alternar.append(
        criarElemento('span', 'item__hora', agendamento.hora),
        criarElemento('span', 'item__titulo', `${agendamento.pet} · ${agendamento.servico.nome}`),
        criarElemento('span', 'item__tutor', `${agendamento.tutor} (${agendamento.tipo})`)
    );

    const selos = criarElemento('div', 'item__selos');
    selos.append(
        criarElemento('span', `selo selo--${classeStatus}`, atrasado ? 'atrasado' : agendamento.status),
        criarElemento('span', 'item__valor', formatarMoeda(agendamento.calcularValor()))
    );

    const linha = criarElemento('div', 'item__linha');
    linha.append(alternar, selos);

    const travado = agendamento.status !== STATUS.agendado;
    const acoes = criarElemento('div', 'item__acoes');
    acoes.append(
        criarBotao('concluir', 'Concluir', 'botao--principal', travado),
        criarBotao('cancelar', 'Cancelar', 'botao--perigo', travado)
    );

    item.append(linha, acoes);
    if (expandido) item.append(criarDetalhes(agendamento));
    return item;
}

export function renderizarAgenda(lista, expandidos, totalNoDia, atrasados) {
    const ul = document.getElementById('lista-agenda');
    const vazio = document.getElementById('agenda-vazio');
    const contador = document.getElementById('contador');

    ul.replaceChildren();
    for (const agendamento of lista) {
        ul.append(
            criarItemAgenda(
                agendamento, 
                expandidos.has(agendamento.protocolo),
                atrasados.has(agendamento.protocolo)
            )
        );
    }

    contador.textContent = lista.length === 1 ? '1 agendamento' : `${lista.length} agendamentos`;

    vazio.hidden = lista.length > 0;
    if (lista.length === 0) {
        vazio.textContent =
            totalNoDia === 0
                ? 'Nenhum agendamento para este dia. Use o formulário para criar o primeiro.'
                : 'Nenhum agendamento corresponde à busca ou ao filtro';
    }
}

export function renderizarFechamento(fechamento) {
    const situacao = fechamento.encerrado ? 'dia encerrado' : 'dia em andamento';
    document.getElementById('fechamento-data').textContent =
        `${formatarData(fechamento.data)} · ${situacao}`;

    const resumo = document.getElementById('fechamento-resumo');
    resumo.replaceChildren();
    const itens = [
        ['Atendimentos', String(fechamento.total)],
        ['Concluídos', String(fechamento.concluidos)],
        ['Agendados', String(fechamento.agendados)],
        ['Cancelados', String(fechamento.cancelados)],
        ['Faturamento', formatarMoeda(fechamento.faturamento)],
        ['A receber', formatarMoeda(fechamento.aReceber)],
    ];
    for (const [rotulo, valor] of itens) {
        const bloco = criarElemento('div', 'resumo__item');
        bloco.append(
            criarElemento('dt', 'resumo__rotulo', rotulo),
            criarElemento('dd', 'resumo__valor', valor)
        );
        resumo.append(bloco);
    }

    const corpo = document.getElementById('fechamento-servicos');
    corpo.replaceChildren();

    if (fechamento.porServico.length === 0) {
        const linha = document.createElement('tr');
        const celula = criarElemento('td', '', 'Nenhum atendimento ativo neste dia.');
        celula.colSpan = 3;
        linha.append(celula);
        corpo.append(linha);
        return;
    }

    for (const s of fechamento.porServico) {
        const linha = document.createElement('tr');
        linha.append(
            criarElemento('td', '', s.servico),
            criarElemento('td', '', String(s.quantidade)),
            criarElemento('td', '', formatarMoeda(s.faturado))
        );
        corpo.append(linha);
    }
}

export function focarItem(protocolo) {
    const botao = document.querySelector(`.item[data-protocolo="${protocolo}"] .item__toggle`);
    if (botao) botao.focus();
}

export function mostrarRelogio(texto) {
    document.getElementById('relogio').textContent = texto;
}

export function mostrarProximo(texto) {
    document.getElementById('proximo').textContent = texto;
}

export function mostrarLembrete(texto) {
    const lembrete = document.getElementById('lembrete');
    lembrete.textContent = texto;
    lembrete.hidden = false;
}

export function esconderLembrete() {
    const lembrete = document.getElementById('lembrete');
    lembrete.hidden = true;
    lembrete.textContent = '';
}