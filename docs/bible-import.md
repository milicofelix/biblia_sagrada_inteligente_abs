# Importacao Biblica

Use o comando abaixo para carregar uma traducao em JSON:

```bash
docker exec biblia_abs_app php artisan db:seed --class=Database\\Seeders\\Bible\\BibleCatalogSeeder
docker exec biblia_abs_app php artisan bible:import storage/app/private/bible/acf.json
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

O importador faz `updateOrCreate` por traducao, livro, capitulo e versiculo. Pode executar novamente o mesmo arquivo sem duplicar versiculos.
