import { carregarServicos, buscarCep, ErroApi, buscarFeriados, carregarAgendaExemplo } from './api.js';
import { validarAgendamento, hojeISO, limparCep, formatarData, temConflito } from './dominio/regras.js';
import {
    mostrarEstado,
    esconderEstado,
    renderizarServicos,
    popularSelectServicos,
    limparErros,
    mostrarErros,
    mostrarToast,
    atualizarOpcaoDomiciliar,
    mostrarGrupoEndereco,
    preencherEndereco,
    mostrarAvisoFeriado,
    esconderAvisoFeriado,
    renderizarAgenda,
    renderizarFechamento,
    focarItem,
} from './ui.js';
import {
    Servico,
    STATUS,
    criarAgendamento,
    criarGeradorProtocolo,
    maiorProtocolo,
} from './dominio/agendamento.js';
import {
    filtrarAgendamentos,
    porDia,
    porStatus,
    porBusca,
    ordenarPorHorario,
    calcularFechamento,
} from './dominio/fechamento.js';

import { lerJSON, salvarJSON, limparDados } from './storage.js';

const estado = {
    servicos: [],
    agenda: [],
    feriado: null,
    dataAgenda: hojeISO(),
    filtroStatus: 'todos',
    busca: '',
    expandidos: new Set(),
    gerarProtocolo: criarGeradorProtocolo(0),
};

const avisoServicos = document.getElementById('servicos-status');
const formulario = document.getElementById('form-agendamento');
const campoServico = formulario.elements.servico;
const campoDomiciliar = formulario.elements.domiciliar;
const campoCep = formulario.elements.cep;
const statusCep = document.getElementById('cep-status');
let ultimoCep = '';

const campoDataAgenda
 = document.getElementById('data-agenda');
const campoBusca = document.getElementById('busca');
const campoFiltro = document.getElementById('filtro-status');
const listaAgenda = document.getElementById('lista-agenda');

const MENSAGENS_CEP = {
    formato: 'O CEP deve ter 8 dígitos.',
    'nao-encontrado': 'CEP não encontrado. Preencha o endereço manualmente.',
    rede: 'Sem conexão com o serviço de CEP. Preencha o endereço manualmente.',
    http: 'O serviço de CEP está indisponível agora. Preencha o endereço manualmente.'
};

const botaoTema = document.getElementById('btn-tema');
const botaoLimpar = document.getElementById('btn-limpar');
const textoExportacao = document.getElementById('exportacao-texto');
const FILTROS_VALIDOS = ['todos', STATUS.agendado, STATUS.concluido, STATUS.cancelado];
const TEXTO_LIMPAR = 'Limpar meus dados';
let confirmandoLimpeza = false;
let timerConfirmacao = null;

async function carregarCatalogo() {
    mostrarEstado(avisoServicos, 'carregando', 'Carregando serviços...');
    try {
       const dados = await carregarServicos();
       estado.servicos = dados.map((dado) => new Servico(dado));
    } catch (erro) {
        mostrarEstado(avisoServicos, 'erro', erro.message, carregarCatalogo);
        return;
    }
    esconderEstado(avisoServicos);
    renderizarServicos (estado.servicos);
    popularSelectServicos(estado.servicos);
    restaurarAgenda();
}

function atualizarDomiciliar() {
    const servico = estado.servicos.find((s) => s.id === campoServico.value);
    atualizarOpcaoDomiciliar(servico);
}

async function consultarCep() {
  const cep = limparCep(campoCep.value);

  if (cep.length !== 8) {
    ultimoCep = '';
    esconderEstado(statusCep);
    return;
  }
  if (cep === ultimoCep) return;
  ultimoCep = cep;

  mostrarEstado(statusCep, 'carregando', 'Buscando endereço…');
  try {
    const endereco = await buscarCep(cep);
    if (limparCep(campoCep.value) !== cep) return;
    preencherEndereco(endereco);
    mostrarEstado(statusCep, 'sucesso', 'Endereço preenchido. Confira e informe o número.');
    formulario.elements.numero.focus();
  } catch (erro) {
    if (limparCep(campoCep.value) !== cep) return;
    ultimoCep = '';
    const tipo = erro instanceof ErroApi ? erro.tipo : 'http';
    mostrarEstado(statusCep, 'erro', MENSAGENS_CEP[tipo]);
  }
}

