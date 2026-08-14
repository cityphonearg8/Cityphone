// --- CONFIGURACIÓN DE SUPABASE ---
const SUPABASE_URL = [https://tueisfzfpthrrkvkjfsg.supabase.co] // Reemplaza con tu URL de Supabase
const SUPABASE_ANON_KEY = (https://tueisfzfpthrrkvkjfsg.supabase.co) // Reemplaza con tu Key anónima
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- ESTADO GLOBAL ---
let ventas = [];
let inventario = [];
let productosFallados = [];
let gastosCaja = [];
let servicioIngresos = [];
let servicioCotizaciones = [];
let promocionesLocal = [];
let ticketActual = [];

// --- INICIALIZAR CARGA DESDE LA BASE DE DATOS ---
async function inicializarDatos() {
  try {
    // Cargar ventas
    const { data: dataVentas } = await supabaseClient.from('ventas').select('*');
    if (dataVentas) ventas = dataVentas;

    // Cargar inventario
    const { data: dataInventario } = await supabaseClient.from('inventario').select('*');
    if (dataInventario) inventario = dataInventario;

    // Cargar gastos de caja
    const { data: dataGastos } = await supabaseClient.from('gastos_caja').select('*');
    if (dataGastos) gastosCaja = dataGastos;

    // Cargar servicios técnicos
    const { data: dataServicios } = await supabaseClient.from('servicios_ingresos').select('*');
    if (dataServicios) servicioIngresos = dataServicios;

    renderAll();
  } catch (error) {
    console.error('Error al cargar datos de Supabase:', error);
    showToast('Error al conectar con la base de datos');
  }
}

// Ejecutar al cargar la página
window.addEventListener('DOMContentLoaded', () => {
  inicializarDatos();
});

// --- GESTIÓN DE VENTAS Y TICKETS ---
function agregarAlTicket() {
  const inputProd = document.getElementById('input-producto');
  const inputPrecio = document.getElementById('input-precio');
  const nombre = inputProd.value.trim();
  const precio = parseFloat(inputPrecio.value) || 0;

  if(!nombre || precio <= 0) { showToast('Ingresa producto y precio válidos'); return; }

  ticketActual.push({ id: Date.now(), nombre, precio });
  inputProd.value = '';
  inputPrecio.value = '';
  renderTicket();
}

function renderTicket() {
  const lista = document.getElementById('lista-ticket');
  const totalSpan = document.getElementById('total-ticket');
  let total = 0;
  
  if (!lista) return;

  lista.innerHTML = ticketActual.map((item, index) => {
    total += item.precio;
    return `<li>${item.nombre} - $${item.precio.toLocaleString()} <button onclick="eliminarDelTicket(${index})">❌</button></li>`;
  }).join('');
  
  if(totalSpan) totalSpan.textContent = total.toLocaleString();
}

function eliminarDelTicket(index) {
  ticketActual.splice(index, 1);
  renderTicket();
}

async function finalizarVenta() {
  if(ticketActual.length === 0) { showToast('Ticket vacío'); return; }

  const medio = document.getElementById('medio-pago').value;
  let total = ticketActual.reduce((acc, item) => acc + item.precio, 0);

  if(medio === 'Mixto') {
    let efec = parseFloat(prompt("Monto en Efectivo:")) || 0;
    showToast(`Venta mixta: $${efec} efec / $${total - efec} tarjeta`);
  }

  const nuevaVenta = {
    fecha: new Date().toISOString(),
    total: total,
    medio: medio,
    items: ticketActual
  };

  // Guardar en Supabase
  const { data, error } = await supabaseClient.from('ventas').insert([nuevaVenta]).select();
  
  if (error) {
    showToast('Error al guardar la venta');
    console.error(error);
    return;
  }

  if (data) {
    ventas.push(data[0]);
  }

  ticketActual = [];
  renderTicket();
  renderAll();
  showToast('¡Venta registrada en la nube!');
}

async function anularVenta(id){
  const { error } = await supabaseClient.from('ventas').delete().eq('id', id);
  
  if (error) {
    showToast('Error al anular la venta');
    return;
  }

  ventas = ventas.filter(v => v.id !== id);
  renderAll();
  showToast('Venta anulada correctamente');
}

// --- GESTIÓN DE CAJA Y SERVICIOS ---
async function sacarEfectivoCaja(){
  const monto = parseFloat(document.getElementById('caja-monto').value) || 0;
  const motivo = document.getElementById('caja-motivo').value.trim();
  if(monto <= 0 || !motivo) return;

  const nuevoGasto = {
    fecha: new Date().toISOString(),
    monto: monto,
    motivo: motivo
  };

  const { data, error } = await supabaseClient.from('gastos_caja').insert([nuevoGasto]).select();

  if (error) {
    showToast('Error al registrar salida');
    return;
  }

  if (data) {
    gastosCaja.push(data[0]);
  }

  document.getElementById('caja-monto').value = '';
  document.getElementById('caja-motivo').value = '';
  renderAll();
  showToast('Salida registrada en la nube');
}

async function addServiceIngreso(){
  const nombre = document.getElementById('srv-nombre').value.trim();
  const motivo = document.getElementById('srv-motivo').value.trim();
  const precio = parseFloat(document.getElementById('srv-precio').value) || 0;
  const telefono = document.getElementById('srv-telefono').value.trim();

  if(!nombre || !motivo) return;

  const nuevoServicio = {
    nombre: nombre,
    motivo: motivo,
    precio: precio,
    telefono: telefono,
    estado: 'Ingresado'
  };

  const { data, error } = await supabaseClient.from('servicios_ingresos').insert([nuevoServicio]).select();

  if (error) {
    showToast('Error al ingresar equipo');
    return;
  }

  if (data) {
    servicioIngresos.push(data[0]);
  }

  renderServiciosTecnicos();
  showToast('Equipo ingresado al taller');
}

async function actualizarEstadoServicio(id, nuevoEstado) {
  const { error } = await supabaseClient.from('servicios_ingresos').update({ estado: nuevoEstado }).eq('id', id);

  if (error) {
    showToast('Error al actualizar estado');
    return;
  }

  const item = servicioIngresos.find(i => i.id === id);
  if(item) { 
    item.estado = nuevoEstado; 
    renderServiciosTecnicos(); 
    showToast(`Estado actualizado a: ${nuevoEstado}`);
  }
}

// --- RENDERIZADO GENERAL ---
function renderAll() {
  const tablaHistorial = document.getElementById('tabla-historial-ventas');
  if (tablaHistorial) {
    tablaHistorial.innerHTML = ventas.map(v => `
      <tr>
        <td>${new Date(v.fecha).toLocaleTimeString()}</td>
        <td><span class="badge ok">${v.medio}</span></td>
        <td class="num">$${v.total.toLocaleString()}</td>
        <td><button onclick="anularVenta(${v.id})">Anular</button></td>
      </tr>
    `).join('');
  }

  const totalHoy = ventas.filter(v => new Date(v.fecha).toDateString() === new Date().toDateString()).reduce((a, v) => a + v.total, 0);
  const totalRetiros = gastosCaja.reduce((a, g) => a + g.monto, 0);
  const efectivoEnCaja = (ventas.filter(v => v.medio === 'Efectivo').reduce((a, v) => a + v.total, 0)) - totalRetiros;

  const dashVentaTotal = document.getElementById('dash-venta-total');
  if (dashVentaTotal) dashVentaTotal.textContent = `$${ventas.reduce((a,v)=>a+v.total, 0).toLocaleString()}`;

  const dashVentaDiaria = document.getElementById('dash-venta-diaria');
  if (dashVentaDiaria) dashVentaDiaria.textContent = `$${totalHoy.toLocaleString()}`;

  const cajaStatSaldo = document.getElementById('caja-stat-saldo');
  if (cajaStatSaldo) cajaStatSaldo.textContent = `$${efectivoEnCaja.toLocaleString()}`;
}

function renderServiciosTecnicos(){
  const tbodyIng = document.getElementById('tabla-servicios-ingreso');
  if (!tbodyIng) return;

  tbodyIng.innerHTML = servicioIngresos.map(i => `
    <tr>
      <td>${i.nombre}</td>
      <td>${i.motivo}</td>
      <td class="num">$${i.precio.toLocaleString()}</td>
      <td>
        <select onchange="actualizarEstadoServicio(${i.id}, this.value)">
          <option value="Ingresado" ${i.estado === 'Ingresado' ? 'selected' : ''}>Ingresado</option>
          <option value="Listo para retirar" ${i.estado === 'Listo para retirar' ? 'selected' : ''}>Listo</option>
        </select>
      </td>
    </tr>
  `).join('');
}

function showToast(msg){
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2200);
}
