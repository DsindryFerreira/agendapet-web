import { limparCep, cepValido } from './dominio/regras.js';
import { lerJSON, salvarJSON } from './storage.js';

export class ErroApi extends Error {
  constructor(tipo, mensagem) {
    super(mensagem);
    this.name = 'ErroApi';
    this.tipo = tipo;
  }
}

async function buscarJSON(url, mensagemHttp) {
    let resposta;
    try {
        resposta = await fetch(url);
    } catch {
        throw new ErroApi('rede', 'Sem conexão com o servidor.');
    }
    if (!resposta.ok) {
        throw new ErroApi('rede',`${mensagemHttp} (erro HTTP ${resposta.status}).`);
    }
    return resposta.json();
}

export const carregarServicos = () =>
    buscarJSON('data/servicos.json', 'Não foi possível carregar os serviços');

export async function buscarCep(cep) {
    if (!cepValido(cep)) {
        throw new ErroApi('formato', 'O CEP deve ter 8 dígitos.');
    }

    const dados = await buscarJSON(
        `https://viacep.com.br/ws/${limparCep(cep)}/json/`,
        'O serviço de CEP está indisponível agora.'
    );

    if (dados.erro) {
        throw new ErroApi('nao-encontrado', 'CEP não encontrado.');
    }

    return {
        cep: dados.cep,
        logradouro: dados.logradouro ?? '',
        bairro: dados.bairro ?? '',
        cidade: dados.localidade ?? '',
        uf: dados.uf ?? '',
    };
}

const VALIDADE_FERIADOS_MS = 30 * 24 * 60 * 60 * 1000;

export async function buscarFeriados(ano) {
    const chave = `feriados:${ano}`;
    const emCache = lerJSON(chave, null);

    if (emCache && Date.now() - emCache.salvoEm < VALIDADE_FERIADOS_MS) {
        return emCache.feriados;
    }

    const feriados = await buscarJSON(
        `https://brasilapi.com.br/api/feriados/v1/${ano}`,
        'Não foi possível consultar os feriados'
    );

    salvarJSON(chave, { salvoEm: Date.now(), feriados});
    return feriados;
}