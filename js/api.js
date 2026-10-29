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