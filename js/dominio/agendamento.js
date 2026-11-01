export const CONFIG = Object.freeze({
    abertura: '08:00',
    fechamento: '18:00',
    passoMin: 30,
    cidadeLoja: 'São Paulo',
    taxaNaCidade: 15,
    taxaOutraCidade: 30,
});

export const STATUS = Object.freeze({
    agendado: 'Agendado',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
});

export function normalizar(texto) {
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

export class Servico {
    constructor({ id, nome, descricao, preco, duracaoMin, domiciliar }) {
        this.id = id;
        this.nome = nome;
        this.descricao = descricao;
        this.preco = preco;
        this.duracaoMin = duracaoMin;
        this.domiciliar = domiciliar;
    }
}

export class Agendamento {
    constructor({
        protocolo, tutor, telefone, pet, especie, servico, data, hora, observacoes = '', status = STATUS.agendado,
    }) {
        this.protocolo = protocolo;
        this.tutor = tutor;
        this.telefone = telefone;
        this.pet = pet;
        this.especie = especie;
        this.servico = servico;
        this.data = data;
        this.hora = hora;
        this.observacoes = observacoes;
        this.status = status;
    }

    get ativo() {
        return this.status !== STATUS.cancelado;
    }

    get tipo() {
        return 'Na loja';
    }

    calcularValor() {
        return this.servico.preco;
    }

    resumo() {
        return `${this.pet} (${this.especie}) · ${this.servico.nome} · ${this.hora}`;
    }

    conflitaCom(outro) {
        return (
            this !== outro &&
            this.ativo &&
            outro.ativo &&
            this.data === outro.data &&
            this.hora === outro.hora
        );
    }

    alterarStatus(novoStatus) {
        if (this.status !== STATUS.agendado) return false;
        this.status = novoStatus;
        return true;
    }

    paraJSON() {
        return {
            protocolo: this.protocolo,
            tutor: this.tutor,
            telefone: this.telefone,
            pet: this.pet,
            especie: this.especie,
            servicoId: this.servico.id,
            data: this.data,
            hora: this.hora,
            status: this.status,
            observacoes: this.observacoes,
            domiciliar: false,
            endereco: null,
        };
    }
}

export class AgendamentoDomiciliar extends Agendamento {
    constructor({ endereco, ...dados }) {
        super(dados);
        this.endereco = endereco;
    }

    get tipo() {
        return 'Domiciliar';
    }

    taxaDeslocamento() {
        const naCidadeDaLoja =
            normalizar(this.endereco.cidade) === normalizar(CONFIG.cidadeLoja);
        return naCidadeDaLoja ? CONFIG.taxaNaCidade : CONFIG.taxaOutraCidade;
    }

    calcularValor() {
        return super.calcularValor() + this.taxaDeslocamento();
    }

    enderecoCompleto() {
        const { logradouro, numero, complemento, bairro, cidade, uf } = this.endereco;
        const rua = complemento
            ? `${logradouro}, ${numero} (${complemento})`
            : `${logradouro}, ${numero}`;
        return `${rua} - ${bairro}, ${cidade}/${uf}`;
    }

    resumo() {
        return `${super.resumo()} · Endereço: ${this.enderecoCompleto()}`;
    }

    paraJSON() {
        return { ...super.paraJSON(), domiciliar: true, endereco: this.endereco};
    }
}

const CAMPOS_TEXTO = [
    'protocolo', 'tutor', 'telefone', 'pet', 'especie', 'servicoId', 'data', 'hora',
];

export function criarAgendamento(dados, catalogo) {
    if (!CAMPOS_TEXTO.every((campo) => typeof dados[campo] === 'string')) {
        throw new Error('Agendamento com campos ausentes.');
    }
    if (!Object.values(STATUS).includes(dados.status)) {
        throw new Error(`Status inválido: ${dados.status}`);
    }
    if (dados.domiciliar && !dados.endereco) {
        throw new Error('Atendimento domiciliar sem endereço.');
    }

    const servico = catalogo.find((s) => s.id === dados.servicoId);
    if (!servico) {
        throw new Error(`Serviço inexistente: ${dados.servicoId}`);
    }

    const comuns = {
        protocolo: dados.protocolo,
        tutor: dados.tutor,
        telefone: dados.telefone,
        pet: dados.pet,
        especie: dados.especie,
        servico,
        data: dados.data,
        hora: dados.hora,
        status: dados.status,
        observacoes: dados.observacoes,
    };

    return dados.domiciliar
        ? new AgendamentoDomiciliar({ ...comuns, endereco: dados.endereco})
        : new Agendamento(comuns);
}

export function criarGeradorProtocolo(ultimo = 0) {
    let contador = ultimo;
    return function proximoProtocolo() {
        contador += 1;
        return `AP-${String(contador).padStart(4, '0')}`;
    };
}

export function maiorProtocolo(lista) {
    return lista.reduce((maior, agendamento) => {
        const numero = Number(agendamento.protocolo.replace(/\D/g, ''));
        return Math.max(maior, numero);
    }, 0);
}