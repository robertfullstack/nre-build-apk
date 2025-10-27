import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx'; // mantém esta

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
  const [setor, setSetor] = useState('');
  const [maisSobreProduto, setMaisSobreProduto] = useState(''); // 🆕 novo campo
  const inputRef = useRef(null);

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
        datahoraconsultaNewteste: gerarDataHora(),
        DescricaoManual: maisSobreProduto, // ✅ novo campo
      };

      setProdutosLidos((prev) => {
        const jaExiste = prev.some((p) => p.code === codigo);
        if (jaExiste) {
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
      DescricaoBanco: novoProduto.descricao,
      status: 'Não encontrado',
      observacao: observacao,
      DescricaoManual: maisSobreProduto,
      datahoraconsultaNewteste: gerarDataHora(),
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

  // 📤 Exportar Excel
  const handleExportarExcel = async () => {
    if (produtosLidos.length === 0) {
      alert('Nenhum produto lido para exportar!');
      return;
    }

    const produtosParaExportar = produtosLidos.map((p) => ({
      ...p,
      QtdeTotalBase: produtos.filter((x) => x.loja === p.loja).length,
      QtdeTotalColetada: produtosLidos.filter((x) => x.loja === p.loja).length,
    }));

    const ws = XLSX.utils.json_to_sheet(produtosParaExportar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produtos Lidos');
    XLSX.writeFile(wb, `inventario_${usuarioInfo.nome || 'usuario'}.xlsx`);
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
            color: tipoMensagem === 'success' ? '#155724' : tipoMensagem === 'error' ? '#721c24' : '#856404',
            backgroundColor: tipoMensagem === 'success' ? '#d4edda' : tipoMensagem === 'error' ? '#f8d7da' : '#fff3cd',
            border: tipoMensagem === 'success' ? '1px solid #c3e6cb' : tipoMensagem === 'error' ? '1px solid #f5c6cb' : '1px solid #ffeeba',
            transition: '0.3s ease',
            textAlign: 'center',
            maxWidth: 400,
          }}
        >
          {mensagem}
        </div>
      )}

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
        <button style={{ margin: '10px' }} onClick={handleBuscar}>
          Consultar
        </button>
        <button onClick={limparBase}>
          Limpar Base
        </button>
      </div>
    </div>
  );
}
