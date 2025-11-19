const urlBase = 'https://pokeapi.co/api/v2';

let listaAtual = 0;
const limit = 8;
let isLoading = false;

let pokemonContainer;
let loadMoreBtn;
let searchInput;
let searchBtn;
let searchResults;
let filterResults;

const typeAlias = {
  eletric: 'electric'
};

function ajaxGet(url, successCallback, errorCallback, timeout = 15000) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.timeout = timeout;
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          successCallback(json);
        } catch (e) {
          errorCallback && errorCallback(e);
        }
      } else {
        errorCallback && errorCallback(new Error('Status ' + xhr.status));
      }
    }
  };
  xhr.ontimeout = function () {
    errorCallback && errorCallback(new Error('timeout'));
  };
  xhr.onerror = function () {
    errorCallback && errorCallback(new Error('network error'));
  };
  xhr.send();
}

function buscaPokemon(nameOrId, success, error) {
  ajaxGet(`${urlBase}/pokemon/${encodeURIComponent(nameOrId)}`, success, error);
}

function buscarPorTipo(urlTipos, success, error) {
  ajaxGet(urlTipos, success, error);
}

function criaListaDePokemon(offset, limitVal, success, error) {
  ajaxGet(`${urlBase}/pokemon?offset=${offset}&limit=${limitVal}`, success, error);
}

function buscaTipo(typeName, success, error) {
  ajaxGet(`${urlBase}/type/${encodeURIComponent(typeName)}`, success, error);
}

function buscaGeracao(generationUrl) {
  if (!generationUrl) return 'Desconhecida';
  const match = generationUrl.match(/generation\/(\d+)\//);
  if (match) {
    const genNum = parseInt(match[1], 10);
    return `${genNum}º`;
  }
  return 'Desconhecida';
}

// Função para Criar os Cards na tela
function criaCard(pokemonData, speciesData) {
  const pokemonId = pokemonData.id;
  const name = pokemonData.name.charAt(0).toUpperCase() + pokemonData.name.slice(1);
  const types = pokemonData.types
    .map(function (t) {
      return t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1);
    })
    .join(', ');
  const weight = (pokemonData.weight / 10).toFixed(1);
  const generation = speciesData ? buscaGeracao(speciesData.generation.url) : 'Desconhecida';

  const imagemNormal =
    (pokemonData.sprites && pokemonData.sprites.other && pokemonData.sprites.other['official-artwork'] && pokemonData.sprites.other['official-artwork'].front_default) ||
    pokemonData.sprites.front_default ||
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/' + pokemonId + '.png';

  const imagemShiny =
    (pokemonData.sprites && pokemonData.sprites.other && pokemonData.sprites.other['official-artwork'] && pokemonData.sprites.other['official-artwork'].front_shiny) ||
    pokemonData.sprites.front_shiny ||
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/' + pokemonId + '.png';

  const uniqueId = 'carousel-' + pokemonId + '-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

  return (
    '<div class="col-lg-3 col-md-4 col-sm-6 col-12 mb-4">' +
    '<div class="card h-100">' +
    '<div id="' + uniqueId + '" class="carousel slide" data-bs-ride="carousel">' +
    '<div class="carousel-inner">' +
    '<div class="carousel-item active">' +
    '<img src="' + imagemNormal + '" class="d-block w-100" alt="' + name + '" onerror="this.src=\'https://via.placeholder.com/200?text=' + name + '\'">' +
    '</div>' +
    '<div class="carousel-item">' +
    '<img src="' + imagemShiny + '" class="d-block w-100" alt="' + name + ' Shiny" onerror="this.src=\'' + imagemNormal + '\'">' +
    '</div>' +
    '</div>' +
    '<button class="carousel-control-prev" type="button" data-bs-target="#' + uniqueId + '" data-bs-slide="prev">' +
    '<span class="carousel-control-prev-icon" aria-hidden="true"></span>' +
    '<span class="visually-hidden">Previous</span>' +
    '</button>' +
    '<button class="carousel-control-next" type="button" data-bs-target="#' + uniqueId + '" data-bs-slide="next">' +
    '<span class="carousel-control-next-icon" aria-hidden="true"></span>' +
    '<span class="visually-hidden">Next</span>' +
    '</button>' +
    '</div>' +
    '<div class="card-body">' +
    '<h5 class="card-title">' + name + '</h5>' +
    '<p class="card-text mb-1"><strong>ID:</strong> ' + pokemonId + '</p>' +
    '<p class="card-text mb-1"><strong>Tipo:</strong> ' + types + '</p>' +
    '<p class="card-text mb-1"><strong>Peso:</strong> ' + weight + 'kg</p>' +
    '<p class="card-text mb-0"><strong>Geração:</strong> ' + generation + '</p>' +
    '</div>' +
    '<div class="d-flex justify-content-center mt-2">' +
    '<a href="https://www.pokemon.com/br/pokedex/' + pokemonId + '" class="btn btn-primary ver-pokemon" target="_blank" rel="noopener">Ver Pokémon</a>' +
    '</div>' +
    '</div>' +
    '</div>'
  );
}

