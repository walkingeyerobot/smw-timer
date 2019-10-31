(function() {
  function formatTime(msRaw, days) {
    let ms = msRaw % 1000;
    let secRaw = Math.floor(msRaw / 1000);
    let sec = secRaw % 60;
    let secString = (sec < 10 ? '0' : '') + sec;
    let minRaw = Math.floor(secRaw / 60);
    let min = minRaw % 60;
    let minString = (min < 10 ? '0' : '') + min;
    let hrRaw = Math.floor(minRaw / 60);
    let hr = hrRaw % 24;
    let hrString = (hr < 10 ? '0' : '') + hr;
    if (!days) {
      return hrString + ':' + minString + ':' + secString;
    }
    let daysRaw = Math.floor(hrRaw / 24);
    return daysRaw + ':' + hrString + ':' + minString + ':' + secString;
  }
  class Split {
    name;
    #time;
    #deaths;
    #current;
    constructor(name, time, deaths) {
      this.name = name;
      this.#time = time;
      this.#deaths = deaths;
    }

    get time() {
      return formatTime(this.#time, false);
    }

    set time(v) {
      this.#time = v;
      if (this.outerDiv) {
        this.timeDiv.textContent = this.time;
      }
    }

    get rawTime() {
      return this.#time;
    }

    get deaths() {
      return this.#deaths;
    }

    set deaths(v) {
      this.#deaths = v;
      if (this.outerDiv) {
        this.deathDiv.textContent = this.#deaths;
      }
    }

    get current() {
      return this.#current;
    }

    set current(v) {
      this.#current = !!v;
      if (this.outerDiv) {
        this.outerDiv.classList.toggle('currentSplit', this.#current);
      }
    }
    
    generateDom() {
      this.outerDiv = document.createElement('div');
      this.outerDiv.classList.add('split');
      this.nameDiv = document.createElement('div');
      this.nameDiv.classList.add('name');
      this.nameDiv.textContent = this.name;
      this.timeDiv = document.createElement('div');
      this.timeDiv.classList.add('time');
      this.timeDiv.textContent = this.time;
      this.deathDiv = document.createElement('div');
      this.deathDiv.classList.add('death');
      this.deathDiv.textContent = this.deaths;
      this.outerDiv.append(this.nameDiv, this.timeDiv, this.deathDiv);
      return this.outerDiv;
    }

    export() {
      return {
        name: this.name,
        time: this.#time,
        deaths: this.deaths,
      };
    }
  }
  var splitsDiv = document.querySelector('#splits');
  var totalTimeDiv = document.querySelector('#totalTime');
  var totalDeathsDiv = document.querySelector('#totalDeaths');
  window.activeTimer = false;
  var startTime;
  var currentSplitIndex;
  let splitsArray = [];
  function addSplit(name) {
    let newSplit = new Split(name, 0, 0);
    splitsArray.push(newSplit);
    splitsDiv.appendChild(newSplit.generateDom());
    if (currentSplitIndex == null) {
      currentSplitIndex = splitsArray.length - 1;
      newSplit.current = true;
    }
  }
  function nextSplit() {
    if (currentSplitIndex + 1 >= splitsArray.length) {
      console.log('can\'t move to next split: on last split');
      return;
    }
    splitsArray[currentSplitIndex].current = false;
    splitsArray[currentSplitIndex + 1].current = true;
    currentSplitIndex++;
    if (window.activeTimer) {
      startTime = Date.now() - splitsArray[currentSplitIndex].rawTime;
    }
  }
  function pauseTimer() {
    window.activeTimer = false;
  }
  function startTimer() {
    window.activeTimer = true;
    startTime = Date.now() - splitsArray[currentSplitIndex].rawTime;
    requestAnimationFrame(interval);
  }
  function interval() {
    var newTime = Date.now() - startTime;
    splitsArray[currentSplitIndex].time = newTime;
    updateTotals();
    saveSplits();
    if (window.activeTimer) {
      requestAnimationFrame(interval);
    } else {
      startTime = undefined;
    }
  }
  function updateTotals() {
    var totals = splitsArray.reduce((acc, v) => {
      acc.time += v.rawTime;
      acc.deaths += v.deaths;
      return acc;
    }, { time: 0, deaths: 0 });
    totalTimeDiv.textContent = formatTime(totals.time, true);
    totalDeathsDiv.textContent = totals.deaths;
  }
  function saveSplits() {
    var saveString = JSON.stringify(splitsArray.map((v, i, a) => {
      return v.export();
    }));
    localStorage.setItem('splitsArray', saveString);
    localStorage.setItem('currentSplitIndex', currentSplitIndex);
  }
  function loadSplits() {
    var loadString = localStorage.getItem('splitsArray');
    if (!loadString) {
      console.log('cannot load splitsArray from localStorage.');
      return;
    }
    var loadArray = JSON.parse(loadString);
    splitsArray = loadArray.map((v, i, a) => {
      var split = new Split(v.name, v.time, v.deaths);
      splitsDiv.appendChild(split.generateDom());
      return split;
    });
    currentSplitIndex = parseInt(localStorage.getItem('currentSplitIndex'), 10);
    splitsArray[currentSplitIndex].current = true;
    updateTotals();
  }
  function addDeath() {
    if (window.activeTimer) {
      splitsArray[currentSplitIndex].deaths++;
    }
  }
  window.loadSplits = loadSplits;
  window.addSplit = addSplit;
  window.nextSplit = nextSplit;
  window.startTimer = startTimer;
  window.pauseTimer = pauseTimer;
  window.addDeath = addDeath;

  splitsDiv.style.top = '0';
  document.addEventListener('keydown', (e) => {
    var oldTop = parseInt(splitsDiv.style.top, 10);
    if (e.key === 'ArrowDown') {
      splitsDiv.style.top = (oldTop - 80) + 'px'
    } else if (e.key === 'ArrowUp') {
      splitsDiv.style.top = (oldTop + 80) + 'px'
    }
  });
  
  loadSplits();
}());
