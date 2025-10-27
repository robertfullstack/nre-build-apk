// src/pages/PesquisarCamera.js
import React, { useState } from 'react';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';

export default function PesquisarCamera() {
  const [produtos, setProdutos] = useState([]);
  const [produtoAtual, setProdutoAtual] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const linhas = text.split(/\r?\n/).filter(l => l.trim() !== '');

      const novosProdutos = linhas.map(linha => {
        const partes = linha.trim().split(';');
        if (partes.length < 3) {
          const partesVirgula = linha.trim().split(',');
          if (partesVirgula.length >= 3) {
            return {
              loja: partesVirgula[0].trim(),
              code: partesVirgula[1].trim(),
              descricao: partesVirgula[2].trim(),
            };
          }
          return null;
        }

        return {
          loja: partes[0].trim(),
          code: partes[1].trim(),
          descricao: partes[2].trim(),
        };
      }).filter(p => p !== null);

      setProdutos(novosProdutos);
      setProdutoAtual(null);
    };

    reader.readAsText(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 50 }}>
      <input type="file" accept=".txt,.csv" onChange={handleFileUpload} />
      <p>Faça upload do arquivo <b>.txt</b> ou <b>.csv</b> (formato: loja;code;descrição)</p>

      <BarcodeScannerComponent
        width={400}
        height={400}
        onUpdate={(err, result) => {
          if (result) {
            const produto = produtos.find(p => p.code === result.text);
            if (produto) {
              setProdutoAtual(produto);
            } else {
              alert(`Produto não encontrado! Código: ${result.text}`);
              setProdutoAtual(null);
            }
          }
        }}
      />

      {produtoAtual && (
        <div style={{ marginTop: 20, padding: 10, backgroundColor: '#eee', borderRadius: 5, maxWidth: 400 }}>
          <p><strong>Loja:</strong> {produtoAtual.loja}</p>
          <p><strong>Código de Barras:</strong> {produtoAtual.code}</p>
          <p><strong>Descrição:</strong> {produtoAtual.descricao}</p>
        </div>
      )}
    </div>
  );
}
