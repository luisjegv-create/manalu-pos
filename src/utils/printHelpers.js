
export const printKitchenTicket = (tableName, items, note = '') => {
    const printWindow = window.open('', '', 'width=400,height=600');

    if (!printWindow) {
        alert('Por favor, permite las ventanas emergentes para imprimir.');
        return;
    }

    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ticket Cocina - ${tableName}</title>
            <style>
                body {
                    font-family: 'Courier New', Courier, monospace;
                    width: 300px; /* Ancho típico térmica */
                    margin: 0 auto;
                    padding: 10px;
                    color: black;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px dashed black;
                    padding-bottom: 10px;
                    margin-bottom: 10px;
                }
                .title {
                    font-size: 1.2rem;
                    font-weight: bold;
                    margin: 0;
                }
                .meta {
                    font-size: 0.9rem;
                    margin-top: 5px;
                }
                .table-name {
                    font-size: 1.5rem;
                    font-weight: 900;
                    margin: 10px 0;
                    text-align: center;
                    border: 2px solid black;
                    padding: 5px;
                }
                .items {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 15px;
                }
                .item-row {
                    border-bottom: 1px dashed #ccc;
                }
                .qty {
                    font-weight: bold;
                    font-size: 1.2rem;
                    width: 40px;
                    text-align: center;
                    vertical-align: top;
                }
                .name {
                    font-size: 1.1rem;
                    padding-left: 10px;
                    font-weight: bold;
                }
                .note {
                    margin-top: 10px;
                    border-top: 1px solid black;
                    padding-top: 5px;
                    font-style: italic;
                    font-weight: bold;
                }
                @media print {
                    @page { margin: 0; size: auto; }
                    body { margin: 10px; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1 class="title">ORDEN COCINA</h1>
                <div class="meta">${date} - ${time}</div>
            </div>
            
            <div class="table-name">
                ${tableName}
            </div>

            <table class="items">
                ${items.map(item => `
                    <tr class="item-row">
                        <td class="qty">${item.quantity}</td>
                        <td class="name">
                            ${item.name}
                            ${item.selectedModifiers ? `<div style="font-size:0.8rem; font-weight:normal; color: #333;">• ${Object.values(item.selectedModifiers).join(', ')}</div>` : ''}
                            ${item.notes ? `<div style="font-size:0.9rem; font-weight:bold; color: black; background: #eee; padding: 2px;">NOTA: ${item.notes}</div>` : ''}
                        </td>
                    </tr>
                `).join('')}
            </table>

            ${note ? `<div class="note">NOTA: ${note}</div>` : ''}

            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 500);
                }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};

