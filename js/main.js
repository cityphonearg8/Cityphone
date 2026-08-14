let inventario = []; // Definimos la variable globalmente para que todas las funciones la reconozcan

function anularVenta(id){
  ventas = ventas.filter(v => v.id !== id);
  renderAll();
  showToast('Venta anulada correctamente');
}

function sacarEfectivoCaja(){
  const monto = parseFloat(document.getElementById('caja-monto').value) || 0;
  const motivo = document.getElementById('caja-motivo').value.trim();

  if(monto <= 0 || !motivo) { showToast('Ingresa un monto válido y un motivo'); return; }

  gastosCaja.push({ id: Date.now(), fecha: new Date(), monto, motivo });

  document.getElementById('caja-monto').value = '';
  document.getElementById('caja-motivo').value = '';

  renderAll();
  showToast('Salida de caja registrada');
}

function abrirModalCierreMes() {
  document.getElementById('modal-cierre-mes').classList.add('active');
}

function cerrarModalCierreMes() {
  document.getElementById('modal-cierre-mes').classList.remove('active');
}

function addServiceIngreso(){
  const nombre = document.getElementById('srv-nombre').value.trim();
  const apellido = document.getElementById('srv-apellido').value.trim();
  const telefono = document.getElementById('srv-telefono').value.trim();
  const email = document.getElementById('srv-email').value.trim();
  const motivo = document.getElementById('srv-motivo').value.trim();
  const precio = parseFloat(document.getElementById('srv-precio').value) || 0;

  if(!nombre || !motivo) { showToast('Completa al menos el nombre y el motivo'); return; }

  servicioIngresos.push({ id: Date.now(), nombre, apellido, telefono, email, motivo, precio, estado: 'Ingresado' });

  document.getElementById('srv-nombre').value = '';
  document.getElementById('srv-apellido').value = '';
  document.getElementById('srv-telefono').value = '';
  document.getElementById('srv-email').value = '';
  document.getElementById('srv-motivo').value = '';
  document.getElementById('srv-precio').value = '';

  renderServiciosTecnicos();
  showToast('Equipo ingresado al taller');
}

function addCotizacion(){
  const nombre = document.getElementById('cot-nombre').value.trim();
  const apellido = document.getElementById('cot-apellido').value.trim();
  const telefono = document.getElementById('cot-telefono').value.trim();
  const email = document.getElementById('cot-email').value.trim();
  const motivo = document.getElementById('cot-motivo').value.trim();
  const precio = parseFloat(document.getElementById('cot-precio').value) || 0;

  if(!nombre || !motivo) { showToast('Completa al menos el nombre y el detalle'); return; }

  servicioCotizaciones.push({ id: Date.now(), nombre, apellido, telefono, email, motivo, precio });

  document.getElementById('cot-nombre').value = '';
  document.getElementById('cot-apellido').value = '';
  document.getElementById('cot-telefono').value = '';
  document.getElementById('cot-email').value = '';
  document.getElementById('cot-motivo').value = '';
  document.getElementById('cot-precio').value = '';

  renderServiciosTecnicos();
  showToast('Cotización guardada');
}

function actualizarEstadoServicio(id, nuevoEstado) {
  const item = servicioIngresos.find(i => i.id === id);
  if(item) {
    item.estado = nuevoEstado;
    showToast(`Estado actualizado a: ${nuevoEstado}`);
    renderServiciosTecnicos();
  }
}

function eliminarServicioIngreso(id) {
  servicioIngresos = servicioIngresos.filter(i => i.id !== id);
  renderServiciosTecnicos();
  showToast('Orden eliminada correctamente');
}

function eliminarCotizacion(id) {
  servicioCotizaciones = servicioCotizaciones.filter(i => i.id !== id);
  renderServiciosTecnicos();
  showToast('Cotización eliminada correctamente');
}

