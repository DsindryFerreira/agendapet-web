import { carregarServicos } from './api.js';
import {
    mostrarEstado,
    esconderEstado,
    renderizarServicos,
    popularSelectServicos,
} from './ui.js';

const estado = {
    servicos: [],
};

const avisoServicos = document.getElementById('servicos-status');

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

carregarCatalogo();