function loadPokemon(offset, limitVal) {
  if (isLoading) return;
  isLoading = true;

  criaListaDePokemon(offset, limitVal, function (listData) {
    var results = listData.results || [];
    var total = results.length;
    var completed = 0;
    var cardsHtml = '';

    if (total === 0) {
      isLoading = false;
      return;
    }

    results.forEach(function (item, idx) {
      buscaPokemon(item.name, function (pokemonData) {
        buscarPorTipo(pokemonData.species.url, function (speciesData) {
          var card = criaCard(pokemonData, speciesData);
          cardsHtml += card;
          completed++;

          if (completed === total) {
            pokemonContainer.insertAdjacentHTML('beforeend', cardsHtml);
            listaAtual += limitVal;
            if (!listData.next) loadMoreBtn.style.display = 'none';
            isLoading = false;
          }
        }, function () {
          var card = criaCard(pokemonData, null);
          cardsHtml += card;
          completed++;
          if (completed === total) {
            pokemonContainer.insertAdjacentHTML('beforeend', cardsHtml);
            listaAtual += limitVal;
            if (!listData.next) loadMoreBtn.style.display = 'none';
            isLoading = false;
          }
        });
      }, function (err) {
        console.error('Erro ao buscar pokemon detalhado:', item.name, err);
        completed++;
        if (completed === total) {
          if (cardsHtml) pokemonContainer.insertAdjacentHTML('beforeend', cardsHtml);
          listaAtual += limitVal;
          if (!listData.next) loadMoreBtn.style.display = 'none';
          isLoading = false;
        }
      });
    });
  }, function (err) {
    console.error('Erro ao carregar lista de pokemons:', err);
    alert('Erro ao carregar Pokémon. Tente novamente.');
    isLoading = false;
  });
}

// Buscar Pokemon por nome ou ID
function searchPokemon() {
  var searchTerm = searchInput.value.trim().toLowerCase();
  if (!searchTerm) {
    alert('Por favor, digite o nome ou ID do Pokémon');
    return;
  }

  searchResults.innerHTML = '';
  searchResults.style.display = 'block';

  buscaPokemon(searchTerm, function (pokemonData) {
    buscarPorTipo(pokemonData.species.url, function (speciesData) {
      var cardHTML = criaCard(pokemonData, speciesData);
      searchResults.innerHTML =
        '<div class="d-flex justify-content-between align-items-center mb-3">' +
        '<h4 class="m-0">Resultado da Busca</h4>' +
        '</div>' +
        '<div class="row">' + cardHTML + '</div>';

      filterResults.style.display = 'none';
      searchInput.value = '';
    }, function () {
      var cardHTML = criaCard(pokemonData, null);
      searchResults.innerHTML =
        '<div class="d-flex justify-content-between align-items-center mb-3">' +
        '<h4 class="m-0">Resultado da Busca</h4>' +
        '</div>' +
        '<div class="row">' + cardHTML + '</div>';
      filterResults.style.display = 'none';
      searchInput.value = '';
    });
  }, function (err) {
    searchResults.innerHTML =
      '<div class="d-flex justify-content-between align-items-center mb-3">' +
      '<h4 class="m-0">Resultado da Busca</h4>' +
      '</div>' +
      '<div class="alert alert-warning text-center" role="alert">Pokémon não encontrado</div>';
    searchInput.value = '';
  });
}

// Filtragem por Tipo
function getPokemonsByType(type, success, error) {
  var t = typeAlias[type] || type;
  buscaTipo(t, function (data) {
    try {
      var list = (data.pokemon || []).map(function (p) { return p.pokemon.name; });
      success(list);
    } catch (e) {
      error && error(e);
    }
  }, function (err) {
    error && error(err);
  });
}

function filtrarPorTipos(tiposSelecionados, success, error) {
  if (!tiposSelecionados || tiposSelecionados.length === 0) {
    success([]);
    return;
  }

  var listas = [];
  var remaining = tiposSelecionados.length;
  var erroOcc = false;

  tiposSelecionados.forEach(function (tipoBruto, idx) {
    var tipo = typeAlias[tipoBruto] || tipoBruto;
    getPokemonsByType(tipo, function (pokemonsDoTipo) {
      listas[idx] = pokemonsDoTipo;
      remaining--;
      if (remaining === 0) {
        if (listas.length === 0) {
          success([]);
          return;
        }
        // interseção
        var intersecao = listas[0] || [];
        for (var i = 1; i < listas.length; i++) {
          intersecao = intersecao.filter(function (p) { return (listas[i] || []).indexOf(p) !== -1; });
        }
        success(intersecao);
      }
    }, function (err) {
      if (!erroOcc) {
        erroOcc = true;
        error && error(err);
      }
    });
  });
}

