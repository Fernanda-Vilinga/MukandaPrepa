// O que conta como uma questão utilizável.
//
// Nesta plataforma o enunciado É uma imagem: sem ela não há pergunta nenhuma
// para o aluno ler.
//
// A verificação tem de ser pelo ENDEREÇO e não só por o campo estar preenchido.
// Antes de existir upload real, o frontend guardava aqui o nome do ficheiro que
// estava no computador do professor — "exercicio1.png". É texto verdadeiro, e
// portanto passava em qualquer verificação do género `if (q.image)`, mas não
// aponta para lado nenhum: o aluno via um rectângulo vazio.
//
// Estas questões antigas ainda existem na base de dados e é por isso que a
// distinção importa.
const enderecoDeImagem = (v) => typeof v === "string" && /^https?:\/\//.test(v);

// Questão pronta a ser usada numa sessão.
const temEnunciado = (q) => !!(q && q.filled && enderecoDeImagem(q.image));

// Questão que o professor marcou como feita mas que não tem enunciado válido —
// seja por estar vazia, seja por ter ficado com o nome de um ficheiro local.
const semEnunciado = (q) => !!(q && q.filled && !enderecoDeImagem(q.image));

module.exports = { enderecoDeImagem, temEnunciado, semEnunciado };
