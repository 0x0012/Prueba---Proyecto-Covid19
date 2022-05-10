// Obtiene información al cargar HTML
$(document).ready( _ => {
  loadHome()
})

// Carga vista Home
const loadHome = async _ => {
  let data = await loadTotal()
  loadGraphic(over10000active(data))
  loadTable(data)
}

// Consulta API por estadísticas mundiales
const loadTotal = async _ => {
  try {
    const response = await fetch('http://localhost:3000/api/total')
    const data = await response.json()
    return data
  } catch (err) {
    console.error(`ERROR: ${err}`)
  }
}

// Consulta API por estadísticas de un país
const loadCountry = async location => {
  try {
    const response = await fetch(`http://localhost:3000/api/countries/${location}`)
    const {data} = await response.json()
    return data
  } catch (err) {
    console.error(`ERROR: ${err}`)
  }
}

// Devuelve los países con más de 10.000 casos activos en orden descendente
const over10000active = data => {
  return data.filter(d => d.active > 10000).sort((a, b) => b.active - a.active)
}

// Muestra tabla con información de países
const loadTable = info => {
  const table = `<table class="table table-sm">
                  <thead>
                    <tr>
                      <th scope="col">País</th>
                      <th scope="col">Confirmados</th>
                      <th scope="col">Muertes</th>
                      <th scope="col">Recuperados</th>
                      <th scope="col">Activos</th>
                      <th scope="col"></th>
                    </tr>
                  </thead>
                  <tbody>
                  </tbody>
                </table>`
  $('#js-table').html(table)
  
  let rows = ''
  $.each(info, (i, row) => {
    let recovered = (row.recovered == null) ? 0 : row.recovered // Mostrar datos null como 0
    rows += `<tr>
              <td>${row.country}</td>
              <td>${row.confirmed.toLocaleString()}</td>
              <td>${row.deaths.toLocaleString()}</th>
              <td>${recovered.toLocaleString()}</th>
              <td>${row.confirmed.toLocaleString()}</th>
              <td><a href="#" class="badge badge-primary">Ver detalles</a></td>
             </tr>`
  })
  $('#js-table table tbody').html(rows)
}

// Login
$('#js-nav-login').click(function(e) {
  e.preventDefault()
  if ($(this).text() == 'Iniciar Sesión') {
    showModalLogin()
  } else {
    setLoged(false) // Cierra sesión 
  }
})

// Situación de Chile
$('#js-nav-chile').click(function(e) {
  e.preventDefault()

  loadChile()
})

// Carga información de Chile
const loadChile = async _ => {
  const jwt = localStorage.getItem('jwt')
  const params = {method: 'GET', headers: {Authorization: `Bearer ${jwt}`}}
  
  const getConfirmed = async _ => {
    try {
      const response = await fetch('http://localhost:3000/api/confirmed', params)
      const {data} = await response.json()
      return data
    } catch (err) {
      console.error(`Error: ${err}`)
    }
  }
  
  const getDeaths = async _ => {
    try {
      const response = await fetch('http://localhost:3000/api/deaths', params)
      const {data} = await response.json()
      return data
    } catch (err) {
      console.error(`Error: ${err}`)
    }
  } 
  
  const getRecovered = async _ => {
    try {
      const response = await fetch('http://localhost:3000/api/recovered', params)
      const {data} = await response.json()
      return data
    } catch (err) {
      console.error(`Error: ${err}`)
    }
  }
  
  const confirmed = await getConfirmed()
  const deaths = await getDeaths()
  const recovered = await getRecovered()

  loadChileChart(confirmed, deaths, recovered)
}

// Muestra ventana modal login
const showModalLogin = _ => {
  const form = `<form>
                  <div class="form-group row">
                    <label class="col-sm-3 col-form-label">Email</label>
                    <div class="col-sm-9">
                      <input type="text" class="form-control" id="js-input-email" placeholder="email@ejemplo.com">
                    </div>
                  </div>
                  <div class="form-group row">
                    <label class="col-sm-3 col-form-label">Password</label>
                    <div class="col-sm-9">
                      <input type="password" class="form-control" id="js-input-password" placeholder="Password">
                    </div>
                  </div>
                </form>`
  
   const body = `<div class="modal-header">
                  <h5 class="modal-title"><strong>Iniciar Sesión</strong></h5>
                </div>
                <div class="modal-body">
                  ${form}
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-dismiss="modal">Cerrar</button>
                  <button id="js-btn-login" type="button" class="btn btn-primary">Iniciar Sesión</button>
                </div>`
  
  $('.modal-content').html(body)
  $('#js-modal').modal('show')
  
  $(document).on('click', '#js-btn-login', async _ => {
    const isLoged = await login($('#js-input-email').val(), $('#js-input-password').val())
    if (isLoged) {
      $('#js-modal').modal('hide')
    }
  }) 
}

