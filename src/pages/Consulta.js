import React, { useState, useRef, useEffect } from 'react';



// import { Filesystem, Directory } from '@capacitor/filesystem';
// import * as XLSX from 'xlsx';
// import { Dialog } from '@capacitor/dialog';

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
// import { PermissionsAndroid, Platform } from 'react-native';


import { Dialog } from '@capacitor/dialog';
import { Capacitor } from '@capacitor/core';



// import { Permissions } from '@capacitor/permissions';

export default function Consulta() {
const [mensagem, setMensagem] = useState('');
const [tipoMensagem, setTipoMensagem] = useState(''); // success | error | warning

const exibirMensagem = (texto, tipo = 'info') => {
  setMensagem(texto);
  setTipoMensagem(tipo);
  setTimeout(() => setMensagem(''), 3000); // limpa após 3s
};

  const [produtos, setProdutos] = useState([]);
  const [codigoBusca, setCodigoBusca] = useState('');
  const [produtoEncontrado, setProdutoEncontrado] = useState(null);
  const [produtosLidos, setProdutosLidos] = useState([]);
  const [novoProduto, setNovoProduto] = useState({ loja: '', descricao: '' });
  const [ultimoCodigoLido, setUltimoCodigoLido] = useState('');
  const [usuarioInfo, setUsuarioInfo] = useState({ nome: '', lojaInventariada: '' });
  const [observacao, setObservacao] = useState(''); // 🆕 campo de observação
  const inputRef = useRef(null);
const [setor, setSetor] = useState('');

  const [showPopup, setShowPopup] = useState(false);
  const [acaoConfirmada, setAcaoConfirmada] = useState(null);

  const exibirPopup = (acao) => {
    setAcaoConfirmada(() => acao);
    setShowPopup(true);
  };

  const handleConfirmarPopup = () => {
    if (acaoConfirmada) acaoConfirmada();
    setShowPopup(false);
  };

  const handleCancelarPopup = () => {
    setShowPopup(false);
  };
const [maisSobreProduto, setMaisSobreProduto] = useState(''); // 🆕 novo campo

  // 🔹 Carrega dados do LocalStorage
  useEffect(() => {
    const baseSalva = localStorage.getItem('baseProdutos');
    if (baseSalva) setProdutos(JSON.parse(baseSalva));

    const lidosSalvos = localStorage.getItem('produtosLidos');
    if (lidosSalvos) setProdutosLidos(JSON.parse(lidosSalvos));

    const infoSalva = localStorage.getItem('usuarioInfo');
    if (infoSalva) setUsuarioInfo(JSON.parse(infoSalva));
  }, []);

  const gerarDataHora = () => {
    const agora = new Date();
    const data = agora.toLocaleDateString('pt-BR');
    const hora = agora.toLocaleTimeString('pt-BR');
    return `${data} ${hora}`;
  };
  
  // 🔹 Salva base e histórico
  useEffect(() => {
    if (produtos.length > 0) {
      localStorage.setItem('baseProdutos', JSON.stringify(produtos));
    }
  }, [produtos]);

  useEffect(() => {
    if (produtosLidos.length > 0) {
      localStorage.setItem('produtosLidos', JSON.stringify(produtosLidos));
    }
  }, [produtosLidos]);

  useEffect(() => {
    localStorage.setItem('usuarioInfo', JSON.stringify(usuarioInfo));
  }, [usuarioInfo]);
const [showFullScreenWarning, setShowFullScreenWarning] = useState(false);

  // 🔹 Lê arquivo base
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const linhas = text.split(/\r?\n/).filter((l) => l.trim() !== '');

      const novosProdutos = linhas
        .map((linha) => {
          const partes = linha.trim().split(';');
          if (partes.length >= 3) {
            return {
              loja: partes[0].trim(),
              code: partes[1].trim(),
              descricao: partes[2].trim(),
            };
          }
          return null;
        })
        .filter((p) => p !== null);

      setProdutos(novosProdutos);
      localStorage.setItem('baseProdutos', JSON.stringify(novosProdutos));
      setProdutoEncontrado(null);
      setProdutosLidos([]);
      localStorage.removeItem('produtosLidos');
    };

    reader.readAsText(file);
  };

  // 🔍 Buscar produto
  const handleBuscar = () => {
if (!codigoBusca.trim()) {
  exibirMensagem('Digite um código de barras!', 'error');
  return;
}

    const codigo = codigoBusca.trim();
    setUltimoCodigoLido(codigo);
    setObservacao(''); // limpa o campo ao buscar

    const produto = produtos.find((p) => p.code === codigo);
if (produto) {
  let status = 'Encontrado';

  if (
    usuarioInfo.lojaInventariada.trim() &&
    produto.loja.trim() !== usuarioInfo.lojaInventariada.trim()
  ) {
    status = 'Divergente';
  }

  setProdutoEncontrado({ ...produto, status });

  const registro = {
    nome: usuarioInfo.nome,
    lojaInventariada: usuarioInfo.lojaInventariada,
    setor,
    LojaBanco: produto.loja,
    code: codigo,
    DescricaoBanco: produto.descricao,
    status,
    observacao: '',
    datahoraconsulta: gerarDataHora(),
      DescricaoManual: maisSobreProduto, // ✅ novo campo

  };
setProdutosLidos((prev) => {
  const jaExiste = prev.some((p) => p.code === codigo);
  if (jaExiste) {
    // ⚠️ Mostrar modal em tela cheia
    setShowFullScreenWarning(true); // cria esse state no seu componente

    return prev; // não adiciona de novo
  }
  const novaLista = [...prev, registro];
  localStorage.setItem('produtosLidos', JSON.stringify(novaLista));
  return novaLista;
});
} else {
  setProdutoEncontrado(false);
}


    setCodigoBusca('');
    inputRef.current.focus();
  };

  // ➕ Adicionar produto não encontrado
