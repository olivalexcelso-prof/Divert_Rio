
export class CardGenerator {
  /**
   * Gera uma série de 6 cartelas (90 números) seguindo o padrão profissional.
   * Regra Crucial: Nenhuma coluna em nenhuma cartela pode ficar vazia.
   */
  public static generateSeries(userId: string): any[] {
    const seriesId = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    // 1. Baldes de números por coluna (Padrão 90 bolas)
    const columns: number[][] = Array.from({ length: 9 }, (_, i) => {
      const start = i === 0 ? 1 : i * 10;
      const end = i === 8 ? 90 : (i * 10) + 9;
      const nums = [];
      for (let n = start; n <= end; n++) nums.push(n);
      return this.shuffle(nums);
    });

    const grid: number[][] = Array.from({ length: 18 }, () => Array(9).fill(0));
    const rowCounts = Array(18).fill(0);

    // 2. PASSO OBRIGATÓRIO: Garantir 1 número por coluna em cada cartela (6 cartelas x 9 colunas = 54 números)
    for (let cardIdx = 0; cardIdx < 6; cardIdx++) {
      for (let colIdx = 0; colIdx < 9; colIdx++) {
        // Escolhe uma linha aleatória (0, 1 ou 2) dentro da cartela atual
        const possibleRows = [cardIdx * 3, cardIdx * 3 + 1, cardIdx * 3 + 2];
        this.shuffle(possibleRows);
        
        let placed = false;
        for (const row of possibleRows) {
          if (rowCounts[row] < 5) {
            grid[row][colIdx] = columns[colIdx].pop()!;
            rowCounts[row]++;
            placed = true;
            break;
          }
        }
        // Fallback caso as 3 linhas estejam cheias (teoricamente impossível neste estágio)
        if (!placed) {
           const row = cardIdx * 3 + (colIdx % 3);
           grid[row][colIdx] = columns[colIdx].pop()!;
           rowCounts[row]++;
        }
      }
    }

    // 3. PASSO DE DISTRIBUIÇÃO: Alocar os 36 números restantes (90 - 54 = 36)
    // Cada linha deve chegar a exatamente 5 números.
    for (let colIdx = 0; colIdx < 9; colIdx++) {
      while (columns[colIdx].length > 0) {
        const num = columns[colIdx].pop()!;
        
        // Encontra linhas que ainda não tem este número na coluna e tem espaço (< 5)
        const availableRows = [];
        for (let r = 0; r < 18; r++) {
          if (grid[r][colIdx] === 0 && rowCounts[r] < 5) {
            availableRows.push(r);
          }
        }

        if (availableRows.length > 0) {
          this.shuffle(availableRows);
          const row = availableRows[0];
          grid[row][colIdx] = num;
          rowCounts[row]++;
        }
      }
    }

    // 4. Formatação e Ordenação Vertical por Cartela
    const cards = [];
    for (let c = 0; c < 6; c++) {
      const cardRows = grid.slice(c * 3, (c * 3) + 3);
      
      for (let col = 0; col < 9; col++) {
        const vals = [];
        if (cardRows[0][col] !== 0) vals.push(cardRows[0][col]);
        if (cardRows[1][col] !== 0) vals.push(cardRows[1][col]);
        if (cardRows[2][col] !== 0) vals.push(cardRows[2][col]);
        
        vals.sort((a, b) => a - b);
        
        let vIdx = 0;
        if (cardRows[0][col] !== 0) cardRows[0][col] = vals[vIdx++];
        if (cardRows[1][col] !== 0) cardRows[1][col] = vals[vIdx++];
        if (cardRows[2][col] !== 0) cardRows[2][col] = vals[vIdx++];
      }

      cards.push({
        id: `${seriesId}-${c + 1}`,
        userId,
        numbers: cardRows,
        marked: []
      });
    }

    return cards;
  }

  private static shuffle(array: any[]) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  }
}
