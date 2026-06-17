export class Anuncio {
  public id: number;
  public titulo: string;
  public descricao: string;
  public data_criacao: string;
  public preco: number;
  public peca: number;
  public nome_peca: string;
  public usuario_id: number;
  public marca: number;
  public nome_marca: string;
  public cor: number;
  public nome_cor: string;
  public tamanho: number;
  public nome_tamanho: string;
  public categoria: number;
  public nome_categoria: string;

  constructor() {
    this.id = 0;
    this.titulo = '';
    this.descricao = '';
    this.data_criacao = '';
    this.preco = 0;
    this.peca = 0;
    this.nome_peca = '';
    this.usuario_id = 0;
    this.marca = 0;
    this.nome_marca = '';
    this.cor = 0;
    this.nome_cor = '';
    this.tamanho = 0;
    this.nome_tamanho = '';
    this.categoria = 0;
    this.nome_categoria = '';
  }
}