import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const printDepositTicket = (depositData, companyInfo = {}) => {
    const printWindow = window.open('', '', 'width=400,height=600');

    if (!printWindow) {
        alert('Por favor, permite las ventanas emergentes para imprimir.');
        return;
    }

    const date = format(new Date(), 'dd/MM/yyyy', { locale: es });
    const time = format(new Date(), 'HH:mm', { locale: es });

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Recibo de Depósito - ${depositData.customerName}</title>
            <style>
                body {
                    font-family: 'Courier New', Courier, monospace;
                    width: 300px;
                    margin: 0 auto;
                    padding: 10px;
                    color: black;
                }
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .company-name {
                    font-size: 1.2rem;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                .meta {
                    font-size: 0.8rem;
                    margin-bottom: 5px;
                    color: #333;
                }
                .separator {
                    border-bottom: 1px dashed black;
                    margin: 10px 0;
                }
                .title {
                    font-size: 1.1rem;
                    font-weight: bold;
                    margin-bottom: 10px;
                    text-align: center;
                }
                .details {
                    font-size: 0.9rem;
                    margin-bottom: 15px;
                }
                .details div {
                    margin-bottom: 3px;
                }
                .amount {
                    font-size: 1.5rem;
                    font-weight: bold;
                    text-align: center;
                    margin-top: 15px;
                    padding: 10px 0;
                    border-top: 2px solid black;
                    border-bottom: 2px solid black;
                }
                .footer {
                    text-align: center;
                    margin-top: 20px;
                    font-size: 0.8rem;
                }
                @media print {
                    @page { margin: 0; size: auto; }
                    body { margin: 10px; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-name">${companyInfo.name || 'Luis Jesus García-Valcárcel López-Tofiño'}</div>
                <div class="meta">${companyInfo.businessName || 'TAPAS Y BOCATAS / MANALU EVENTOS'}</div>
                <div class="meta">${companyInfo.address || 'C/ Principal 123'}</div>
                <div class="meta">NIF/CIF: ${companyInfo.nif || companyInfo.cif || '12345678A'}</div>
                <div class="separator"></div>
                <div class="title">${depositData.type === 'payment' ? 'RECIBO DE DEPÓSITO' : 'DEVOLUCIÓN DE DEPÓSITO'}</div>
                <div class="meta">
                    FECHA: ${date} - ${time}
                </div>
                <div class="separator"></div>
            </div>

            <div class="details">
                <div><strong>Nº Recibo:</strong> ${depositData.receiptNumber || 'N/A'}</div>
                <div><strong>Cliente:</strong> ${depositData.customerName}</div>
                <div><strong>Concepto:</strong> ${depositData.concept}</div>
                ${depositData.notes ? `<div><strong>Notas:</strong> ${depositData.notes}</div>` : ''}
            </div>

            <div class="amount">
                ${depositData.type === 'payment' ? 'IMPORTE RECIBIDO:' : 'IMPORTE DEVUELTO:'} ${depositData.amount.toFixed(2)}€
            </div>

            <div class="footer">
                ${depositData.type === 'payment' ? 'Gracias por su confianza.' : 'Devolución procesada correctamente.'}<br>
                www.tapasybocatas.es<br>
                www.manalueventos.com
            </div>

            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 500);
                }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};

export const printBillTicket = (tableName, items, total, companyInfo = {}, discountPercent = 0, isInvitation = false, ticketNumber = '', customerData = null, taxRateOverride = null) => {
    const printWindow = window.open('', '', 'width=400,height=600');

    if (!printWindow) {
        alert('Por favor, permite las ventanas emergentes para imprimir.');
        return;
    }

    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const discountAmount = (total * discountPercent) / 100;
    const finalTotal = isInvitation ? 0 : Math.max(0, total - discountAmount);

    // Tax Breakdown (Spain standard for hospitality: 10%, Rental: 21%)
    const taxRate = taxRateOverride !== null ? taxRateOverride : 0.10;
    const baseTotal = finalTotal / (1 + taxRate);
    const taxAmount = finalTotal - baseTotal;

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ticket - ${tableName}</title>
            <style>
                body {
                    font-family: 'Courier New', Courier, monospace;
                    width: 300px;
                    margin: 0 auto;
                    padding: 10px;
                    color: black;
                }
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .company-name {
                    font-size: 1.2rem;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                .meta {
                    font-size: 0.8rem;
                    margin-bottom: 5px;
                    color: #333;
                }
                .separator {
                    border-bottom: 1px dashed black;
                    margin: 10px 0;
                }
                .items-table {
                    width: 100%;
                    font-size: 0.9rem;
                    margin-bottom: 10px;
                }
                .item-row td {
                    padding: 2px 0;
                }
                .qty { width: 30px; text-align: center; }
                .name { text-align: left; }
                .price { text-align: right; }
                
                .totals {
                    margin-top: 10px;
                    border-top: 2px solid black;
                    padding-top: 5px;
                }
                .total-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.9rem;
                    margin-bottom: 2px;
                }
                .discount-row {
                    color: #d32f2f;
                    font-style: italic;
                    border-top: 1px dashed #ccc;
                    padding-top: 5px;
                    margin-bottom: 5px;
                }
                .grand-total {
                    font-size: 1.5rem;
                    font-weight: bold;
                    margin-top: 5px;
                }
                .footer {
                    text-align: center;
                    margin-top: 20px;
                    font-size: 0.8rem;
                }
                @media print {
                    @page { margin: 0; size: auto; }
                    body { margin: 10px; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-name">${companyInfo.name || 'Luis Jesus García-Valcárcel López-Tofiño'}</div>
                <div style="font-size: 0.7rem; color: #666; margin-bottom: 5px;">Razón Social</div>
                <div class="meta">${companyInfo.businessName || 'TAPAS Y BOCATAS / MANALU EVENTOS'}</div>
                <div class="meta">${companyInfo.address || 'C/ Principal 123'}</div>
                <div class="meta">NIF/CIF: ${companyInfo.nif || companyInfo.cif || '12345678A'}</div>
                <div class="separator"></div>
                <div style="font-weight: bold; font-size: 1.1rem; margin-bottom: 5px;">
                    ${customerData ? 'FACTURA' : 'TICKET'} Nº: ${ticketNumber || 'BORRADOR'}
                </div>
                
                ${customerData ? `
                    <div style="text-align: left; background: #eee; padding: 5px; margin-bottom: 10px; font-size: 0.8rem; border: 1px solid #ccc;">
                        <div style="font-weight: bold; text-decoration: underline; margin-bottom: 3px;">DATOS DEL CLIENTE:</div>
                        <div>${customerData.name}</div>
                        <div>NIF/CIF: ${customerData.nif}</div>
                        <div>DOMICILIO: ${customerData.address}</div>
                    </div>
                ` : ''}

                <div class="meta">
                    MESA: ${tableName} <br>
                    FECHA: ${date} - ${time}
                </div>
                <div class="separator"></div>
            </div>

            <table class="items-table">
                <tr style="font-weight:bold; font-size:0.8rem;">
                    <td class="qty">Cant</td>
                    <td class="name">Prod</td>
                    <td class="price">Tot</td>
                </tr>
                ${items.map(item => `
                    <tr class="item-row">
                        <td class="qty">${item.quantity}</td>
                        <td class="name">
                            ${item.name}
                            ${item.notes ? `<div style="font-size:0.7rem; font-style:italic;">(${item.notes})</div>` : ''}
                        </td>
                        <td class="price">${(item.price * item.quantity).toFixed(2)}€</td>
                    </tr>
                `).join('')}
            </table>

            <div class="totals">
                <div class="total-row">
                    <span>Subtotal Orig:</span>
                    <span>${total.toFixed(2)}€</span>
                </div>
                
                ${(discountPercent > 0 || isInvitation) ? `
                    <div class="total-row discount-row">
                        <span>DESC ${isInvitation ? '(100%)' : '(' + discountPercent + '%)'}:</span>
                        <span>-${(isInvitation ? total : discountAmount).toFixed(2)}€</span>
                    </div>
                ` : ''}

                <div class="total-row">
                    <span>Base Imp. (${(taxRate * 100).toFixed(0)}%):</span>
                    <span>${baseTotal.toFixed(2)}€</span>
                </div>
                <div class="total-row">
                    <span>IVA (${(taxRate * 100).toFixed(0)}%):</span>
                    <span>${taxAmount.toFixed(2)}€</span>
                </div>
                <div class="total-row grand-total">
                    <span>TOTAL:</span>
                    <span>${finalTotal.toFixed(2)}€</span>
                </div>
            </div>

            <div class="footer">
                ¡Gracias por su visita!<br>
                www.tapasybocatas.es<br>
                www.manalueventos.com
            </div>

            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 500);
                }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};

export const printA4Invoice = (event, companyInfo = {}) => {
    const printWindow = window.open('', '', 'width=800,height=1000');

    if (!printWindow) {
        alert('Por favor, permite las ventanas emergentes para imprimir.');
        return;
    }

    const date = format(new Date(event.date), 'dd/MM/yyyy', { locale: es });
    const issueDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es });

    // Calculate totals
    const taxRate = event.taxRate || 0.10;
    const total = event.total || 0;
    const baseAmount = total / (1 + taxRate);
    const taxAmount = total - baseAmount;

    // Prepare items list
    let itemsHtml = '';
    if (event.isVenueOnly) {
        itemsHtml = `
            <tr>
                <td style="padding: 10px; border: 1px solid #eee;">1</td>
                <td style="padding: 10px; border: 1px solid #eee;">ALQUILER DE LOCAL / ESPACIO</td>
                <td style="padding: 10px; border: 1px solid #eee; text-align: right;">${(event.venuePrice || 0).toFixed(2)}€</td>
                <td style="padding: 10px; border: 1px solid #eee; text-align: right;">${(event.venuePrice || 0).toFixed(2)}€</td>
            </tr>
        `;
    } else if (event.selectedMenus && event.selectedMenus.length > 0) {
        itemsHtml = event.selectedMenus.map(m => `
            <tr>
                <td style="padding: 10px; border: 1px solid #eee;">${m.quantity}</td>
                <td style="padding: 10px; border: 1px solid #eee;">SERVICIO DE CATERING / MENÚ: ${m.name || 'Menú Evento'}</td>
                <td style="padding: 10px; border: 1px solid #eee; text-align: right;">${(m.price || 0).toFixed(2)}€</td>
                <td style="padding: 10px; border: 1px solid #eee; text-align: right;">${((m.price || 0) * m.quantity).toFixed(2)}€</td>
            </tr>
        `).join('');
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Factura ${event.invoiceNumber || 'Borrador'}</title>
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 40px;
                }
                .invoice-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 40px;
                    border-bottom: 2px solid #f4f4f4;
                    padding-bottom: 20px;
                }
                .company-info h1 {
                    margin: 0;
                    color: #1a1a1a;
                    font-size: 24px;
                }
                .invoice-title {
                    text-align: right;
                }
                .invoice-title h2 {
                    margin: 0;
                    color: #2563eb;
                    font-size: 28px;
                }
                .details-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 40px;
                    margin-bottom: 40px;
                }
                .section-title {
                    font-weight: bold;
                    text-transform: uppercase;
                    font-size: 12px;
                    color: #666;
                    margin-bottom: 10px;
                    border-bottom: 1px solid #eee;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                }
                th {
                    background: #f8fafc;
                    text-align: left;
                    padding: 12px 10px;
                    border: 1px solid #eee;
                    font-size: 13px;
                }
                .totals-table {
                    width: 250px;
                    margin-left: auto;
                }
                .totals-table td {
                    padding: 8px 10px;
                }
                .grand-total {
                    font-size: 18px;
                    font-weight: bold;
                    background: #2563eb;
                    color: white;
                }
                .footer {
                    margin-top: 60px;
                    font-size: 11px;
                    color: #999;
                    text-align: center;
                    border-top: 1px solid #eee;
                    padding-top: 20px;
                }
                @media print {
                    body { padding: 0; margin: 0; }
                    @page { size: A4; margin: 1cm; }
                }
            </style>
        </head>
        <body>
            <div class="invoice-header">
                <div class="company-info">
                    <h1>${companyInfo.name || 'Luis Jesus García-Valcárcel López-Tofiño'}</h1>
                    <p>
                        ${companyInfo.businessName || 'TAPAS Y BOCATAS / MANALU EVENTOS'}<br>
                        ${companyInfo.address || 'C/ Principal 123'}<br>
                        NIF/CIF: ${companyInfo.nif || companyInfo.cif || '12345678A'}<br>
                        Tel: ${companyInfo.phone || '600 000 000'}
                    </p>
                </div>
                <div class="invoice-title">
                    <h2>FACTURA</h2>
                    <p>
                        <strong>Nº:</strong> ${event.invoiceNumber || 'BORRADOR'}<br>
                        <strong>Fecha Emisión:</strong> ${issueDate}
                    </p>
                </div>
            </div>

            <div class="details-grid">
                <div>
                    <div class="section-title">CLIENTE / RECEPTOR</div>
                    <p>
                        <strong>${event.name}</strong><br>
                        ${event.clientNif ? `NIF/CIF: ${event.clientNif}<br>` : ''}
                        ${event.clientAddress ? `${event.clientAddress}` : ''}
                    </p>
                </div>
                <div>
                    <div class="section-title">DETALLES DEL EVENTO</div>
                    <p>
                        <strong>Fecha Evento:</strong> ${date}<br>
                        <strong>Asistentes:</strong> ${event.guests} pax<br>
                        <strong>Tipo:</strong> ${event.isVenueOnly ? 'Solo Alquiler' : 'Evento con Menú'}
                    </p>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 60px;">Cant.</th>
                        <th>Descripción / Concepto</th>
                        <th style="text-align: right; width: 100px;">P. Unitario</th>
                        <th style="text-align: right; width: 100px;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <table class="totals-table">
                <tr>
                    <td>Base Imponible:</td>
                    <td style="text-align: right;">${baseAmount.toFixed(2)}€</td>
                </tr>
                <tr>
                    <td>IVA (${(taxRate * 100).toFixed(0)}%):</td>
                    <td style="text-align: right;">${taxAmount.toFixed(2)}€</td>
                </tr>
                <tr class="grand-total">
                    <td>TOTAL:</td>
                    <td style="text-align: right;">${total.toFixed(2)}€</td>
                </tr>
            </table>

            ${event.depositAmount > 0 ? `
                <div style="margin-top: 20px; font-size: 13px; color: #666; font-style: italic;">
                    Nota: Se ha tenido en cuenta el depósito previo de ${event.depositAmount.toFixed(2)}€ 
                    (${event.depositStatus === 'paid' ? 'COBRADO' : 'PENDIENTE'}).
                </div>
            ` : ''}

            <div class="footer">
                De acuerdo con la Ley de Protección de Datos (RGPD)...<br>
                Gracias por confiar en Manalú Eventos por Tapas y Bocatas.<br>
                www.manalueventos.com | www.tapasybocatas.es
            </div>

            <script>
                window.onload = function() {
                    window.print();
                    // window.close(); // Optional: close after print
                }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};

