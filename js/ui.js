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