export class Anuncio {
  public id: number;
  public titulo: string;
  public descricao: string;
  public data_criacao: string;
  public preco: number;
  public peca: number;
  public nome_peca: string;

  constructor() {
    this.id = 0;
    this.titulo = '';
    this.descricao = '';
    this.data_criacao = '';
    this.preco = 0;
    this.peca = 0;
    this.nome_peca = '';
  }
}
