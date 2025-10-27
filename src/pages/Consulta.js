import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';

export default function Consulta() {
  const [mensagem, setMensagem] = useState('');
  const [tipoMensagem, setTipoMensagem] = useState('');
  const exibirMensagem = (texto, tipo = 'info') => {
    setMensagem(texto);
    setTipoMensagem(tipo);
    setTimeout(() => setMensagem(''), 3000);
  };

  const [produtos, setProdutos] = useState([]);
  const [codigoBusca, setCodigoBusca] = useState('');
  const [produtoEncontrado, setProdutoEncontrado] = useState(null);
  const [produtosLidos, setProdutosLidos] = useState([]);
  const [novoProduto, setNovoProduto] = useState({ loja: '', descricao: '' });
  const [ultimoCodigoLido, setUltimoCodigoLido] = useState('');
  const [usuarioInfo, setUsuarioInfo] = useState({ nome: '', lojaInventariada: '' });
  const [observacao, setObservacao] = useState('');
  const [maisSobreProduto, setMaisSobreProduto] = useState('');
  const [setor, setSetor] = useState('');

  const inputRef = useRef(null);
  const [showPopup, setShowPopup] = useState(false);
  const [acaoConfirmada, setAcaoConfirmada] = useState(null);
  const [showFullScreenWarning, setShowFullScreenWarning] = useState(false);

  const exibirPopup = (acao) => {
    setAcaoConfirmada(() => acao);
    setShowPopup(true);
  };
  const handleConfirmarPopup = () => { if (acaoConfirmada) acaoConfirmada(); setShowPopup(false); };
  const handleCancelarPopup = () => setShowPopup(false);

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
    return `${agora.toLocaleDateString('pt-BR')} ${agora.toLocaleTimeString('pt-BR')}`;
  };

  useEffect(() => { if (produtos.length) localStorage.setItem('baseProdutos', JSON.stringify(produtos)); }, [produtos]);
  useEffect(() => { if (produtosLidos.length) localStorage.setItem('produtosLidos', JSON.stringify(produtosLidos)); }, [produtosLidos]);
  useEffect(() => { localStorage.setItem('usuarioInfo', JSON.stringify(usuarioInfo)); }, [usuarioInfo]);

  // 🔹 Lê arquivo base
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const linhas = e.target.result.split(/\r?\n/).filter(l => l.trim() !== '');
      const novosProdutos = linhas.map(linha => {
        const partes = linha.trim().split(';');
        if (partes.length >= 3) return { loja: partes[0].trim(), code: partes[1].trim(), descricao: partes[2].trim() };
        return null;
      }).filter(p => p);
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
    if (!codigoBusca.trim()) { exibirMensagem('Digite um código de barras!', 'error'); return; }
    const codigo = codigoBusca.trim();
    setUltimoCodigoLido(codigo);
    setObservacao('');
    const produto = produtos.find(p => p.code === codigo);
    if (produto) {
      let status = 'Encontrado';
      if (usuarioInfo.lojaInventariada.trim() && produto.loja.trim() !== usuarioInfo.lojaInventariada.trim()) status = 'Divergente';
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
        DescricaoManual: maisSobreProduto,
      };

      setProdutosLidos(prev => {
        const jaExiste = prev.some(p => p.code === codigo);
        if (jaExiste) { setShowFullScreenWarning(true); return prev; }
        const novaLista = [...prev, registro];
        localStorage.setItem('produtosLidos', JSON.stringify(novaLista));
        return novaLista;
      });
    } else { setProdutoEncontrado(false); }
    setCodigoBusca('');
    inputRef.current.focus();
  };

  // ➕ Adicionar produto não encontrado
  const handleAdicionarNaoEncontrado = () => {
    if (!novoProduto.loja.trim() || !novoProduto.descricao.trim()) { exibirMensagem('⚠️ Preencha os campos de loja e descrição!', 'warning'); return; }
    const registro = {
      nome: usuarioInfo.nome,
      lojaInventariada: usuarioInfo.lojaInventariada,
      setor,
      LojaBanco: novoProduto.loja,
      code: ultimoCodigoLido || codigoBusca.trim(),
      DescricaoBanco: novoProduto.descricao,
      status: 'Não encontrado',
      observacao,
      DescricaoManual: maisSobreProduto,
      datahoraconsultaNewteste: gerarDataHora(),
    };
    setMaisSobreProduto('');
    setProdutosLidos(prev => { const novaLista = [...prev, registro]; localStorage.setItem('produtosLidos', JSON.stringify(novaLista)); return novaLista; });
    setProdutoEncontrado(null);
    setNovoProduto({ loja: '', descricao: '' });
    setCodigoBusca('');
    setObservacao('');
    inputRef.current.focus();
  };

  // 📤 Exportar Excel (Web apenas)
  const handleExportarExcel = () => {
    if (produtosLidos.length === 0) { exibirMensagem('Nenhum produto lido para exportar!', 'error'); return; }

    const quantidadePorLoja = {};
    produtos.forEach(p => { quantidadePorLoja[p.loja] = (quantidadePorLoja[p.loja] || 0) + 1; });

    const coletadosPorLoja = {};
    produtosLidos.forEach(p => { coletadosPorLoja[p.loja] = (coletadosPorLoja[p.loja] || 0) + 1; });

    const produtosParaExportar = produtosLidos.map(p => ({
      ...p,
      QtdeTotalBase: quantidadePorLoja[p.loja] || 0,
      QtdeTotalColetada: coletadosPorLoja[p.loja] || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(produtosParaExportar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produtos Lidos');
    XLSX.writeFile(wb, `inventario_${usuarioInfo.nome || 'usuario'}.xlsx`);
    exibirMensagem('Excel exportado com sucesso!', 'success');
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

  // 📝 Atualiza observação
  const handleSalvarObservacao = () => {
    if (!produtoEncontrado) return;
    const codigo = produtoEncontrado.code || ultimoCodigoLido;
    setProdutosLidos(prev => {
      const novaLista = prev.map(p => p.code === codigo ? { ...p, observacao } : p);
      localStorage.setItem('produtosLidos', JSON.stringify(novaLista));
      return novaLista;
    });
    exibirMensagem('📝 Observação salva com sucesso!', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40, textAlign: 'center' }}>
      <h2>Sistema de Consulta de Produto</h2>
      {mensagem && (
        <div style={{
          marginTop: 10, padding: '10px 20px', borderRadius: '6px', color: tipoMensagem === 'success' ? '#155724' : tipoMensagem === 'error' ? '#721c24' : '#856404',
          backgroundColor: tipoMensagem === 'success' ? '#d4edda' : tipoMensagem === 'error' ? '#f8d7da' : '#fff3cd',
          border: tipoMensagem === 'success' ? '1px solid #c3e6cb' : tipoMensagem === 'error' ? '1px solid #f5c6cb' : '1px solid #ffeeba',
          transition: '0.3s ease', textAlign: 'center', maxWidth: 400
        }}>
          {mensagem}
        </div>
      )}

      <input type="file" accept=".txt,.csv" onChange={handleFileUpload} />
      <p>Formato: <b>loja;code;descrição</b></p>
      {produtos.length > 0 && <p style={{ color: 'green' }}>Base carregada com {produtos.length} produtos</p>}

      {(codigoBusca || produtosLidos.length > 0) && (
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <h4>Informações do Representante</h4>
          <input type="text" placeholder="Nome do responsável" value={usuarioInfo.nome} onChange={e => setUsuarioInfo({ ...usuarioInfo, nome: e.target.value })} style={{ margin: 5, padding: 8, borderRadius: 5, border: '1px solid #aaa' }} />
          <input type="text" placeholder="Loja inventariada" value={usuarioInfo.lojaInventariada} onChange={e => setUsuarioInfo({ ...usuarioInfo, lojaInventariada: e.target.value })} style={{ margin: 5, padding: 8, borderRadius: 5, border: '1px solid #aaa' }} />
          <input type="number" placeholder="Setor" value={setor} onChange={e => setSetor(e.target.value)} style={{ margin: 5, padding: 8, borderRadius: 5, border: '1px solid #aaa', width: '120px' }} />
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <input ref={inputRef} type="tel" inputMode="numeric" pattern="[0-9]*" placeholder="Digite o código de barras" value={codigoBusca} onChange={e => setCodigoBusca(e.target.value)} style={{ padding: 8, fontSize: 16, width: 250, borderRadius: 5, border: '1px solid #ccc', marginRight: 10 }} />
        <button style={{ margin: 10 }} onClick={handleBuscar}>Consultar</button>
        <button onClick={() => exibirPopup(limparBase)}>Limpar Base</button>
      </div>

      {/* Aqui continua todo o restante do seu código para mostrar resultados, adicionar produtos não encontrados, popup, tela cheia de aviso, etc... */}

      {produtosLidos.length > 0 && (
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <h3>{produtosLidos.length} produto(s) analisado(s)</h3>
          <button onClick={handleExportarExcel} style={{ padding: '10px 20px', fontSize: 16, borderRadius: 5, color: 'white', backgroundColor: '#007bff', border: 'none', cursor: 'pointer', marginBottom: 10 }}>Exportar Excel</button>
        </div>
      )}
    </div>
  );
}