function aoSairDoCep() {
    const digitos = limparCep(campoCep.value);
    if (digitos.length > 0 && digitos.length < 8) {
        mostrarEstado(statusCep, 'erro', MENSAGENS_CEP.formato);
    }
}

async function verificarFeriado() {
    const campoData = formulario.elements.data;
    const data = campoData.value;

    estado.feriado = null;
    esconderAvisoFeriado();
    if (data === '') return;

    try {
        const feriados = await buscarFeriados(data.slice(0,4));
        if (campoData.value !== data) return;

        const feriado = feriados.find((f) => f.date === data);
        if (feriado) {
            estado.feriado = feriado;
            mostrarAvisoFeriado(
                `${formatarData(data)} é feriado: ${feriado.name}. Confirme com o tutor antes de agendar.`,
                true
            );
        }
    } catch {
        if (campoData.value !== data) return;
        mostrarAvisoFeriado(
            'Não foi possível verificar se a data é feriado agora. Você pode continuar o agendamento.',
            false
        );
    }
}

function lerFormulario() {
    const campos = formulario.elements;
    return {
        tutor: campos.tutor.value,
        telefone: campos.telefone.value,
        pet: campos.pet.value,
        especie: campos.especie.value,
        servico: campos.servico.value,
        data: campos.data.value,
        hora: campos.hora.value,
        observacoes: campos.observacoes.value,
        domiciliar: campos.domiciliar.checked,
        cep: campos.cep.value,
        logradouro: campos.logradouro.value,
        numero: campos.numero.value,
        complemento: campos.complemento.value,
        bairro: campos.bairro.value,
        cidade: campos.cidade.value,
        uf: campos.uf.value,
        feriadoNome: estado.feriado ? estado.feriado.name : '',
        feriadoConfirmado: campos['feriado-confirmar'].checked,
    };
}

function montarObjetoAgendamento(dados) {
    return {
        protocolo: '',
        tutor: dados.tutor.trim(),
        telefone: dados.telefone.trim(),
        pet: dados.pet.trim(),
        especie: dados.especie,
        servicoId: dados.servico,
        data: dados.data,
        hora: dados.hora,
        status: STATUS.agendado,
        observacoes: dados.observacoes.trim(),
        domiciliar: dados.domiciliar,
        endereco: dados.domiciliar
            ? {
                cep: dados.cep,
                logradouro: dados.logradouro.trim(),
                numero: dados.numero.trim(),
                complemento: dados.complemento.trim(),
                bairro: dados.bairro.trim(),
                cidade: dados.cidade.trim(),
                uf: dados.uf.trim().toUpperCase(),
              }
            : null,
    };
}

function atualizarTela() {
    const doDia = filtrarAgendamentos(estado.agenda, porDia(estado.dataAgenda));
    const visiveis = ordenarPorHorario(
        filtrarAgendamentos(doDia, porStatus(estado.filtroStatus), porBusca(estado.busca))
    );
    renderizarAgenda(visiveis, estado.expandidos, doDia.length);
    renderizarFechamento(calcularFechamento(estado.agenda, estado.dataAgenda));
}

function mudarStatus(protocolo, novoStatus) {
    const agendamento = estado.agenda.find((a) => a.protocolo === protocolo);
    if (!agendamento || !agendamento.alterarStatus(novoStatus)) return;
    salvarAgenda();

    atualizarTela();
    focarItem(protocolo);

    if (novoStatus === STATUS.concluido) {
        mostrarToast(`${protocolo} (${agendamento.pet}) concluído.`);
    } else {
        mostrarToast(`${protocolo} (${agendamento.pet}) cancelado. O horário foi liberado.`, 'info');
    }
}

function alternarDetalhes(protocolo) {
    if (estado.expandidos.has(protocolo)) {
        estado.expandidos.delete(protocolo);
    } else {
        estado.expandidos.add(protocolo);
    }

    atualizarTela();
    focarItem(protocolo);
}

function salvarAgenda() {
    salvarJSON('agenda', estado.agenda.map((a) => a.paraJSON()));
}

