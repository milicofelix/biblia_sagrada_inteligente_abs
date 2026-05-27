# Importacao Biblica

Use o comando abaixo para carregar uma traducao em JSON ou XML USFX:

```bash
docker exec biblia_abs_app php artisan db:seed --class=Database\\Seeders\\Bible\\BibleCatalogSeeder
docker exec biblia_abs_app php artisan bible:import storage/app/private/bible/acf.json
```

Se o arquivo nao tiver metadados da traducao, informe pelo comando:

```bash
docker exec biblia_abs_app php artisan bible:import /caminho/externo/biblia.json \
  --name="Almeida Corrigida Fiel" \
  --abbr=ACF \
  --language=pt-BR \
  --source="arquivo local" \
  --default
```

Formato esperado:

```json
{
  "translation": {
    "name": "Almeida Corrigida Fiel",
    "abbreviation": "ACF",
    "language": "pt-BR",
    "source": "arquivo local",
    "is_default": true
  },
  "verses": [
    {
      "book": "Joao",
      "chapter": 3,
      "verse": 16,
      "text": "Porque Deus amou o mundo..."
    }
  ]
}
```

Para a base inicial do projeto foi usada a traducao Joao Ferreira de Almeida em dominio publico do repositorio `seven1m/open-bibles`:

```bash
mkdir -p storage/app/bibles
curl -L https://raw.githubusercontent.com/seven1m/open-bibles/master/por-almeida.usfx.xml \
  -o storage/app/bibles/por-almeida.usfx.xml

docker exec biblia_abs_app php artisan bible:import storage/app/bibles/por-almeida.usfx.xml \
  --name="Joao Ferreira de Almeida" \
  --abbr=JFA \
  --language=pt-BR \
  --source="https://github.com/seven1m/open-bibles/blob/master/por-almeida.usfx.xml" \
  --default
```

O importador faz `updateOrCreate`/`upsert` por traducao, livro, capitulo e versiculo. Pode executar novamente o mesmo arquivo sem duplicar versiculos.

Formatos aceitos:

- objeto com `translation` e `verses`
- lista direta de versiculos
- objeto com `translation` e `books`, contendo capitulos e versiculos aninhados
- XML USFX com livros, capitulos e versiculos

Campos equivalentes aceitos nos versiculos:

- livro: `book`, `book_name`, `bookName`, `livro`, `abbrev`
- capitulo: `chapter`, `chapter_number`, `chapterNumber`, `capitulo`
- versiculo: `verse`, `verse_number`, `verseNumber`, `versiculo`
- texto: `text`, `content`, `texto`
