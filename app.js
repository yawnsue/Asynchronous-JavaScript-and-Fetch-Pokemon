"use strict";

var API_BASE = "https://pokeapi.co/api/v2/pokemon/";

var input = document.getElementById("pokeInput");
var findBtn = document.getElementById("findBtn");
var addBtn  = document.getElementById("addBtn");

var pokeImg = document.getElementById("pokeImg");
var pokeAudio = document.getElementById("pokeAudio");

var move1 = document.getElementById("move1");
var move2 = document.getElementById("move2");
var move3 = document.getElementById("move3");
var move4 = document.getElementById("move4");

var teamBox = document.getElementById("teamBox");

var current = null;
var team = [];

function normalize(q) {
  return (q || "").trim().toLowerCase();
}

function getCached(key) {
  var raw = localStorage.getItem(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function setCached(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
}

function setPlaceholder() {
  var c = document.createElement("canvas");
  c.width = 80;
  c.height = 220;

  var ctx = c.getContext("2d");
  var imgData = ctx.createImageData(c.width, c.height);

  for (var i = 0; i < imgData.data.length; i += 4) {
    var v = Math.floor(Math.random() * 256);
    imgData.data[i] = v;
    imgData.data[i + 1] = Math.floor(v * 0.9);
    imgData.data[i + 2] = v;
    imgData.data[i + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);
  pokeImg.src = c.toDataURL("image/png");

  pokeAudio.src = "";
  pokeAudio.load();

  fillSelect(move1, []);
  fillSelect(move2, []);
  fillSelect(move3, []);
  fillSelect(move4, []);

  current = null;
}

function fillSelect(sel, names) {
  sel.innerHTML = "";

  if (names.length === 0) {
    var blank = document.createElement("option");
    blank.value = "";
    blank.textContent = "";
    sel.appendChild(blank);
    return;
  }

  for (var i = 0; i < names.length; i++) {
    var opt = document.createElement("option");
    opt.value = names[i];
    opt.textContent = names[i];
    sel.appendChild(opt);
  }
}

function getSprite(data) {
  if (data && data.sprites && data.sprites.front_default) return data.sprites.front_default;
  return "";
}

function getCry(data) {
  if (data && data.cries) {
    if (data.cries.latest) return data.cries.latest;
    if (data.cries.legacy) return data.cries.legacy;
  }
  return "";
}

function getMoves(data) {
  var names = [];
  if (data && Array.isArray(data.moves)) {
    for (var i = 0; i < data.moves.length; i++) {
      var m = data.moves[i];
      if (m && m.move && m.move.name) names.push(m.move.name);
    }
  }
  names.sort(function(a, b) { return a.localeCompare(b); });
  return names;
}

function fetchPokemon(q) {
  var query = normalize(q);
  if (!query) return Promise.reject("empty");

  var cacheKey = "pokemon:" + query;
  var cached = getCached(cacheKey);
  if (cached) return Promise.resolve(cached);

  return fetch(API_BASE + encodeURIComponent(query))
    .then(function(response) {
      if (!response.ok) throw "notfound";
      return response.json();
    })
    .then(function(data) {
      setCached(cacheKey, data);
      return data;
    });
}

function loadToUI(data) {
  var sprite = getSprite(data);
  if (sprite) pokeImg.src = sprite;

  var cry = getCry(data);
  pokeAudio.src = cry;
  pokeAudio.load();

  var moves = getMoves(data);
  fillSelect(move1, moves);
  fillSelect(move2, moves);
  fillSelect(move3, moves);
  fillSelect(move4, moves);

  if (moves.length >= 4) {
    move1.value = moves[0];
    move2.value = moves[1];
    move3.value = moves[2];
    move4.value = moves[3];
  }

  current = { name: data.name, sprite: sprite };
}

function selectedMoves() {
  return [move1.value, move2.value, move3.value, move4.value];
}

function renderTeam() {
  if (team.length === 0) {
    teamBox.style.display = "none";
    teamBox.innerHTML = "";
    return;
  }

  teamBox.style.display = "block";
  teamBox.innerHTML = "";

  for (var i = 0; i < team.length; i++) {
    var member = team[i];

    var row = document.createElement("div");
    row.className = "teamRow";

    var left = document.createElement("div");
    left.className = "teamLeft";

    var img = document.createElement("img");
    img.src = member.sprite;
    img.alt = member.name;
    left.appendChild(img);

    var right = document.createElement("div");
    right.className = "teamRight";

    for (var j = 0; j < member.moves.length; j++) {
      var mv = member.moves[j];

      var line = document.createElement("div");
      line.className = "moveLine";

      var dot = document.createElement("div");
      dot.className = "dot";
      dot.textContent = "•";

      var txt = document.createElement("div");
      txt.textContent = mv;

      line.appendChild(dot);
      line.appendChild(txt);
      right.appendChild(line);
    }

    row.appendChild(left);
    row.appendChild(right);
    teamBox.appendChild(row);
  }
}

function onFind() {
  fetchPokemon(input.value).then(
    function(data) { loadToUI(data); },
    function() { setPlaceholder(); }
  );
}

function onAdd() {
  if (!current) return;

  team.push({
    name: current.name,
    sprite: current.sprite,
    moves: selectedMoves()
  });

  renderTeam();
}

findBtn.addEventListener("click", onFind);
addBtn.addEventListener("click", onAdd);

setPlaceholder();