const handleAdicionarNaoEncontrado = () => {
  if (!novoProduto.loja.trim() || !novoProduto.descricao.trim()) {
    exibirMensagem('⚠️ Preencha os campos de loja e descrição!', 'warning');
    return;
  }

  const registro = {
    nome: usuarioInfo.nome,
    lojaInventariada: usuarioInfo.lojaInventariada,
    setor,
    LojaBanco: novoProduto.loja,
    code: ultimoCodigoLido || codigoBusca.trim(),
    DescricaoBanco: '', // ✅ vazio
    status: 'Não encontrado',
    observacao: observacao,
    DescricaoManual: novoProduto.descricao, // ✅ coloca aqui a descrição digitada
    datahoraconsulta: gerarDataHora(),
  };

  setMaisSobreProduto(''); // limpa após adicionar

  setProdutosLidos((prev) => {
    const novaLista = [...prev, registro];
    localStorage.setItem('produtosLidos', JSON.stringify(novaLista));
    return novaLista;
  });

  setProdutoEncontrado(null);
  setNovoProduto({ loja: '', descricao: '' });
  setCodigoBusca('');
  setObservacao('');
  inputRef.current.focus();
};

async function pedirPermissaoEscrita() {
  // Android ou outras plataformas
  if (Capacitor.getPlatform() === 'android') {
    // Para Android >= 10, normalmente não é necessário solicitar permissão extra
    return true;
  }

  // iOS ou Web não precisam de permissão
  return true;
}