function converterAgenda(lista) {
    if (!Array.isArray(lista)) return [];
    const agenda = [];
    for (const dados of lista) {
        try {
            agenda.push(criarAgendamento(dados, estado.servicos));
        } catch {
        }
    }
    return agenda;
}

function restaurarAgenda() {
    estado.agenda = converterAgenda(lerJSON('agenda', []));
    estado.gerarProtocolo = criarGeradorProtocolo(maiorProtocolo(estado.agenda));
    atualizarTela();
}

function aplicarTema(tema) {
    const escuro = tema === 'escuro';
    document.documentElement.dataset.tema = tema;
    botaoTema.setAttribute('aria-pressed', String(escuro));
    botaoTema.textContent = escuro ? 'Tema claro' : 'Tema escuro';
}

function alterarTema() {
    const novo = document.documentElement.dataset.tema === 'escuro' ? 'claro' : 'escuro';
    aplicarTema(novo);
    salvarJSON('tema', novo);
}

function restaurarPreferencia() {
    const filtro = lerJSON('filtro', 'todos');
    estado.filtroStatus = FILTROS_VALIDOS.includes(filtro) ? filtro : 'todos';
    campoFiltro.value = estado.filtroStatus;

    aplicarTema(lerJSON('tema', 'claro') === 'escuro' ? 'escuro' : 'claro');
}

function exportarAgenda() {
    const lista = estado.agenda.map((a) => a.paraJSON());
    textoExportacao.value = JSON.stringify(lista, null, 2);
    document.getElementById('exportacao').hidden = false;
    textoExportacao.focus();
}

async function copiarAgenda() {
    try {
        await navigator.clipboard.writeText(textoExportacao.value);
        mostrarToast('Agenda copiada.');
    } catch {
        textoExportacao.select();
        mostrarToast('Selecione o texto e copie com Ctrl+C.', 'info');
    }
}

function baixarAgenda() {
    const arquivo = new Blob([textoExportacao.value], {type: 'application/json'});
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'agenda.json';
    link.click();
    URL.revokeObjectURL(url);
}

async function carregarExemplo() {
    if (estado.servicos.length === 0) {
        mostrarToast('Aguarde o catálogo de serviços carregar.', 'info');
        return;
    }
    if (estado.agenda.length > 0) {
        mostrarToast('Limpe os dados antes de carregar o exemplo.', 'info');
        return;
    }

    try {
        estado.agenda = converterAgenda(await carregarAgendaExemplo());
    } catch (erro) {
        mostrarToast(erro.message, 'erro');
        return;
    }

    estado.gerarProtocolo = criarGeradorProtocolo(maiorProtocolo(estado.agenda));
    if (estado.agenda.length > 0) {
        estado.dataAgenda = estado.agenda[0].data;
        campoDataAgenda.value = estado.dataAgenda;
    }
    salvarAgenda();
    atualizarTela();
    mostrarToast(`${estado.agenda.length} agendamentos de exemplo carregados.`, 'info');
}

function restaurarBotaoLimpar() {
    confirmandoLimpeza = false;
    botaoLimpar.textContent = TEXTO_LIMPAR;
}

function limparMeusDados() {
    if (!confirmandoLimpeza) {
        confirmandoLimpeza = true;
        botaoLimpar.textContent = 'Clique de novo para confirmar';
        timerConfirmacao = setTimeout(restaurarBotaoLimpar, 4000);
        return;
    }

    clearTimeout(timerConfirmacao);
    restaurarBotaoLimpar();

    const removidos = limparDados();
    estado.agenda = [];
    estado.gerarProtocolo = criarGeradorProtocolo(0);
    estado.expandidos.clear();
    estado.filtroStatus = 'todos';
    campoFiltro.value = 'todos';
    aplicarTema('claro');
    document.getElementById('exportacao').hidden = true;
    atualizarTela();
    mostrarToast(`Dados da AgendaPet removidos (${removidos} itens).`);
} 