//  Mostrar Pokemon Filtrados
function mostrarPokemonsFiltrados(listaDeNomes) {
  filterResults.innerHTML = '';
  filterResults.style.display = 'block';

  var headerHTML =
    '<div class="d-flex justify-content-between align-items-center mb-3">' +
    '<h4 class="m-0">Pokémon filtrados: <span style="color: #7b7b7b; font-size:1.0rem">' + (listaDeNomes ? listaDeNomes.length : 0) + ' encontrados</span></h4>' +
    '<div>' +
    '<button id="clear-filters-btn" class="btn btn-sm btn-outline-secondary me-2">Limpar Filtros</button>' +
    '<button id="close-filter-btn" class="btn btn-sm btn-secondary">Fechar</button>' +
    '</div>' +
    '</div>';
  filterResults.insertAdjacentHTML('beforeend', headerHTML);

  if (!listaDeNomes || listaDeNomes.length === 0) {
    filterResults.insertAdjacentHTML('beforeend', '<div class="alert alert-info">Nenhum Pokémon encontrado para os tipos selecionados.</div>');
    return;
  }

  var total = listaDeNomes.length;
  var completed = 0;
  var collected = [];
  var failedCount = 0;

  var loadingHtml = '<div class="text-center py-3">Carregando ' + total + ' pokémon(s)...</div>';
  filterResults.insertAdjacentHTML('beforeend', loadingHtml);

  listaDeNomes.forEach(function (nome, idx) {
    buscaPokemon(nome, function (pokemonData) {
      buscarPorTipo(pokemonData.species.url, function (speciesData) {
        collected[idx] = { pokemon: pokemonData, species: speciesData };
        completed++;
        checkFinish();
      }, function () {
        collected[idx] = { pokemon: pokemonData, species: null };
        completed++;
        checkFinish();
      });
    }, function (err) {
      console.warn('Falha ao buscar pokemon filtrado:', nome, err);
      failedCount++;
      completed++;
      checkFinish();
    });
  });

  function checkFinish() {
    if (completed < total) return;
    var cardsHtml = '<div class="row">';
    for (var i = 0; i < collected.length; i++) {
      if (!collected[i] || !collected[i].pokemon) continue;
      cardsHtml += criaCard(collected[i].pokemon, collected[i].species);
    }
    cardsHtml += '</div>';

    filterResults.innerHTML = headerHTML + cardsHtml;

    var clearBtn = document.getElementById('clear-filters-btn');
    var closeBtn = document.getElementById('close-filter-btn');

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        var boxes = document.querySelectorAll('input[name="type"]');
        for (var b = 0; b < boxes.length; b++) boxes[b].checked = false;
        filterResults.style.display = 'none';
        filterResults.innerHTML = '';
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        filterResults.style.display = 'none';
      });
    }

    searchResults.style.display = 'none';

    filterResults.scrollIntoView({ behavior: 'smooth' });
  }
}


function initializeApp() {
  pokemonContainer = document.getElementById('pokemon-container');

  pokemonContainer.insertAdjacentHTML(
    'beforebegin',
    '<div class="d-flex justify-content-between align-items-center mb-3"><h4 class="m-0">Todos os Pokémons</h4></div>'
  );

  loadMoreBtn = document.getElementById('load-more-btn');
  searchInput = document.getElementById('search-input');
  searchBtn = document.getElementById('search-btn');
  searchResults = document.getElementById('search-results');
  filterResults = document.getElementById('filter-results');

  // Carregar iniciais
  loadPokemon(listaAtual, limit);

  if (loadMoreBtn) loadMoreBtn.addEventListener('click', function () { loadPokemon(listaAtual, limit); });
  if (searchBtn) searchBtn.addEventListener('click', searchPokemon);
  if (searchInput) searchInput.addEventListener('keypress', function (e) { if (e.key === 'Enter') searchPokemon(); });

  // Abrir modal
  var openJsBtn = document.getElementById('abrirModal');
  if (openJsBtn) {
    openJsBtn.addEventListener('click', function () {
      var modalEl = document.getElementById('meuModal');
      var modal = new bootstrap.Modal(modalEl);
      modal.show();
    });
  }

  var filtrarBtn = document.getElementById('filtrar');
  if (filtrarBtn) {
    filtrarBtn.addEventListener('click', function () {
      var tiposSelecionados = Array.prototype.slice.call(document.querySelectorAll('input[name="type"]:checked'))
        .map(function (el) { return el.value.trim().toLowerCase(); });

      // fechar modal
      var modalEl = document.getElementById('meuModal');
      var modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      modalInstance.hide();

      if (!tiposSelecionados || tiposSelecionados.length === 0) {
        filterResults.innerHTML = '<div class="alert alert-info">Nenhum tipo selecionado. Marque ao menos um tipo.</div>';
        filterResults.style.display = 'block';
        searchResults.style.display = 'none';
        return;
      }

      filterResults.innerHTML = '<div class="text-center py-4">Carregando resultados...</div>';
      filterResults.style.display = 'block';

      filtrarPorTipos(tiposSelecionados, function (listaFiltrada) {
        mostrarPokemonsFiltrados(listaFiltrada);
      }, function (err) {
        console.error('Erro ao filtrar por tipos:', err);
        filterResults.innerHTML = '<div class="alert alert-danger">Erro ao aplicar filtros. Tente novamente.</div>';
      });
    });
  }
}

// iniciar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', initializeApp);