// Login fetch
const login = async (email, password) => {
  try {
    const response = await fetch('http://localhost:3000/api/login',
    {
      method: 'POST',
      body: JSON.stringify({email: email, password: password})    
    })
    const {token} = await response.json()
    
    if (token) {
      localStorage.setItem('jwt', token)
      setLoged(true)
      return token
    } else {
      throw new Error('Email o Password incorrecto')
    }
  } catch (err) {
    console.error(`${err}`)
  }
}

// Establece estado de login
const setLoged = isLoged => {
  if (isLoged) {
    $('#js-nav-chile').css('display', 'block')
    $('#js-nav-login').text('Cerrar Sesión')
  } else {
    $('#js-nav-chile').css('display', 'none')
    $('#js-nav-login').text('Iniciar Sesión')
    localStorage.clear()
  }
}

// Tabla: Ver detalles
$(document).on('click', '.badge', async function(e) {
  e.preventDefault()
  
  const location = $(this).parent().siblings(':first').text()
  // let data = await loadTotal() // loadCountry(location) : No funciona con nombres compuestos
  // const [country] = data.filter(l => l.location == location)
  
  showModalCountry(country)
})

// Muestra ventana modal con detalles del país
const showModalCountry = info => {
   const body = `<div class="modal-header">
                  <h5 class="modal-title"><strong>${info.location}</strong></h5>
                </div>
                <div class="modal-body">
                  <canvas id="myDoughnut" class="mx-auto" width="300" height="300"></canvas>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-primary" data-dismiss="modal">Cerrar</button>
                </div>`
  $('.modal-content').html(body)
  
  $('#js-modal').modal('show')
  loadDoughnut(info)
}

// Gráficos chart.js

// Gráfico de barras inicial
const loadGraphic = info => {
  const labels = info.map( i => i.country)  
  const confirmed = info.map( i => i.confirmed)
  const deaths = info.map( i => i.deaths)
  const recovered = info.map( i => i.recovered)
  const active = info.map( i => i.active)
  
  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Confirmados',
        data: confirmed,
        backgroundColor: 'rgba(255, 99, 132, 1)',
        stack: 'Stack 0',
        yAxisID: 'y',
      },
      {
        label: 'Muertos',
        data: deaths,
        backgroundColor: 'rgba(54, 162, 235, 1)',
        stack: 'Stack 1',
        yAxisID: 'y',
      },
      {
        label: 'Recuperados',
        data: recovered,
        backgroundColor: 'rgba(75, 192, 192, 1)',
        stack: 'Stack 2',
        yAxisID: 'y',
      },
      {
        label: 'Activos',
        data: active,
        backgroundColor: 'rgba(255, 205, 86, 1)',
        stack: 'Stack 3',
        yAxisID: 'y'
      },
    ]
  }
  
  const config = {
    type: 'bar',
    data: data,
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Países con más de 10.000 casos activos'
        },
      },
      responsive: false,
      interaction: {
        intersect: false,
      },
      scales: {
        x: {
          stacked: true,
        },
        y: {
          stacked: true,
          position: 'left',
          title: {
            display: true,
            text: 'Casos',
            color: 'rgba(255, 99, 132, 1)',            
          },
        },
      }
    }
  }
  
  const ctx = $('#myChart')
  const myChart = new Chart(ctx, config)
}

// Gráfico tipo dona para modal
const loadDoughnut = info => {
  const data = {
    labels : ['Muertos', 'Recuperados', 'Activos'],
    datasets: [{
      data : [info.deaths, Math.floor((info.confirmed - info.deaths) * 0.7), Math.floor((info.confirmed - info.deaths) * 0.3)],
      backgroundColor: [
              'rgb(255, 99, 132)',
              'rgb(54, 162, 235)',
              'rgb(255, 205, 86)'
      ],
      hoverOffset: 4
    }]
  }
  const config = {
      type: 'doughnut',
      data: data,
  }
  const ctx = $('#myDoughnut')
  const myChart = new Chart(ctx, config)
}

// Gráfico de casos de Chile
const loadChileChart = (confirmed, deaths, recovered) => {
  const l = confirmed.slice(0,560).map(dates => dates.date)
  const c = confirmed.slice(0,560).map(c => c.total)
  const d = deaths.slice(0,560).map(d => d.total)
  const r = recovered.slice(0,560).map(r => r.total)
  
  const data = {
    labels: l,
    datasets: [
      {
        label: 'Confirmados',
        data: c,
        borderColor: 'rgba(255, 205, 86, 1)',
        fill: false,
        tension: 0.4
      },
      {
        label: 'Muertos',
        data: d,
        borderColor: 'rgba(255, 99, 132, 1)',
        fill: false,
        tension: 0.4
      },
      {
        label: 'Recuperados',
        data: r,
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: false,
        tension: 0.4
      } 
    ]
  }
  
  const config = {
    type: 'line',
    data: data,
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Situación Chile'
        },
      },
      responsive: false,
      interaction: {
        intersect: false,
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Fecha',
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Casos',
          },
        },
      }
    }
  }
  
  let oldChart = Chart.getChart('myChart')
  oldChart.destroy()
  const ctx = $('#myChart')
  const myChart = new Chart(ctx, config)
}
