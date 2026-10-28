import { CONFIG } from './agendamento.js';

export function paraMinutos(hora) {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
}

export function hojeISO() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

function minutosAgora() {
    const agora = new Date();
    return agora.getHours() * 60 + agora.getMinutes();
}

export function telefoneValido(telefone) {
    const digitos = telefone.replace(/\D/g, '');
    return digitos.length === 10 || digitos.length === 11;
}

export function horarioDentroDoFuncionamento(hora, duracaoMin) {
    const inicio = paraMinutos(hora);
    const abertura = paraMinutos(CONFIG.abertura);
    const fechamento = paraMinutos(CONFIG.fechamento);
    const noPasso = (inicio - abertura) % CONFIG.passoMin === 0;
    return inicio >= abertura && inicio + duracaoMin <= fechamento && noPasso;
}

export function validarAgendamento(dados, servicoEscolhido) {
    const erros = {};

    if (dados.tutor.trim().length < 3) {
        erros.tutor = 'Informe o nome do tutor (mínimo 3 letras).';
    }
    if (!telefoneValido(dados.telefone)) {
        erros.telefone = 'Informe um telefone com DDD (10 ou 11 dígitos).';
    }
    if (dados.pet.trim() === '') {
        erros.pet = 'Informe o nome do pet.';
    }
    if (dados.especie === '') {
        erros.especie = 'Selecione a espécie.';
    }
    if (dados.servico === '') {
        erros.servico = 'Selecione um serviço.';
    }

    if (dados.data === '') {
        erros.data = 'Informe a data.';
    } else if (dados.data < hojeISO()) {
        erros.data = 'Não é possível agendar em uma data que já passou.';
    }

    if (dados.hora === '') {
        erros.hora = 'Informe o horário.';
    } else {
        const duracao = servicoEscolhido ? servicoEscolhido.duracaoMin : 0;
        if (!horarioDentroDoFuncionamento(dados.hora, duracao)) {
            erros.hora = 'Fora do funcionamento: atendemos das 08:00 às 18:00, em horários de 30 em 30 minutos, e o serviço precisa terminar até o fechamento.';
        } else if (dados.data === hojeISO() && paraMinutos(dados.hora) <= minutosAgora()) {
            erros.hora = 'Esse horário de hoje já passou.'
        }
    }

    return erros;
}