const handleExportarCSV = async () => {
  if (produtosLidos.length === 0) {
    exibirMensagem('⚠️ Nenhum produto lido para exportar!', 'warning');
    return;
  }

  const temPermissao = await pedirPermissaoEscrita();
  if (!temPermissao) {
    await Dialog.alert({
      title: 'Permissão negada',
      message: 'Não foi possível salvar o arquivo sem permissão.',
    });
    return;
  }

  try {
    // Quantidade total por loja
    const quantidadePorLoja = {};
    produtos.forEach((p) => {
      const loja = p.loja?.trim().toLowerCase() || '';
      if (!quantidadePorLoja[loja]) quantidadePorLoja[loja] = 0;
      quantidadePorLoja[loja] += 1;
    });

    const coletadosPorLoja = {};
    produtosLidos.forEach((p) => {
      const loja = p.LojaBanco?.trim().toLowerCase() || '';
      if (!coletadosPorLoja[loja]) coletadosPorLoja[loja] = 0;
      coletadosPorLoja[loja] += 1;
    });

    // Definindo colunas fixas para evitar desalinhamento
    const colunas = [
      'nome',
      'lojaInventariada',
      'setor',
      'LojaBanco',
      'code',
      'DescricaoBanco',
      'DescricaoManual',
      'status',
      'observacao',
      'datahoraconsulta',
      'QtdeTotalBase',
      'QtdeTotalColetada',
    ];

    const produtosParaExportar = produtosLidos.map((p) => {
      const loja = p.LojaBanco?.trim().toLowerCase() || '';
      return {
        ...p,
        DescricaoManual: p.DescricaoManual || '', // garante campo mesmo vazio
        observacao: p.observacao || '',
        QtdeTotalBase: quantidadePorLoja[loja] || 0,
        QtdeTotalColetada: coletadosPorLoja[loja] || 0,
      };
    });

    // Converte para CSV com colunas fixas
    const header = colunas.join(';');
    const csvRows = produtosParaExportar.map((p) =>
      colunas.map((col) => `"${p[col] || ''}"`).join(';')
    );

    const csvContent = [header, ...csvRows].join('\n');
    const nomeArquivo = `inventario_${usuarioInfo?.nome || 'usuario'}_${Date.now()}.csv`;

    await Filesystem.writeFile({
      path: nomeArquivo,
      data: csvContent,
      directory:
        Capacitor.getPlatform() === 'android'
          ? Directory.ExternalStorage
          : Directory.Documents,
      encoding: Encoding.UTF8,
    });

    await Dialog.alert({
      title: 'Sucesso ✅',
      message: 'Arquivo CSV exportado com sucesso!',
    });
  } catch (error) {
    console.error('Erro ao exportar CSV:', error);
    await Dialog.alert({
      title: 'Erro ❌',
      message: 'Falha ao exportar CSV: ' + error.message,
    });
  }
};





  // 🧹 Limpar tudo
  const limparBase = () => {
    localStorage.clear();
    setProdutos([]);
    setProdutosLidos([]);
    setProdutoEncontrado(null);
    setUsuarioInfo({ nome: '', lojaInventariada: '' });
    setObservacao('');
    exibirMensagem('Tudo limpo com sucesso!', 'success');
  };

  // 📝 Atualiza observação do produto consultado
  const handleSalvarObservacao = () => {
    if (!produtoEncontrado) return;
    const codigo = produtoEncontrado.code || ultimoCodigoLido;
    setProdutosLidos((prev) => {
      const novaLista = prev.map((p) =>
        p.code === codigo ? { ...p, observacao } : p
      );
      localStorage.setItem('produtosLidos', JSON.stringify(novaLista));
      return novaLista;
    });
  exibirMensagem('📝 Observação salva com sucesso!', 'success');

  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40, textAlign: 'center' }}>
      <h2>Sistema de Consulta de Produto</h2>
{mensagem && (
  <div
    style={{
      marginTop: 10,
      padding: '10px 20px',
      borderRadius: '6px',
      color:
        tipoMensagem === 'success'
          ? '#155724'
          : tipoMensagem === 'error'
          ? '#721c24'
          : '#856404',
      backgroundColor:
        tipoMensagem === 'success'
          ? '#d4edda'
          : tipoMensagem === 'error'
          ? '#f8d7da'
          : '#fff3cd',
      border:
        tipoMensagem === 'success'
          ? '1px solid #c3e6cb'
          : tipoMensagem === 'error'
          ? '1px solid #f5c6cb'
          : '1px solid #ffeeba',
      transition: '0.3s ease',
      textAlign: 'center',
      maxWidth: 400,
    }}
  >
    {mensagem}
  </div>
)}

{/* EYELASY, MESSY, HEAD */}


      <input type="file" accept=".txt,.csv" onChange={handleFileUpload} />
      <p>Formato: <b>loja;code;descrição</b></p>

      {produtos.length > 0 && (
        <p style={{ color: 'green' }}>Base carregada com {produtos.length} produtos</p>
      )}

      {(codigoBusca || produtosLidos.length > 0) && (
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <h4>Informações do Representante</h4>
          <input
            type="text"
            placeholder="Nome do responsável"
            value={usuarioInfo.nome}
            onChange={(e) => setUsuarioInfo({ ...usuarioInfo, nome: e.target.value })}
            style={{ margin: 5, padding: 8, borderRadius: 5, border: '1px solid #aaa' }}
          />
          <input
            type="text"
            placeholder="Loja inventariada"
            value={usuarioInfo.lojaInventariada}
            onChange={(e) => setUsuarioInfo({ ...usuarioInfo, lojaInventariada: e.target.value })}
            style={{ margin: 5, padding: 8, borderRadius: 5, border: '1px solid #aaa' }}
          />
          <input
  type="number"
  placeholder="Setor"
  value={setor}
  onChange={(e) => setSetor(e.target.value)}
  style={{ margin: 5, padding: 8, borderRadius: 5, border: '1px solid #aaa', width: '120px' }}
/>

        </div>
      )}
 
      <div style={{ marginTop: 20 }}>
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Digite o código de barras"
          value={codigoBusca}
          onChange={(e) => setCodigoBusca(e.target.value)}
          style={{
            padding: '8px',
            fontSize: '16px',
            width: '250px',
            borderRadius: '5px',
            border: '1px solid #ccc',
            marginRight: '10px',
          }}
        />
        <button style={{margin: '10px'}}
          onClick={handleBuscar}
        >
          Consultar
        </button>
        <button
          onClick={() => exibirPopup(limparBase)}
         
        >
          Limpar Base
        </button>
      </div>

      {/* Resultado da busca */}
      {produtoEncontrado && produtoEncontrado !== false && (
        <div
          style={{
            marginTop: 20,
            padding: 10,
            borderRadius: 5,
            maxWidth: 400,
            backgroundColor:
              produtoEncontrado.status === 'Divergente'
                ? '#fff3cd'
                : '#d4edda',
          }}
        >
          <p><strong>Loja:</strong> {produtoEncontrado.loja}</p>
          <p><strong>Código:</strong> {produtoEncontrado.code}</p>
          <p><strong>Descrição:</strong> {produtoEncontrado.descricao}</p>
          <p>
            <strong>Status:</strong>{' '}
            {produtoEncontrado.status === 'Divergente'
              ? '⚠️ Divergente'
              : '✅ Encontrado'}
          </p>

          {/* 📝 Campo de observação */}
          <div style={{ marginTop: 10 }}>
            <textarea
              placeholder="Observações..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              style={{
                width: '100%',
                minHeight: 60,
                padding: 8,
                borderRadius: 5,
                border: '1px solid #ccc',
              }}
            />
            <button
              onClick={handleSalvarObservacao}
              style={{
                marginTop: 15,
          
              }}
            >
              Salvar Observação
            </button>