function enviarWhatsAppServicio(tipo, id){
  const lista = tipo === 'ingreso' ? servicioIngresos : servicioCotizaciones;
  const item = lista.find(i => i.id === id);
  if(!item) return;

  const msg = tipo === 'ingreso'
    ? `Hola *${item.nombre} ${item.apellido}*! Desde *City Phone* te escribimos para informarte el estado actual de tu equipo. Estado: *${item.estado}*. Motivo: ${item.motivo}. Costo total: $${item.precio.toLocaleString()}. ¡Cualquier duda estamos a disposición!`
    : `Hola *${item.nombre} ${item.apellido}*! Desde *City Phone* te enviamos tu cotización solicitada. Detalle: ${item.motivo}. Presupuesto: $${item.precio.toLocaleString()}. ¡Esperamos tu confirmación!`;

  const url = `https://api.whatsapp.com/send?phone=${item.telefono}&text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

function renderServiciosTecnicos(){
  const tbodyIng = document.getElementById('tabla-servicios-ingreso');
  if(servicioIngresos.length === 0){
    tbodyIng.innerHTML = '<tr><td colspan="7" class="empty">No hay equipos ingresados</td></tr>';
  } else {
    tbodyIng.innerHTML = servicioIngresos.map(i => `
      <tr>
        <td><strong>${i.nombre} ${i.apellido}</strong></td>
        <td>${i.telefono}<br><small style="color:var(--muted);">${i.email}</small></td>
        <td>${i.motivo}</td>
        <td class="num">$${i.precio.toLocaleString()}</td>
        <td style="text-align: center;">
          <select onchange="actualizarEstadoServicio(${i.id}, this.value)" style="padding: 6px; font-size: 12px; font-weight: 600;">
            <option value="Ingresado" ${i.estado === 'Ingresado' ? 'selected' : ''}>Ingresado</option>
            <option value="En reparación" ${i.estado === 'En reparación' ? 'selected' : ''}>En reparación</option>
            <option value="Listo para retirar" ${i.estado === 'Listo para retirar' ? 'selected' : ''}>Listo para retirar</option>
            <option value="Entregado" ${i.estado === 'Entregado' ? 'selected' : ''}>Entregado</option>
          </select>
        </td>
        <td style="text-align: center;"><button class="btn-whatsapp btn-sm" onclick="enviarWhatsAppServicio('ingreso', ${i.id})">Enviar Estado</button></td>
        <td style="text-align: center;"><button class="btn-danger btn-sm" onclick="eliminarServicioIngreso(${i.id})">Eliminar</button></td>
      </tr>
    `).join('');
  }

  const tbodyCot = document.getElementById('tabla-servicios-cotizacion');
  if(servicioCotizaciones.length === 0){
    tbodyCot.innerHTML = '<tr><td colspan="6" class="empty">No hay cotizaciones registradas</td></tr>';
  } else {
    tbodyCot.innerHTML = servicioCotizaciones.map(i => `
      <tr>
        <td><strong>${i.nombre} ${i.apellido}</strong></td>
        <td>${i.telefono}<br><small style="color:var(--muted);">${i.email}</small></td>
        <td>${i.motivo}</td>
        <td class="num">$${i.precio.toLocaleString()}</td>
        <td style="text-align: center;"><button class="btn-whatsapp btn-sm" onclick="enviarWhatsAppServicio('cotizacion', ${i.id})">Enviar Cotización</button></td>
        <td style="text-align: center;"><button class="btn-danger btn-sm" onclick="eliminarCotizacion(${i.id})">Eliminar</button></td>
      </tr>
    `).join('');
  }
}

function calcularPromocionProducto(){
  const producto = document.getElementById('promo-prod').value.trim();
  const costo = parseFloat(document.getElementById('promo-costo').value) || 0;
  const venta = parseFloat(document.getElementById('promo-venta').value) || 0;

  if(!producto) { showToast('Ingresa el nombre del producto'); return; }

  const margen = venta > 0 ? (((venta - costo) / venta) * 100).toFixed(1) : 0;
  let promoSugerida = margen > 40 ? '2x1 en efectivo o 15% OFF' : 'Descuento contado efectivo 10%';

  promocionesLocal.push({ producto, costo, venta, margen, promoSugerida });

  document.getElementById('promo-prod').value = '';
  document.getElementById('promo-costo').value = '';
  document.getElementById('promo-venta').value = '';

  renderPromociones();
  showToast('Promoción y margen calculados');
}

function renderPromociones(){
  const tbody = document.getElementById('tabla-promociones-activas');
  if(promocionesLocal.length === 0){
    tbody.innerHTML = '<tr><td colspan="5" class="empty">No hay productos con promoción configurada</td></tr>';
    return;
  }
  tbody.innerHTML = promocionesLocal.map(p => `
    <tr>
      <td><strong>${p.producto}</strong></td>
      <td class="num">$${p.costo.toLocaleString()}</td>
      <td class="num">$${p.venta.toLocaleString()}</td>
      <td class="num" style="color:var(--primary-hover); font-weight:700;">${p.margen}%</td>
      <td><span class="badge success">${p.promoSugerida}</span></td>
    </tr>
  `).join('');
}

const mesesNombres = [
  {num: '01', name: 'Enero'}, {num: '02', name: 'Febrero'}, {num: '03', name: 'Marzo'},
  {num: '04', name: 'Abril'}, {num: '05', name: 'Mayo'}, {num: '06', name: 'Junio'},
  {num: '07', name: 'Julio'}, {num: '08', name: 'Agosto'}, {num: '09', name: 'Septiembre'},
  {num: '10', name: 'Octubre'}, {num: '11', name: 'Noviembre'}, {num: '12', name: 'Diciembre'}
];

function renderMonthsGrid(){
  const container = document.getElementById('months-grid-container');
  container.innerHTML = mesesNombres.map(m => `
    <div class="month-box" onclick="abrirModalMes('${m.num}', '${m.name}')">
      <div class="month-box-title">${m.name} 2026</div>
      <div style="font-size: 12px; color: var(--muted); margin-bottom: 6px;">Total Acumulado</div>
      <div class="month-box-stat">$0</div>
    </div>
  `).join('');
}

function abrirModalMes(mesNum, mesNombre){
  document.getElementById('modal-mes-titulo').textContent = `Reporte de ${mesNombre} 2026`;
  document.getElementById('modal-mes-dias').classList.add('active');
  
  const container = document.getElementById('dias-mes-container');
  container.innerHTML = '';
  
  for(let i=1; i<=31; i++){
    const btn = document.createElement('button');
    btn.className = 'day-btn';
    btn.textContent = `Día ${i}`;
    btn.onclick = () => {
      document.querySelectorAll('.day-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('modal-dia-subtitulo').textContent = `Ventas del Día ${i} de ${mesNombre}`;
      
      const ventasDia = ventas.filter(v => new Date(v.fecha).getDate() === i);
      const tablaContainer = document.getElementById('reporte-ventas-tabla');
      
      if(ventasDia.length === 0){
        tablaContainer.innerHTML = '<div class="empty">No hay ventas registradas para este día.</div>';
      } else {
        tablaContainer.innerHTML = `<table><thead><tr><th>Hora</th><th>Medio</th><th class="num">Total</th></tr></thead><tbody>` +
          ventasDia.map(v => `<tr><td>${new Date(v.fecha).toLocaleTimeString()}</td><td><span class="badge ok">${v.medio}</span></td><td class="num">$${v.total.toLocaleString()}</td></tr>`).join('') +
          `</tbody></table>`;
      }
    };
    container.appendChild(btn);
  }
}

function cerrarModalMes(){
  document.getElementById('modal-mes-dias').classList.remove('active');
}

function renderAll() {
  const tbodyInv = document.getElementById('tabla-inventario');
  if(inventario.length === 0) {
    tbodyInv.innerHTML = '<tr><td colspan="6" class="empty">No hay productos en el inventario</td></tr>';
  } else {
    tbodyInv.innerHTML = inventario.map(item => {
      const isLow = item.stock <= item.stockMin;
      return `<tr>
        <td><strong>${item.nombre}</strong></td>
        <td class="num">$${(item.costo || 0).toLocaleString()}</td>
        <td class="num">$${item.precio.toLocaleString()}</td>
        <td class="num">${item.stock}</td>
        <td class="num">${item.stockMin}</td>
        <td><span class="badge ${isLow ? 'low' : 'ok'}">${isLow ? 'Stock Bajo' : 'Normal'}</span></td>
      </tr>`;
    }).join('');
  }

  const tbodyFallados = document.getElementById('tabla-fallados');
  if(productosFallados.length === 0) {
    tbodyFallados.innerHTML = '<tr><td colspan="6" class="empty">No hay productos fallados registrados</td></tr>';
  } else {
    tbodyFallados.innerHTML = productosFallados.map(item => {
      return `<tr>
        <td><strong>${item.nombre}</strong></td>
        <td class="num">$${(item.costo || 0).toLocaleString()}</td>
        <td class="num">$${item.precio.toLocaleString()}</td>
        <td class="num">${item.stock}</td>
        <td class="num">${item.stockMin}</td>
        <td><span class="badge fallado">Fallado</span></td>
      </tr>`;
    }).join('');
  }

  const tbodyCompras = document.getElementById('tabla-lista-compras');
  const itemsBajoStock = inventario.filter(i => i.stock <= i.stockMin);
  
  if(itemsBajoStock.length === 0) {
    tbodyCompras.innerHTML = '<tr><td colspan="5" class="empty">¡Excelente! No hay mercadería con bajo stock en este momento.</td></tr>';
  } else {
    tbodyCompras.innerHTML = itemsBajoStock.map(item => {
      const sugerido = Math.max(1, (item.stockMin * 2) - item.stock);
      return `<tr>
        <td><strong>${item.nombre}</strong></td>
        <td class="num" style="color:var(--red); font-weight:700;">${item.stock}</td>
        <td class="num">${item.stockMin}</td>
        <td class="num" style="color:var(--primary-hover); font-weight:700;">+${sugerido}</td>
        <td><span class="badge low">Reponer Urgente</span></td>
      </tr>`;
    }).join('');
  }

  const tablaHistorial = document.getElementById('tabla-historial-ventas');
  if(ventas.length === 0) {
    tablaHistorial.innerHTML = '<tr><td colspan="4" class="empty">No hay ventas registradas</td></tr>';
  } else {
    tablaHistorial.innerHTML = ventas.map(v => `
      <tr>
        <td>${new Date(v.fecha).toLocaleTimeString()} (${new Date(v.fecha).toLocaleDateString()})</td>
        <td><span class="badge ok">${v.medio}</span></td>
        <td class="num">$${v.total.toLocaleString()}</td>
        <td style="text-align: center;"><button class="btn-danger btn-sm" onclick="anularVenta(${v.id})">Anular</button></td>
      </tr>
    `).join('');
  }

  const totalHistorico = ventas.reduce((acc, v) => acc + v.total, 0);
  const ventasHoyTotal = ventas.filter(v => new Date(v.fecha).toDateString() === new Date().toDateString()).reduce((acc, v) => acc + v.total, 0);
  const totalRetiros = gastosCaja.reduce((acc, g) => acc + g.monto, 0);
  const efectivoEnCaja = (ventas.filter(v => v.medio === 'Efectivo').reduce((acc, v) => acc + v.total, 0)) - totalRetiros;

  document.getElementById('dash-venta-total').textContent = `$${totalHistorico.toLocaleString()}`;
  document.getElementById('dash-venta-diaria').textContent = `$${ventasHoyTotal.toLocaleString()}`;
  document.getElementById('dash-venta-mes').textContent = `$${ventasHoyTotal.toLocaleString()}`;
  document.getElementById('dash-bajo-stock').textContent = itemsBajoStock.length;

  document.getElementById('stat-ventas-hoy').textContent = `$${ventasHoyTotal.toLocaleString()}`;
  document.getElementById('stat-ventas-hoy-neto').textContent = `$${ventasHoyTotal.toLocaleString()}`;
  document.getElementById('stat-ventas-mes').textContent = `$${ventasHoyTotal.toLocaleString()}`;

  document.getElementById('caja-stat-saldo').textContent = `$${efectivoEnCaja.toLocaleString()}`;
  document.getElementById('caja-stat-retiros').textContent = `$${totalRetiros.toLocaleString()}`;
  document.getElementById('caja-stat-gastos-mes').textContent = `$${totalRetiros.toLocaleString()}`;

  document.getElementById('cierre-efectivo-box').textContent = `$${efectivoEnCaja.toLocaleString()}`;
  document.getElementById('cierre-gastos-box').textContent = `$${totalRetiros.toLocaleString()}`;

  const tablaGastosCierre = document.getElementById('tabla-cierre-gastos');
  if(gastosCaja.length === 0){
    tablaGastosCierre.innerHTML = '<tr><td colspan="3" class="empty">No hay gastos o retiros registrados en el mes</td></tr>';
  } else {
    tablaGastosCierre.innerHTML = gastosCaja.map(g => `
      <tr>
        <td>${new Date(g.fecha).toLocaleDateString()} ${new Date(g.fecha).toLocaleTimeString()}</td>
        <td><strong>${g.motivo}</strong></td>
        <td class="num" style="color:var(--red); font-weight:700;">-$${g.monto.toLocaleString()}</td>
      </tr>
    `).join('');
  }

  const efec = ventas.filter(v => v.medio === 'Efectivo').reduce((acc, v) => acc + v.total, 0);
  const trans = ventas.filter(v => v.medio === 'Transferencia').reduce((acc, v) => acc + v.total, 0);
  const tarj = ventas.filter(v => v.medio === 'Débito' || v.medio === 'Crédito' || v.medio === 'Mixto').reduce((acc, v) => acc + v.total, 0);

  document.getElementById('dash-medio-efectivo').textContent = `$${efec.toLocaleString()}`;
  document.getElementById('dash-medio-transferencia').textContent = `$${trans.toLocaleString()}`;
  document.getElementById('dash-medio-tarjeta').textContent = `$${tarj.toLocaleString()}`;
}

function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2200);
}
  window.onload = function() {
    // Aquí pon la función que carga tus datos inicialmente
    // Si usas renderAll(), ponla aquí:
    renderAll();
};

// Llamada para inicializar la interfaz al cargar
renderAll();
renderServiciosTecnicos();
renderPromociones();
renderMonthsGrid();
