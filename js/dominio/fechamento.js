import { STATUS, normalizar } from './agendamento.js';

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
    const cancelados = doDia.filter((a) => a.status === STATUS.cancelados);

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
        faturamentos: concluidos.reduce(somar, 0),
        aReceber: agendados.reduce(somar, 0),
        porServico: Object.values(porServico).sort((a, b) => b.quantidade - a.quantidade),
        encerrado: doDia.length > 0 && doDia.every((a) => a.status !== STATUS.agendado),
        temDomiciliar: doDia.some((a) => a.tipo === 'Domiciliar'),
    };
}