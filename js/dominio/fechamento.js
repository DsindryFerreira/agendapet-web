import { STATUS, normalizar } from './agendamento.js';
import { formatarData, formatarMoeda } from './regras.js';

export function filtrarAgendamentos(lista, ...criterios) {
    return lista.filter((item) => criterios.every((criterio) => criterio(item)));
}

export const porDia = (data) => (agendamentos) => agendamentos.data === data;

export const porStatus = (status) => (agendamento) =>
    status === 'todos' || agendamento.status === status;

export const porBusca = (texto) => {
    const termo = normalizar(texto);
    return (agendamento) => 
        termo === '' ||
        normalizar(agendamento.tutor).includes(termo) ||
        normalizar(agendamento.pet).includes(termo);
};

export function ordenarPorHorario(lista) {
    return [...lista].sort(
        (a, b) => a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora)
    );
}

export function proximoAtendimento(lista, data, horaAtual) {    
    return ordenarPorHorario(lista).find(
        (a) => a.data === data && a.status === STATUS.agendado && a.hora >= horaAtual
    );
}

export function calcularFechamento(lista, data) {
    const doDia = lista.filter((a) => a.data === data);
    const concluidos = doDia.filter((a) => a.status === STATUS.concluido);
    const agendados = doDia.filter((a) => a.status === STATUS.agendado);
    const cancelados = doDia.filter((a) => a.status === STATUS.cancelado);

    const somar = (total, agendamento) => total + agendamento.calcularValor();

    const porServico = {};
    for (const agendamento of doDia.filter((a) => a.ativo)) {
        const id = agendamento.servico.id;
        if (!porServico[id]) {
            porServico[id] = { servico: agendamento.servico.nome, quantidade: 0, faturado: 0};
        }
        porServico[id].quantidade += 1;
        if (agendamento.status === STATUS.concluido) {
            porServico[id].faturado += agendamento.calcularValor();
        }
    }

    return {
        data,
        total: doDia.length,
        concluidos: concluidos.length,
        agendados: agendados.length,
        cancelados: cancelados.length,
        faturamento: concluidos.reduce(somar, 0),
        aReceber: agendados.reduce(somar, 0),
        porServico: Object.values(porServico).sort((a, b) => b.quantidade - a.quantidade),
        encerrado: doDia.length > 0 && doDia.every((a) => a.status !== STATUS.agendado),
        temDomiciliar: doDia.some((a) => a.tipo === 'Domiciliar'),
    };
}

export function estaAtrasado(agendamento, dataHoje, horaAtual) {
    if (agendamento.status !== STATUS.agendado) return false;
    return (
        agendamento.data < dataHoje ||
        (agendamento.data === dataHoje && agendamento.hora < horaAtual)
    );
}

export function protocolosAtrasados(lista, dataHoje, horaAtual) {
    return new Set(
        lista
        .filter((agendamento) => estaAtrasado(agendamento, dataHoje, horaAtual))
        .map((agendamento) => agendamento.protocolo)
    );
}

export function montarLinhasRelatorio(fechamento) {
    const situacao = fechamento.encerrado ? 'dia encerrado' : 'dia em andamento';
    const linhas = [
        `FECHAMENTO DO DIA ${formatarData(fechamento.data)} (${situacao})`,
        '------------------------------------------',
        `Atendimentos: ${fechamento.total}`,
        `Concluídos:   ${fechamento.concluidos}`,
        `Agendados:    ${fechamento.agendados}`,
        `Cancelados:   ${fechamento.cancelados}`,
        `Faturamento:  ${formatarMoeda(fechamento.faturamento)}`,
        `A receber:    ${formatarMoeda(fechamento.aReceber)}`,
        '',
        'Por serviço:',
    ];

    if (fechamento.porServico.length === 0) {
        linhas.push(' Nenhum atendimento ativo neste dia.');
    }
    for (const s of fechamento.porServico) {
        linhas.push(` ${s.servico}: ${s.quantidade} atendimento(s), ${formatarMoeda(s.faturado)}`);
    }
    return linhas;
}

