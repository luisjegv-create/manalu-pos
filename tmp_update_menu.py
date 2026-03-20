import re
import codecs

with codecs.open("src/pages/PrintableMenu.jsx", "r", "utf-8") as f:
    content = f.read()

# 1. Update PrintItem
old_print_item = """        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fcd34d', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', marginTop: '0.1rem' }}>
            {item.isGrouped ? (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    {item.priceMontado != null && <span>Montado: {item.priceMontado.toFixed(2)}€</span>}
                    {item.priceBocata != null && <span>Bocata: {item.priceBocata.toFixed(2)}€</span>}
                </div>
            ) : (
                `${item.price.toFixed(2)}€`
            )}
        </div>"""

new_print_item = """        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fcd34d', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', marginTop: '0.1rem' }}>
            {item.isGrouped ? (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                    {item.priceBocata != null && <span>Bocata {item.priceBocata.toFixed(2).replace(/\.00$/, '')}€</span>}
                    {item.priceBocata != null && item.priceMontado != null && <span>/</span>}
                    {item.priceMontado != null && <span>Montado {item.priceMontado.toFixed(2).replace(/\.00$/, '')}€</span>}
                </div>
            ) : (
                `${item.price.toFixed(2).replace(/\.00$/, '')}€`
            )}
        </div>"""

content = content.replace(old_print_item, new_print_item)

# 2. Remove vinos calculation
old_wines = """    // --- PAGE 3: Vinos y Vermuts ---
    const vinosBlancos = visibleWines.filter(w => norm(w.subcategory).includes('blanco') || norm(w.type).includes('blanco'));
    const vinosTintos = visibleWines.filter(w => norm(w.subcategory).includes('tinto') || norm(w.type).includes('tinto') || (!norm(w.subcategory).includes('blanco') && !norm(w.type).includes('blanco'))); // Fallback for unspecified
    
    const vermuts = visibleProducts.filter(p => {
        const cat = norm(p.category);
        const sub = norm(p.subcategory);
        return cat.includes('vermut') || sub.includes('vermut');
    });"""

new_wines = """    // Vinos quitados de la carta impresa por petición de usuario"""
content = content.replace(old_wines, new_wines)

# 3. Replace page rendering logic
# Using regex to capture from {/* PAGE 1 */} to just before {/* ANNEXES
old_pages_pattern = re.compile(r"                    \{\/\* PAGE 1 \*\/\}.*?(?=                    \{\/\* ANNEXES)", re.DOTALL)

new_pages = """                    {/* PAGE 1 */}
                    <div className="print-page dark-wood-bg" style={{ overflow: 'hidden', pageBreakAfter: 'always' }}>
                        <div className="gold-border" style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: '1rem', padding: '0.8cm 0.5cm' }}>
                            {/* Columna Izquierda: Frías */}
                            <div>
                                {racionesFrias.length > 0 && (
                                    <>
                                        <SectionTitle title="RACIONES FRÍAS" />
                                        {racionesFrias.map(item => <PrintItem key={item.id} item={item} />)}
                                    </>
                                )}
                            </div>
                            
                            {/* Separador Vertical */}
                            <div style={{ background: '#fbbf24', opacity: 0.5, margin: '1rem 0' }}></div>

                            {/* Columna Derecha: Calientes */}
                            <div>
                                {racionesCalientes.length > 0 && (
                                    <>
                                        <SectionTitle title="RACIONES CALIENTES" />
                                        {racionesCalientes.map(item => <PrintItem key={item.id} item={item} />)}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* PAGE 2 */}
                    <div className="print-page dark-wood-bg" style={{ overflow: 'hidden', pageBreakAfter: 'always' }}>
                        <div className="gold-border">
                            {bocatasAgrupados.length > 0 && (
                                <>
                                    <SectionTitle title="BOCATAS" />
                                    <div style={{ textAlign: 'center', color: '#fbbf24', fontStyle: 'italic', marginBottom: '1rem', opacity: 0.9 }}>
                                        (Todos los bocatas se sirven en pan artesanal de obrador local)
                                    </div>
                                    {bocatasAgrupados.map(item => <PrintItem key={item.id} item={item} />)}
                                    <Separator />
                                </>
                            )}
                            
                            {hamburguesas.length > 0 && (
                                <>
                                    <SectionTitle title="HAMBURGUESAS" />
                                    {hamburguesas.map(item => <PrintItem key={item.id} item={item} />)}
                                    <Separator />
                                </>
                            )}
                            
                            {infantiles.length > 0 && (
                                <>
                                    <SectionTitle title="PLATOS INFANTILES" />
                                    {infantiles.map(item => <PrintItem key={item.id} item={item} />)}
                                    <Separator />
                                </>
                            )}

                            {postres.length > 0 && (
                                <>
                                    <SectionTitle title="POSTRES" />
                                    {postres.map(item => <PrintItem key={item.id} item={item} />)}
                                </>
                            )}
                        </div>
                    </div>
"""

content = old_pages_pattern.sub(new_pages, content)

with codecs.open("src/pages/PrintableMenu.jsx", "w", "utf-8") as f:
    f.write(content)
print("SUCCESS")
