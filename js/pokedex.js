const urlBase = 'https://pokeapi.co/api/v2';

// Variáveis globais
let listaAtual = 0;
const limit = 8;
let isLoading = false;

// Elementos do DOM (serão inicializados quando o DOM estiver carregado)
let pokemonContainer;
let loadMoreBtn;
let searchInput;
let searchBtn;
let searchResults;

// Função para buscar dados do Pokémon na API
async function fetchPokemonData(pokemonIdOrName) {
  try {
    const response = await fetch(`${urlBase}/pokemon/${pokemonIdOrName}`);
    if (!response.ok) {
      throw new Error('Pokemon não encontrado');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

// Função para buscar informações da espécie (para obter a geração)
async function fetchPokemonSpecies(speciesUrl) {
  try {
    const response = await fetch(speciesUrl);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    return null;
  }
}

// Função para obter a geração do Pokémon
function getGeneration(generationUrl) {
  if (!generationUrl) return 'Desconhecida';

  const match = generationUrl.match(/generation\/(\d+)\//);
  if (match) {
    const genNum = parseInt(match[1]);
    return `${genNum}º`;
  }
  return 'Desconhecida';
}


function criaCard(pokemonData, speciesData = null) {
  const pokemonId = pokemonData.id;
  const name = pokemonData.name.charAt(0).toUpperCase() + pokemonData.name.slice(1);
  const types = pokemonData.types.map(t => t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)).join(', ');
  const weight = (pokemonData.weight / 10).toFixed(1);
  const generation = speciesData ? getGeneration(speciesData.generation.url) : 'Desconhecida';

  // URLs das imagens
  const imagemNormal = pokemonData.sprites.other['official-artwork'].front_default ||
    pokemonData.sprites.front_default ||
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/' + pokemonId + '.png';

  const imagemShiny = pokemonData.sprites.other['official-artwork'].front_shiny ||
    pokemonData.sprites.front_shiny ||
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/' + pokemonId + '.png';

  const uniqueId = `carousel-${pokemonId}-${Date.now()}`;

  return `
    <div class="col-lg-3 col-md-4 col-sm-6 col-12">
      <div class="card">
        <div id="${uniqueId}" class="carousel slide">
          <div class="carousel-inner">
            <div class="carousel-item active">
              <img src="${imagemNormal}" class="d-block" alt="${name}" onerror="this.src='https://via.placeholder.com/200?text=${name}'">
            </div>
            <div class="carousel-item">
              <img src="${imagemShiny}" class="d-block" alt="${name} Shiny" onerror="this.src='${imagemNormal}'">
            </div>
          </div>
          <button class="carousel-control-prev" type="button" data-bs-target="#${uniqueId}" data-bs-slide="prev">
            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Previous</span>
          </button>
          <button class="carousel-control-next" type="button" data-bs-target="#${uniqueId}" data-bs-slide="next">
            <span class="carousel-control-next-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Next</span>
          </button>
        </div>
        <div class="card-body">
          <h3 class="card-title">${name}</h3>
          <p class="card-text">ID: ${pokemonId}</p>
          <p class="card-text">Tipo: ${types}</p>
          <p class="card-text">Peso: ${weight}kg</p>
          <p class="card-text">Geração: ${generation}</p>
        </div>
        <div class="btn-group" role="group" aria-label="Basic example">
          <a href="https://www.pokemon.com/br/pokedex/${pokemonId}" class="btn btn-primary" target="_blank">Ver Pokemon</a>
        </div>
      </div>
    </div>
  `;
}

// Função para carregar múltiplos Pokémon
async function loadPokemon(offset, limit) {
  if (isLoading) return;

  isLoading = true;

  try {
    // Buscar lista de Pokémon
    const response = await fetch(`${urlBase}/pokemon?offset=${offset}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Erro ao carregar Pokémon');
    }

    const data = await response.json();

    // Buscar dados detalhados de cada Pokémon
    const pokemonPromises = data.results.map(pokemon => fetchPokemonData(pokemon.name));
    const pokemonDataArray = await Promise.all(pokemonPromises);

    // Buscar dados de espécie para cada Pokémon (para obter geração)
    const speciesPromises = pokemonDataArray.map(pokemon =>
      fetchPokemonSpecies(pokemon.species.url)
    );
    const speciesDataArray = await Promise.all(speciesPromises);

    // Criar cards
    pokemonDataArray.forEach((pokemonData, index) => {
      const speciesData = speciesDataArray[index];
      const cardHTML = criaCard(pokemonData, speciesData);
      pokemonContainer.insertAdjacentHTML('beforeend', cardHTML);
    });

    // Atualizar offset
    listaAtual += limit;

    // Verificar se há mais Pokémon para carregar
    if (!data.next) {
      loadMoreBtn.style.display = 'none';
    }

  } catch (error) {
    console.error('Erro ao carregar Pokémon:', error);
    alert('Erro ao carregar Pokémon. Tente novamente.');
  } finally {
    isLoading = false;
  }
}

// Função para buscar Pokémon específico
async function searchPokemon() {
  const searchTerm = searchInput.value.trim().toLowerCase();

  if (!searchTerm) {
    alert('Por favor, digite o nome ou ID do Pokémon');
    return;
  }

  // Limpar resultados anteriores
  searchResults.innerHTML = '';
  searchResults.style.display = 'block';

  try {
    const pokemonData = await fetchPokemonData(searchTerm);
    const speciesData = await fetchPokemonSpecies(pokemonData.species.url);

    const cardHTML = criaCard(pokemonData, speciesData);
    searchResults.innerHTML = `
      <div class="row">
        ${cardHTML}
      </div>
    `;

    // Limpar input
    searchInput.value = '';

  } catch (error) {
    searchResults.innerHTML = `
      <div class="alert alert-warning text-center" role="alert">
        Pokemon não encontrado
      </div>
    `;
  }
}

// Inicializar elementos do DOM e event listeners
function initializeApp() {
  // Inicializar elementos do DOM
  pokemonContainer = document.getElementById('pokemon-container');
  loadMoreBtn = document.getElementById('load-more-btn');
  searchInput = document.getElementById('search-input');
  searchBtn = document.getElementById('search-btn');
  searchResults = document.getElementById('search-results');

  // Event Listeners
  loadMoreBtn.addEventListener('click', () => {
    loadPokemon(listaAtual, limit);
  });

  searchBtn.addEventListener('click', searchPokemon);

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchPokemon();
    }
  });

  // Carregar Pokémon iniciais
  loadPokemon(listaAtual, limit);
}

// Carregar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initializeApp);

