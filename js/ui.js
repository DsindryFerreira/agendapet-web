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

const formatarMoeda = (valor) =>
    valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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
    document.getElementById('grupo-endereço').hidden = !visivel;
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
            : 'Escolha um serviço para ver se ele pode ser feito na casa do tutor.'
    }
    mostrarGrupoEndereco(caixa.checked);
}

export function preencherEndereco(endereco) {
    document.getElementById('logradouro').value = endereco.logradouro;
    document.getElementById('bairro').value = endereco.bairro;
    document.getElementById('cidade').value = endereco.cidade;
    document.getElementById('uf').value = endereco.uf;
}