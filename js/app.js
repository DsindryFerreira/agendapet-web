import { carregarServicos, buscarCep, ErroApi, buscarFeriados } from './api.js';
import { validarAgendamento, hojeISO, limparCep, formatarData } from './dominio/regras.js';
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
} from './ui.js';

const estado = {
    servicos: [],
    agenda: [],
    feriado: null,
};

const avisoServicos = document.getElementById('servicos-status');
const formulario = document.getElementById('form-agendamento');
const campoServico = formulario.elements.servico;
const campoDomiciliar = formulario.elements.domiciliar;
const campoCep = formulario.elements.cep;
const statusCep = document.getElementById('cep-status');
let ultimoCep = '';

const MENSAGENS_CEP = {
    formato: 'O CEP deve ter 8 dígitos.',
    'nao-encontrado': 'CEP não encontrado. Preencha o endereço manualmente.',
    rede: 'Sem conexão com o serviço de CEP. Preencha o endereço manualmente.',
    http: 'O serviço de CEP está indisponível agora. Preencha o endereço manualmente.'
};

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
    const data = campoCep.Data.value;

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
    esconderAvisoFeriado();
    estado.feriado = null;
    atualizarDomiciliar();
    esconderEstado(statusCep);
    ultimoCep = '';
    mostrarToast(`Agendamento salvo: ${dados.pet}, ${dados.hora}.`);
}

formulario.elements.data.min = hojeISO();
formulario.addEventListener('submit', aoEnviar);
campoServico.addEventListener('change', atualizarDomiciliar);
campoDomiciliar.addEventListener('change', () => mostrarGrupoEndereco(campoDomiciliar.checked));
campoCep.addEventListener('input', consultarCep);
campoCep.addEventListener('blur', aoSairDoCep);
atualizarDomiciliar();
formulario.elements.data.addEventListener('change', verificarFeriado);
carregarCatalogo();