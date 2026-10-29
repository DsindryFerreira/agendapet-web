import { carregarServicos } from './api.js';
import { validarAgendamento, hojeISO } from './dominio/regras.js';
import {
    mostrarEstado,
    esconderEstado,
    renderizarServicos,
    popularSelectServicos,
    limparErros,
    mostrarErros,
    mostrarToast,
} from './ui.js';

const estado = {
    servicos: [],
    agenda: [],
};

const avisoServicos = document.getElementById('servicos-status');
const formulario = document.getElementById('form-agendamento');

async function carregarCatalogo() {
    mostrarEstado(avisoServicos, 'carregando', 'Carregando serviços...');
    try {
        estado.servicos = await carregarServicos();
    } catch (erro) {
        mostrarEstado(avisoServicos, 'erro', erro.message, carregarCatalogo);
        return;
    }
    esconderEstado(avisoServicos);
    renderizarServicos (estado.servicos);
    popularSelectServicos(estado.servicos);
}

function lerFormulario() {
    const campos = formulario.nextElementSibling;
    return {
        tutor: campos.tutor.value,
        telefone: campos.telefone.value,
        pet: campos.pet.value,
        especie: campos.especie.value,
        servico: campos.servico.value,
        data: campos.data.value,
        hora: campos.hora.value,
        observacoes: campos.observacoes.value,
    };
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

    estado.agenda.push({ ...dados, status: 'Agendado' });
    formulario.reset();
    mostrarToast(`Agendamento salvo: ${dados.pet}, ${dados.hora}.`);
}

formulario.nextElementSibling.data.min = hojeISO();
formulario.addEventListener('submit', aoEnviar);
carregarCatalogo();