// --- CONFIGURACIÓN DE SUPABASE ---
const SUPABASE_URL = 'https://tueisfzfpthrrkvkjfsg.supabase.co';
const SUPABASE_ANON_KEY = 'PEGA_AQUI_TU_ANON_KEY';
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

// --- NAVEGACIÓN ENTRE PESTAÑAS (TABS) ---
function switchTab(tabId) {
    // Ocultar todas las secciones con la clase .view
    const vistas = document.querySelectorAll('.view');
    vistas.forEach(vista => {
        vista.classList.remove('active');
    });

    // Mostrar la sección seleccionada
    const vistaActiva = document.getElementById(tabId);
    if (vistaActiva) {
        vistaActiva.classList.add('active');
    }

    // Actualizar el estado activo en los botones del menú lateral
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick') && item.getAttribute('onclick').includes(tabId)) {
            item.classList.add('active');
        }
    });
}

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
  let total = 0;
  
  if (!lista) return;

  lista.innerHTML = ticketActual.map((item, index) => {
    total += item.precio;
    return `<li style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--line);">
              <span>${item.nombre} - <strong>$${item.precio.toLocaleString()}</strong></span>
              <button class="btn-danger btn-sm" onclick="eliminarDelTicket(${index})">❌</button>
            </li>`;
  }).join('');
}

function eliminarDelTicket(index) {
  ticketActual.splice(index, 1);
  renderTicket();
}

async function finalizarVenta() {
  if(ticketActual.length === 0) { showToast('Ticket vacío'); return; }

  const medio = document.getElementById('medio-pago').value;
  let total = ticketActual.reduce((acc, item) => acc + item.precio, 0);

  if(medio === 'mixto') {
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

function abrirCierreMensual() {
  const resumen = document.getElementById('resumen-cierre');
  if (resumen) {
    resumen.style.display = 'block';
    const totalGastosMes = gastosCaja.reduce((acc, g) => acc + g.monto, 0);
    const totalVentasMes = ventas.reduce((acc, v) => acc + v.total, 0);
    document.getElementById('balance-final').textContent = `$${(totalVentasMes - totalGastosMes).toLocaleString()}`;
  }
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

function nuevaReparacion() {
  // Placeholder para la acción de nueva reparación
  const cliente = prompt("Nombre del cliente:");
  const falla = prompt("Motivo de ingreso / Falla:");
  const precio = parseFloat(prompt("Precio de reparación:")) || 0;
  if(cliente && falla) {
    document.getElementById('srv-nombre') ? document.getElementById('srv-nombre').value = cliente : null;
    addServiceIngreso();
  }
}

function nuevaCotizacion() {
  alert("Función de cotización rápida lista para configurar.");
}

// --- RENDERIZADO GENERAL ---
function renderAll() {
  // Historial de ventas en POS
  const tablaHistorial = document.getElementById('tabla-historial');
  if (tablaHistorial) {
    const cuerpo = document.getElementById('cuerpo-historial');
    if(cuerpo) {
      cuerpo.innerHTML = ventas.map(v => `
        <tr>
          <td>${new Date(v.fecha).toLocaleTimeString()}</td>
          <td>${v.items ? v.items.map(i => i.nombre).join(', ') : 'Venta directa'}</td>
          <td class="num">$${v.total.toLocaleString()}</td>
          <td><button class="btn-danger btn-sm" onclick="anularVenta(${v.id})">Anular</button></td>
        </tr>
      `).join('');
    }
  }

  // Cálculos para Dashboard
  const totalHistorico = ventas.reduce((a,v)=>a+v.total, 0);
  const totalHoy = ventas.filter(v => new Date(v.fecha).toDateString() === new Date().toDateString()).reduce((a, v) => a + v.total, 0);
  const totalMes = ventas.reduce((a, v) => a + v.total, 0); // Ajustable si filtras por mes actual
  
  const totalRetiros = gastosCaja.reduce((a, g) => a + g.monto, 0);
  const efectivoEnCaja = (ventas.filter(v => v.medio === 'efectivo').reduce((a, v) => a + v.total, 0)) - totalRetiros;

  // Actualizar elementos del Dashboard
  const valHistorica = document.getElementById('val-historica');
  if (valHistorica) valHistorica.textContent = totalHistorico.toLocaleString();

  const valHoy = document.getElementById('val-hoy');
  if (valHoy) valHoy.textContent = totalHoy.toLocaleString();

  const valMes = document.getElementById('val-mes');
  if (valMes) valMes.textContent = totalMes.toLocaleString();

  const efectivoCaja = document.getElementById('efectivo-caja');
  if (efectivoCaja) efectivoCaja.textContent = efectivoEnCaja.toLocaleString();

  const totalGastos = document.getElementById('total-gastos');
  if (totalGastos) totalGastos.textContent = totalRetiros.toLocaleString();

  renderServiciosTecnicos();
}

function renderServiciosTecnicos(){
  const tbodyIng = document.getElementById('lista-tecnico');
  if (!tbodyIng) return;

  tbodyIng.innerHTML = servicioIngresos.map(i => `
    <tr>
      <td>${i.nombre}</td>
      <td><span class="badge ${i.estado === 'Ingresado' ? 'low' : 'ok'}">${i.estado}</span></td>
      <td>${i.motivo}</td>
      <td>
        <select class="btn-sm" onchange="actualizarEstadoServicio(${i.id}, this.value)">
          <option value="Ingresado" ${i.estado === 'Ingresado' ? 'selected' : ''}>Ingresado</option>
          <option value="Listo para retirar" ${i.estado === 'Listo para retirar' ? 'selected' : ''}>Listo</option>
        </select>
      </td>
    </tr>
  `).join('');
}

function showToast(msg){
  let t = document.getElementById('toast');
  if (!t) {
    // Crear el elemento toast dinámicamente si no existe en el HTML
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2200);
}