{/* 📝 Campo de "Mais sobre o produto" */}
<textarea
  placeholder="Mais sobre o produto..."
  value={maisSobreProduto}
  onChange={(e) => setMaisSobreProduto(e.target.value)}
  style={{
    display: 'block',
    width: '100%',
    marginTop: 8,
    minHeight: 60,
    padding: 8,
    borderRadius: 5,
    border: '1px solid #ccc',
  }}
/>
<button
  onClick={() => {
    if (!produtoEncontrado) return;
    const codigo = produtoEncontrado.code || ultimoCodigoLido;
    setProdutosLidos((prev) => {
      const novaLista = prev.map((p) =>
        p.code === codigo ? { ...p, maisSobreProduto } : p
      );
      localStorage.setItem('produtosLidos', JSON.stringify(novaLista));
      return novaLista;
    });
    exibirMensagem('📝 Campo "Mais sobre o produto" salvo com sucesso!', 'success');
  }}
  style={{
    marginTop: 15,

  }}
>
  Salvar Descrição
</button>


          </div>
        </div>
      )}

      {produtoEncontrado === false && (
        <div style={{ marginTop: 20, padding: 10, backgroundColor: '#ffe6e6', borderRadius: 5 }}>
          <p><strong>Código:</strong> {ultimoCodigoLido}</p>
          <p style={{ color: 'red' }}>❌ Não encontrado</p>
          <input
            type="text"
            placeholder="Número da loja"
            value={novoProduto.loja}
            onChange={(e) => setNovoProduto({ ...novoProduto, loja: e.target.value })}
            style={{ padding: 6, marginRight: 5 }}
          />
          <input
            type="text"
            placeholder="Descrição do produto"
            value={novoProduto.descricao}
            onChange={(e) => setNovoProduto({ ...novoProduto, descricao: e.target.value })}
            style={{ padding: 6, marginRight: 5 }}
          />
          <textarea
            placeholder="Observações..."
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            style={{
              display: 'block',
              width: '100%',
              marginTop: 8,
              minHeight: 60,
              padding: 8,
              borderRadius: 5,
              border: '1px solid #ccc',
            }}
          />
          <button
            onClick={handleAdicionarNaoEncontrado}
            style={{
              marginTop: 8,
              padding: '6px 12px',
              backgroundColor: 'orange',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Adicionar
          </button>
        </div>
      )}
 {showPopup && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: 20,
              borderRadius: 10,
              minWidth: 300,
              textAlign: 'center',
            }}
          >
            <p>Tem certeza que deseja continuar?</p>
            <button
              onClick={handleConfirmarPopup}
              style={{ marginRight: 10, padding: '6px 12px', borderRadius: 5 }}
            >
              Sim
            </button>
            <button
              onClick={handleCancelarPopup}
              style={{ padding: '6px 12px', borderRadius: 5 }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
{showFullScreenWarning && (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
           backgroundColor: 'rgba(255, 0, 0, 0.85)', // vermelho com transparência

      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      color: 'white',
      fontSize: '24px',
      textAlign: 'center',
      padding: 20,
    }}
  >
    <div>
      Produto já Coletado!
      <br /><br />
      <button
        onClick={() => setShowFullScreenWarning(false)}
        style={{
          padding: '10px 20px',
          fontSize: 18,
          borderRadius: 5,
          border: 'none',
          cursor: 'pointer',
          backgroundColor: '#ffc107',
          color: '#000',
        }}
      >
        OK
      </button>
    </div>
  </div>
)}

      {produtosLidos.length > 0 && (
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <h3> {produtosLidos.length} produto(s) analisado(s)</h3>
          <button
            onClick={handleExportarCSV}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              borderRadius: '5px',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
          >
            Exportar Excel
          </button>
        </div>
      )}
    </div>
  );
}