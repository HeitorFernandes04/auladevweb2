export class Peca {
    public id: number;
    public marca: number;
    public nome_marca: string;
    public modelo: string;
    public ano: number;
    public cor: number;
    public nome_cor: string;
    public foto: string | undefined;
    public tamanho: number;
    public nome_tamanho: string;
    public categoria: number;
    public nome_categoria: string;

    constructor(){
        this.id = 0;
        this.marca = 0;
        this.nome_marca = '';
        this.modelo = '';
        this.ano = 0;
        this.cor = 0;
        this.nome_cor = '';
        this.tamanho = 0;
        this.nome_tamanho = '';
        this.categoria = 0;
        this.nome_categoria = '';
    }
}
