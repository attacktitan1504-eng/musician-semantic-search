async function searchBand() {
  const input = document.getElementById("searchInput").value.trim();
  const resultDiv = document.getElementById("result");

  if (!input) {
    resultDiv.innerHTML = "Masukkan nama band terlebih dahulu.";
    return;
  }

  resultDiv.innerHTML = "Loading...";

  const query = `
    PREFIX dbo: <http://dbpedia.org/ontology/>
    PREFIX dbp: <http://dbpedia.org/property/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT ?label
           (COALESCE(SAMPLE(?abstractEn), SAMPLE(?abstractAlt)) AS ?abstract)
           (GROUP_CONCAT(DISTINCT ?genreLabel; separator=", ") AS ?genres)
           (SAMPLE(?hometownLabel) AS ?hometown)
           (SAMPLE(?thumbnail) AS ?thumbnail)
    WHERE {
      ?band a dbo:Band ;
            rdfs:label ?label .

      FILTER (lang(?label) = 'en')
      FILTER (regex(?label, "${input}", "i"))

      OPTIONAL {
        ?band dbo:abstract ?abstractEn .
        FILTER (lang(?abstractEn) = 'en')
      }

      OPTIONAL {
        ?band dbp:abstract ?abstractAlt .
      }

      OPTIONAL {
        ?band dbo:genre ?genre .
        ?genre rdfs:label ?genreLabel .
        FILTER (lang(?genreLabel) = 'en')
      }

      OPTIONAL {
        ?band dbo:hometown ?hometownRes .
        ?hometownRes rdfs:label ?hometownLabel .
        FILTER (lang(?hometownLabel) = 'en')
      }

      OPTIONAL { ?band dbo:thumbnail ?thumbnail . }
    }
    GROUP BY ?label
    LIMIT 1
  `;

  const url = "https://dbpedia.org/sparql?query=" +
              encodeURIComponent(query) +
              "&format=json";

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.results.bindings.length > 0) {
      const band = data.results.bindings[0];

      resultDiv.innerHTML = `
        <div class="card">
          <h2>${band.label.value}</h2>

          <p><strong>Deskripsi:</strong><br>
          ${band.abstract ? band.abstract.value : "Data deskripsi tidak tersedia di DBpedia."}</p>

          <p><strong>Genre:</strong>
          ${band.genres ? band.genres.value : "Tidak tersedia."}</p>

          <p><strong>Kota Asal:</strong>
          ${band.hometown ? band.hometown.value : "Tidak tersedia."}</p>

          ${band.thumbnail ? `<img src="${band.thumbnail.value}" width="200">` : "<p>Gambar tidak tersedia.</p>"}
        </div>
      `;
    } else {
      resultDiv.innerHTML = "Band tidak ditemukan di DBpedia.";
    }

  } catch (error) {
    resultDiv.innerHTML = "Terjadi kesalahan saat mengambil data.";
    console.error(error);
  }
}