export const printRestockList = (items) => {
    const printWindow = window.open('', '', 'width=800,height=600');

    if (!printWindow) {
        alert('Por favor, permite las ventanas emergentes para imprimir.');
        return;
    }

    const date = new Date().toLocaleDateString();

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Lista de Reposición</title>
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    margin: 20px;
                    color: black;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid black;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                }
                tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                .critical {
                    color: red;
                    font-weight: bold;
                }
                @media print {
                    @page { margin: 2cm; }
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Lista de Reposición</h1>
                <p>Fecha: ${date}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Ingrediente</th>
                        <th>Stock Actual</th>
                        <th>Stock Crítico</th>
                        <th>Proveedor</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td class="critical">${item.quantity} ${item.unit || ''}</td>
                            <td>${item.critical || 5} ${item.unit || ''}</td>
                            <td>${item.provider || 'Sin asignar'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 500);
                }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};

export const printCashCloseTicket = (closeData, companyInfo = {}) => {
    const printWindow = window.open('', '', 'width=400,height=600');

    if (!printWindow) {
        alert('Por favor, permite las ventanas emergentes para imprimir.');
        return;
    }

    const date = new Date(closeData.date || new Date()).toLocaleDateString();
    const time = new Date(closeData.date || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>CIERRE Z - ${date}</title>
            <style>
                body {
                    font-family: 'Courier New', Courier, monospace;
                    width: 300px;
                    margin: 0 auto;
                    padding: 10px;
                    color: black;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid black;
                    padding-bottom: 10px;
                    margin-bottom: 15px;
                }
                .title {
                    font-size: 1.4rem;
                    font-weight: bold;
                    margin: 0;
                }
                .meta {
                    font-size: 0.9rem;
                    margin-top: 5px;
                }
                .section {
                    margin-bottom: 15px;
                    border-bottom: 1px dashed #666;
                    padding-bottom: 10px;
                }
                .row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 5px;
                    font-size: 1rem;
                }
                .label { font-weight: normal; }
                .value { font-weight: bold; }
                .total-row {
                    border-top: 2px solid black;
                    margin-top: 5px;
                    padding-top: 5px;
                    font-size: 1.2rem;
                }
                .footer {
                    text-align: center;
                    margin-top: 20px;
                    font-size: 0.8rem;
                    font-style: italic;
                }
                @media print {
                    @page { margin: 0; size: auto; }
                    body { margin: 10px; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div style="font-weight: bold; font-size: 1rem; margin-bottom: 5px;">
                    ${companyInfo.name || 'TAPAS Y BOCATAS'}
                </div>
                <h1 class="title">CIERRE DE CAJA (Z)</h1>
                <div class="meta">FECHA: ${date}</div>
                <div class="meta">HORA: ${time}</div>
            </div>

            <div class="section">
                <div class="row">
                    <span class="label">Tickets Emitidos:</span>
                    <span class="value">${closeData.salesCount || 0}</span>
                </div>
            </div>

            <div class="section">
                <div class="row">
                    <span class="label">Total Tarjeta:</span>
                    <span class="value">${(closeData.tarjeta || 0).toFixed(2)}€</span>
                </div>
                <div class="row">
                    <span class="label">Total Efectivo:</span>
                    <span class="value">${(closeData.efectivo || 0).toFixed(2)}€</span>
                </div>
                <div class="row total-row">
                    <span class="label">TOTAL VENTAS:</span>
                    <span class="value">${(closeData.total || 0).toFixed(2)}€</span>
                </div>
            </div>

            ${closeData.notes ? `
                <div class="section">
                    <div style="font-size: 0.8rem; font-weight: bold; margin-bottom: 5px;">OBSERVACIONES:</div>
                    <div style="font-size: 0.8rem;">${closeData.notes}</div>
                </div>
            ` : ''}

            <div class="footer">
                Reporte generado por Manalu TPV<br>
                ${new Date().toLocaleString()}
            </div>

            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 500);
                }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};
