
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

export const printBillTicket = (tableName, items, total, companyInfo = {}, discountPercent = 0, isInvitation = false, ticketNumber = '', customerData = null) => {
    const printWindow = window.open('', '', 'width=400,height=600');

    if (!printWindow) {
        alert('Por favor, permite las ventanas emergentes para imprimir.');
        return;
    }

    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const discountAmount = (total * discountPercent) / 100;
    const finalTotal = isInvitation ? 0 : Math.max(0, total - discountAmount);

    // Tax Breakdown (Spain standard for hospitality: 10%)
    const taxRate = 0.10;
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
                <div class="meta">${companyInfo.businessName || 'BAR RACIONES Y BOCATAS / MANALU EVENTOS'}</div>
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
                    <span>Base Imp. (10%):</span>
                    <span>${baseTotal.toFixed(2)}€</span>
                </div>
                <div class="total-row">
                    <span>IVA (10%):</span>
                    <span>${taxAmount.toFixed(2)}€</span>
                </div>
                <div class="total-row grand-total">
                    <span>TOTAL:</span>
                    <span>${finalTotal.toFixed(2)}€</span>
                </div>
            </div>

            <div class="footer">
                ¡Gracias por su visita!<br>
                www.manalu.es
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