function aoEnviar(evento) {
    evento.preventDefault();
    limparErros(formulario);

    const dados = lerFormulario();
    const servicoEscolhido = estado.servicos.find((s) => s.id === dados.servico);
    const erros = validarAgendamento(dados, servicoEscolhido);

    if (Object.keys(erros).length > 0) {
        mostrarErros(erros);
        return;
    }

    const novo = criarAgendamento(montarObjetoAgendamento(dados), estado.servicos);

    if (temConflito(estado.agenda, novo)) {
        mostrarErros({
            hora: `Já existe um atendimento às ${novo.hora} em ${formatarData(novo.data)}. Escolha outro horário.`,
        });
        return;
    }

    novo.protocolo = estado.gerarProtocolo();
    estado.agenda.push(novo);
    salvarAgenda();

    formulario.reset();
    atualizarDomiciliar();
    esconderEstado(statusCep);
    ultimoCep = '';
    esconderAvisoFeriado();
    estado.feriado = null;

    estado.dataAgenda = novo.data;
    campoDataAgenda.value = novo.data;
    estado.busca = '';
    campoBusca.value = '';
    estado.filtroStatus = 'todos';
    campoFiltro.value - 'todos';
    salvarJSON('filtro', 'todos');

    atualizarTela();
    mostrarToast(
        `Agendamento ${novo.protocolo} salvo: ${novo.pet}, ${formatarData(novo.data)} às ${novo.hora}.`
    );
}

formulario.elements.data.min = hojeISO();
formulario.addEventListener('submit', aoEnviar);
campoServico.addEventListener('change', atualizarDomiciliar);
campoDomiciliar.addEventListener('change', () => mostrarGrupoEndereco(campoDomiciliar.checked));
campoCep.addEventListener('input', consultarCep);
campoCep.addEventListener('blur', aoSairDoCep);
atualizarDomiciliar();
formulario.elements.data.addEventListener('change', verificarFeriado);

campoDataAgenda.value = estado.dataAgenda;

campoDataAgenda.addEventListener('change', () => {
    if (campoDataAgenda === '') return;
    estado.dataAgenda = campoDataAgenda.value;
    atualizarTela();
});

campoBusca.addEventListener('input', () => {
    estado.busca = campoBusca.value;
    atualizarTela();
});

campoFiltro.addEventListener('change', () => {
    estado.filtroStatus = campoFiltro.value;
    salvarJSON('filtro', estado.filtroStatus);
    atualizarTela();
});

listaAgenda.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-acao]');
    if (!botao) return;
    const protocolo = botao.closest('.item').dataset.protocolo;

    switch (botao.dataset.acao) {
        case 'concluir':
            mudarStatus(protocolo, STATUS.concluido);
            break;
        case 'cancelar':
            mudarStatus(protocolo, STATUS.cancelado);
            break;
        case 'alternar':
            alternarDetalhes(protocolo);
            break;
    }
});

listaAgenda.addEventListener('mouseover', (evento) => {
    const item = evento.target.closest('.item');
    if (item) item.classList.add('item--realce');
});

listaAgenda.addEventListener('mouseout', (evento) => {
    const item = evento.target.closest('.item');
    if (item && !item.contains(evento.relatedTarget)) item.classList.remove('item--realce');
});

document.addEventListener('keydown', (evento) => {
    if (evento.ctrlKey || evento.metaKey || evento.altKey) return;

    if (evento.key === 'Escape' && evento.target === campoBusca) {
        campoBusca.value = '';
        estado.busca = '';
        atualizarTela();
        return;
    }
    if (evento.target.matches('input, textarea, select')) return;

    if (evento.key === '/') {
        evento.preventDefault();
        campoBusca.focus();
    }
    if (evento.key?.toLowerCase() === 'n') {
        evento.preventDefault();
        formulario.elements.tutor.focus();
    }
});

botaoTema.addEventListener('click', alterarTema);
document.getElementById('btn-exemplo').addEventListener('click', carregarExemplo);
document.getElementById('btn-exportar').addEventListener('click', exportarAgenda);
document.getElementById('btn-copiar').addEventListener('click', copiarAgenda);
document.getElementById('btn-baixar').addEventListener('click', baixarAgenda);
botaoLimpar.addEventListener('click', limparMeusDados);

restaurarPreferencia();

atualizarTela();

carregarCatalogo();