export type GeographyQuestion={id:string;text:string;options:[string,string,string];correct:0|1|2;explanation:string;visual?:string};
export type GeographyCategory={id:string;title:string;subtitle:string;emoji:string;color:string;questions:GeographyQuestion[]};
type Raw={id:string;title:string;subtitle:string;emoji:string;color:string;data:string};
const raw:Raw[]=[
{id:'atmosfera',title:'La atmósfera y el tiempo',subtitle:'Capas, fenómenos, clima e instrumentos',emoji:'🌤️',color:'sky',data:`
¿Qué es la atmósfera?|La capa de gases que rodea la Tierra|La parte líquida del planeta|La capa sólida de rocas|0|La atmósfera está formada por gases y envuelve nuestro planeta.|
¿Cuál es la capa más cercana a la superficie terrestre?|La estratosfera|La troposfera|La mesosfera|1|La troposfera es la capa inferior y en ella vivimos.|
¿En qué capa se producen la mayoría de los fenómenos meteorológicos?|En la troposfera|En la exosfera|En la termosfera|0|Las nubes, lluvias y vientos habituales se desarrollan en la troposfera.|cloud
¿Qué capa contiene la mayor parte del ozono atmosférico protector?|La mesosfera|La troposfera|La estratosfera|2|La mayor parte del ozono que nos protege de radiación ultravioleta se concentra en la estratosfera.|ozone
¿Qué ocurre con muchos meteoros al entrar en la atmósfera?|Se convierten en lluvia|Se desintegran en la mesosfera|Se quedan flotando en la troposfera|1|La mayoría de los meteoros pequeños se desintegran por el calentamiento durante su entrada atmosférica.|meteor
¿En qué región atmosférica se observan las auroras polares?|Principalmente en la termosfera|En la troposfera|Solo en la exosfera|0|Las auroras se producen en zonas altas de la atmósfera, especialmente en la termosfera.|aurora
¿Cuál es la capa más externa de la atmósfera?|La ionosfera|La estratosfera|La exosfera|2|La exosfera es la región atmosférica más externa, en transición hacia el espacio.|
¿Qué gas es el más abundante en el aire seco?|Oxígeno|Nitrógeno|Dióxido de carbono|1|Aproximadamente el 78 % del aire seco es nitrógeno.|
¿Cuál es el segundo gas más abundante del aire seco?|Oxígeno|Ozono|Metano|0|El oxígeno representa aproximadamente el 21 % del aire seco.|
¿Por qué es fundamental el oxígeno para la mayoría de los seres vivos?|Porque crea todas las nubes|Porque impide los vientos|Porque permite la respiración|2|El oxígeno es necesario para la respiración de muchos seres vivos.|
¿Qué función protectora realiza la atmósfera?|Elimina las estaciones del año|Filtra parte de la radiación solar perjudicial|Detiene todos los terremotos|1|Los gases atmosféricos absorben parte de las radiaciones solares dañinas.|
¿Cómo influye la atmósfera en la temperatura terrestre?|Ayuda a regularla|Hace que sea idéntica todo el año|Evita que exista el invierno|0|La atmósfera ayuda a mantener una temperatura adecuada para la vida.|
¿Qué es el tiempo atmosférico?|El promedio de lluvia de 30 años|La duración del día solar|El estado de la atmósfera en un lugar y momento|2|El tiempo describe condiciones concretas, como la temperatura o la lluvia de hoy.|suncloud
¿Qué es el clima?|El estado del cielo durante una hora|Las condiciones atmosféricas habituales durante muchos años|La intensidad de un solo temporal|1|El clima se estudia a partir de observaciones acumuladas a lo largo de un período extenso.|
Si hoy llueve en Huelva, ¿qué estamos describiendo?|El tiempo atmosférico|La zona climática mundial|La latitud del planeta|0|La lluvia de un día es una situación meteorológica, no la definición del clima.|rain
¿Cuál de estas frases describe el clima y no el tiempo?|Mañana habrá tormenta|Está lloviendo ahora|Los veranos suelen ser secos y calurosos|2|El clima resume los patrones habituales de las estaciones y de muchos años.|
¿Cómo se llama la ciencia que estudia la atmósfera y permite pronosticar el tiempo?|La geología|La meteorología|La cartografía|1|La meteorología analiza la atmósfera y permite elaborar previsiones.|
¿Qué instrumento mide la temperatura del aire?|El termómetro|El barómetro|La veleta|0|El termómetro mide la temperatura, normalmente expresada en grados Celsius.|thermometer
¿Qué instrumento sirve para medir la cantidad de lluvia?|El anemómetro|La brújula|El pluviómetro|2|El pluviómetro recoge y mide las precipitaciones.|raingauge
¿Qué instrumento mide la presión atmosférica?|El higrómetro|El barómetro|El termómetro|1|El barómetro registra la presión ejercida por el aire.|barometer
¿Qué instrumento mide la velocidad del viento?|El anemómetro|La veleta|El pluviómetro|0|El anemómetro permite conocer la velocidad del viento.|anemometer
¿Para qué se utiliza una veleta?|Para medir la lluvia|Para medir la radiación solar|Para indicar la dirección del viento|2|La veleta muestra de dónde sopla el viento.|weathervane
¿Qué instrumento se emplea para medir la humedad del aire?|El barómetro|El higrómetro|El anemómetro|1|El higrómetro mide la humedad atmosférica.|hygrometer
¿Cuál de los siguientes es un elemento del clima?|La temperatura|La latitud|La distancia al mar|0|La temperatura es un elemento medible; la latitud y la distancia al mar son factores.|
¿Por qué necesitamos observaciones de muchos años para describir un clima?|Porque el clima cambia cada minuto|Porque un único día muestra todas las estaciones|Porque un día no representa las condiciones habituales|2|Para conocer el clima se utilizan registros prolongados de temperatura, lluvia y otros elementos.|
`},
{id:'factores',title:'Factores y elementos del clima',subtitle:'Latitud, relieve, lluvia, presión y vientos',emoji:'🌧️',color:'teal',data:`
¿Por qué la zona ecuatorial recibe más calor del Sol?|Porque está más cerca de la Luna|Porque los rayos solares llegan más directamente|Porque desaparece la atmósfera|1|En la zona ecuatorial, los rayos solares inciden más verticalmente.|latitude
¿Qué ocurre normalmente con la temperatura al aumentar la altitud?|Disminuye|Aumenta siempre|No cambia|0|Las zonas elevadas suelen ser más frías que las bajas.|
¿Cuánto desciende aproximadamente la temperatura por cada 100 m de ascenso, según el libro?|2 °C|0,1 °C|0,6 °C|2|El gradiente térmico vertical medio es de unos 0,6 °C por cada 100 metros.|altitude
Si ascendemos 500 m, ¿cuál es el descenso aproximado según ese gradiente?|1 °C|3 °C|8 °C|1|Cinco tramos de 100 metros multiplicados por 0,6 °C dan unos 3 °C.|
¿Cómo influye el mar en las temperaturas de las costas?|Modera las diferencias entre verano e invierno|Hace que no exista el invierno|Siempre aumenta el calor del verano|0|El mar se calienta y enfría más lentamente que la tierra, por lo que suaviza las temperaturas.|coast
¿Dónde suele ser mayor la amplitud térmica anual?|En las pequeñas islas|En la costa inmediata|En el interior de los continentes|2|Lejos del mar suelen existir mayores contrastes entre verano e invierno.|
¿Qué es una solana en una montaña del hemisferio norte?|Una ladera que recibe menos luz|Una ladera orientada al sur que suele recibir más sol|Una montaña siempre cubierta de nieve|1|La orientación sur recibe normalmente más radiación solar directa en el hemisferio norte.|solana
¿Qué se entiende por umbría en una montaña del hemisferio norte?|La ladera orientada al norte y menos soleada|La ladera más cercana al mar|La cima donde sopla más viento|0|La umbría suele ser más fresca y húmeda al recibir menos sol directo.|
¿En qué ladera suele llover cuando llega aire húmedo a una montaña?|En sotavento|En ambas exactamente igual|En barlovento|2|El aire húmedo asciende por barlovento, se enfría y puede condensarse.|orographic
¿Cómo suele ser el aire que desciende por sotavento tras superar una montaña?|Más húmedo y frío siempre|Más seco y cálido|Idéntico al aire de barlovento|1|Al descender, el aire se calienta y puede volverse más seco.|
¿Qué significa amplitud térmica anual?|Diferencia entre medias mensuales máxima y mínima|Temperatura media de todos los meses|Lluvia de todo el año|0|Se resta la temperatura media del mes más frío a la del más cálido.|
Si el mes más cálido tiene 28 °C y el más frío 10 °C, ¿cuál es la amplitud térmica?|38 °C|10 °C|18 °C|2|La amplitud es la diferencia entre las medias del mes más cálido y del más frío: 28 − 10 = 18 °C.|
¿Cómo se expresa habitualmente la precipitación acumulada?|En kilómetros por hora|En milímetros|En grados Celsius|1|La lluvia se mide en milímetros; 1 mm equivale a 1 litro por metro cuadrado.|
¿Cómo se llama el paso de agua líquida a vapor?|Evaporación|Condensación|Precipitación|0|La evaporación transforma agua líquida en vapor.|evaporation
¿Qué proceso forma gotas de agua al enfriarse el vapor?|Transpiración|Evaporación|Condensación|2|El vapor se condensa en gotas diminutas y puede formar nubes.|condensation
¿Cuándo se producen lluvias de convección?|Cuando el mar no tiene olas|Cuando el aire caliente asciende y luego se enfría|Cuando se derrite el hielo del suelo|1|El calentamiento del suelo hace ascender aire húmedo y puede originar precipitaciones.|convection
¿Qué provoca las lluvias de relieve?|El ascenso de aire húmedo por una montaña|La falta total de humedad|La congelación del mar|0|El aire húmedo se enfría al ascender por un relieve.|
¿Cómo se forman las lluvias frontales?|Por la rotación de la Luna|Por la erosión de los ríos|Por el encuentro de masas de aire con distinta temperatura|2|La interacción entre masas de aire cálido y frío genera frentes meteorológicos.|front
¿Qué representa la letra A en el mapa meteorológico del libro?|Una masa de aire polar|Un anticiclón o zona de alta presión|Un frente frío|1|La A indica alta presión y generalmente tiempo estable.|highpressure
¿Qué representa la letra B en ese mapa?|Una borrasca o zona de baja presión|Una brisa marina|Una zona de alta presión|0|La B representa baja presión, frecuente en tiempo inestable.|lowpressure
¿Qué son las isobaras?|Líneas de igual temperatura|Líneas de igual precipitación|Líneas que unen puntos con la misma presión|2|Las isobaras representan la distribución de la presión atmosférica.|isobars
¿Hacia dónde se mueve el aire por la diferencia de presiones, en general?|De la baja a la alta presión|De la alta a la baja presión|Solo del sur al norte|1|Las diferencias de presión impulsan el viento hacia las bajas presiones.|
¿Qué tipo de masa de aire suele ser más cálida?|La tropical|La polar|La ártica|0|Las masas tropicales se originan en regiones más calientes.|
¿Qué rasgo caracteriza a las masas de aire marítimas?|Siempre llevan polvo del desierto|Nunca producen lluvia|Suelen tener más humedad|2|El aire de origen oceánico suele acumular vapor de agua.|
¿Por qué los monzones del sudeste asiático traen lluvias intensas en verano?|Porque desaparecen los océanos|Porque entran vientos húmedos desde el mar hacia tierra|Porque baja aire seco del desierto|1|En verano circula aire húmedo desde el océano Índico y mares próximos hacia el continente.|monsoon
`}
];
raw.push(
{id:'climas',title:'Los climas del mundo y de España',subtitle:'Zonas climáticas, Europa y Andalucía',emoji:'🌍',color:'gold',data:`
¿Cuáles son las tres grandes zonas climáticas de la Tierra?|Cálida, templada y fría|Continental, costera y urbana|Seca, nubosa y tormentosa|0|Las temperaturas medias permiten distinguir zonas cálidas, templadas y frías.|latitude
¿Dónde se sitúa principalmente el clima ecuatorial?|Cerca del ecuador|Junto a los círculos polares|En las cimas de las montañas|0|Las zonas ecuatoriales reciben radiación solar intensa durante todo el año.|rainforest
¿Qué rasgo caracteriza al clima tropical?|Inviernos muy fríos y nevados|Temperaturas cálidas con estación seca y lluviosa|Lluvias de nieve en verano|1|En el clima tropical hace calor todo el año, pero las lluvias suelen concentrarse en una estación.|savanna
¿Cómo son las precipitaciones en el clima desértico?|Abundantes todos los meses|Regulares y frecuentes|Muy escasas|2|Los desiertos tienen un marcado déficit de precipitaciones.|desert
¿Qué clima presenta lluvias bastante regulares y temperaturas suaves cerca del Atlántico europeo?|Oceánico|Desértico|Polar|0|El clima oceánico recibe influencia húmeda y suavizadora del océano.|oceanic
¿Qué verano es típico del clima mediterráneo?|Muy lluvioso y fresco|Caluroso y seco|Siempre nevado|1|En el clima mediterráneo suele existir sequía estival.|
¿Qué caracteriza al clima continental de la zona templada?|Temperaturas casi iguales todo el año|Lluvias torrenciales todos los días|Grandes diferencias entre invierno y verano|2|En el interior de los continentes se acentúa la amplitud térmica anual.|continental
¿Cómo son normalmente las temperaturas en el clima polar?|Muy bajas durante todo el año|Altas en invierno y verano|Suaves gracias al mar tropical|0|Las regiones polares reciben poca energía solar y son muy frías.|polar
¿Qué condiciona de forma decisiva el clima de alta montaña?|La proximidad al ecuador únicamente|La elevada altitud|La presencia de grandes ciudades|1|La temperatura disminuye con la altura y pueden producirse nevadas.|mountain
¿Dónde se localiza principalmente el clima oceánico en España?|En el norte peninsular|En el sudeste desértico|En el centro de Canarias|0|El norte atlántico y cantábrico recibe precipitaciones frecuentes.|oceanic
¿Qué clima predomina en gran parte de la península ibérica?|Ecuatorial|Polar|Mediterráneo|2|Gran parte del territorio peninsular presenta veranos secos mediterráneos.|
¿En qué zona suele haber un clima mediterráneo de interior?|En las mesetas del interior peninsular|Solo en las costas atlánticas|Exclusivamente en las islas|0|El interior tiene contrastes térmicos mayores que las costas.|
¿Dónde es especialmente frecuente el mediterráneo árido en España?|En la cornisa cantábrica|En el sudeste peninsular|En los Pirineos más elevados|1|El sudeste peninsular tiene precipitaciones muy escasas.|desert
¿Por qué el clima canario mantiene temperaturas suaves todo el año?|Por su cercanía al círculo polar|Por nevadas constantes|Por la latitud subtropical y la influencia del océano|2|Las Canarias están cerca del trópico de Cáncer y el mar suaviza sus temperaturas.|
¿A partir de qué altitud indica el libro el clima de alta montaña en España?|Aproximadamente 1500 m|Aproximadamente 50 m|Aproximadamente 200 m|0|El libro sitúa el clima de alta montaña por encima de unos 1500 metros.|mountain
¿Cuántas variedades del clima mediterráneo distingue el libro en Andalucía?|Tres|Cinco|Siete|1|El libro distingue suroccidental, subtropical, subdesértico, continentalizado y alta montaña.|
¿Dónde predomina la variedad mediterránea suroccidental de Andalucía?|En el golfo de Cádiz y parte del valle del Guadalquivir|Solo en Sierra Nevada|Solo en el litoral almeriense|0|Esta variedad caracteriza amplias áreas del suroeste andaluz.|
¿Qué variedad se extiende por el litoral de Málaga y Granada?|La mediterránea subtropical|La mediterránea polar|La mediterránea de alta montaña|0|El litoral sur de Málaga y Granada presenta una variedad subtropical mediterránea.|
¿Qué clima predomina en el litoral de Almería?|Mediterráneo oceánico|Mediterráneo subdesértico|Mediterráneo polar|1|En el litoral almeriense las precipitaciones son muy escasas.|
¿Cómo suele ser el clima mediterráneo continentalizado en el interior andaluz?|De temperaturas siempre iguales|De lluvias abundantes en verano|De contrastes térmicos marcados y lluvias escasas|2|La lejanía del mar permite veranos muy cálidos e inviernos fríos.|
¿Qué variedad aparece en las cordilleras Béticas elevadas?|Mediterráneo de alta montaña|Mediterráneo ecuatorial|Mediterráneo monzónico|0|En las sierras más altas las temperaturas son bajas y puede nevar.|
En un climograma, ¿qué representan normalmente las barras azules?|Las temperaturas medias|Las precipitaciones mensuales|La velocidad del viento|1|Las barras muestran la lluvia o precipitación de cada mes.|climogram
En un climograma, ¿qué suele representar la línea roja?|La temperatura mensual|Las precipitaciones|Las horas de viento|0|La curva representa la variación de la temperatura media mensual.|climogram
Si las temperaturas medias mensuales suman 180 °C, ¿cuál es la media anual?|12 °C|18 °C|15 °C|2|La temperatura media anual es 180 ÷ 12 = 15 °C.|
Si llueve 40 mm cada mes durante 12 meses, ¿cuánta precipitación total anual hay?|400 mm|480 mm|520 mm|1|40 × 12 = 480 mm de precipitación anual.|
`},
{id:'emergencia',title:'Emergencia climática y desastres',subtitle:'Riesgos, calentamiento y cuidado del planeta',emoji:'🌱',color:'coral',data:`
¿Qué es el efecto invernadero natural?|Un proceso que ayuda a conservar el calor necesario para la vida|La destrucción inmediata de toda la atmósfera|Una tormenta que solo ocurre en invernaderos|0|La atmósfera absorbe y emite radiación infrarroja y contribuye a mantener la Tierra caliente.|greenhouse
¿Qué actividad humana emite grandes cantidades de dióxido de carbono?|Cultivar árboles para reforestar|Quemar combustibles fósiles|Aprovechar la energía solar|1|La combustión de petróleo, carbón y gas libera CO₂ a la atmósfera.|
¿Cómo se llama el aumento a largo plazo de la temperatura media del planeta?|Inversión térmica|Frente frío|Calentamiento global|2|El calentamiento global es el aumento sostenido de la temperatura media terrestre.|
¿Qué fenómeno favorece el aumento del nivel medio del mar?|La expansión del agua al calentarse y el deshielo continental|La formación de nubes sin lluvia|La llegada del invierno|0|El agua más caliente ocupa mayor volumen y la fusión de hielo terrestre añade agua al océano.|sealevel
¿Qué efecto tiene el deshielo de los glaciares terrestres sobre el océano?|Reduce siempre el nivel del mar|Contribuye a elevar su nivel|Convierte el mar en agua dulce|1|El hielo continental derretido aporta agua a los océanos.|glacier
¿Qué significa pérdida de biodiversidad?|Tener más días soleados|El aumento constante de todos los animales|La disminución de la variedad de seres vivos|2|La biodiversidad incluye especies, ecosistemas y diversidad genética.|biodiversity
¿Cuál de estos fenómenos puede agravarse por el cambio climático?|Las olas de calor|Los eclipses de Luna|Las fases del Sol|0|Las olas de calor pueden aumentar en intensidad y frecuencia en muchas regiones.|
¿Por qué una ola de calor representa un riesgo para las personas?|Porque cambia las fases lunares|Porque puede causar deshidratación y problemas de salud|Porque evita todos los incendios|1|El calor extremo amenaza especialmente a las personas vulnerables.|heatwave
¿Dónde se originan los huracanes tropicales?|En los desiertos fríos|En las montañas nevadas|Sobre océanos tropicales cálidos|2|Los ciclones tropicales se alimentan de la energía de las aguas oceánicas cálidas.|
¿Qué es el ojo de un huracán?|La zona central de relativa calma|La zona más fría del planeta|El lugar donde nace la nieve|0|El ojo es una zona relativamente tranquila rodeada por la pared del ojo, donde suelen darse vientos muy fuertes.|hurricane
¿Qué provoca una inundación repentina?|Una reducción continua de las lluvias|Lluvias intensas que desbordan cauces o superan el drenaje|Solo temperaturas muy bajas|1|Cuando el agua no puede infiltrarse o evacuarse, puede anegar terrenos y edificios.|flood
¿Qué es una sequía?|Una tormenta tropical|Una lluvia abundante|Un período prolongado de escasez de precipitaciones|2|La sequía implica falta persistente de lluvia respecto a lo habitual en un lugar.|drought
¿Qué consecuencia puede provocar una sequía prolongada?|Pérdida de cosechas y escasez de agua|Aumento automático del agua de los embalses|Más nieve a nivel del mar|0|La falta de agua afecta a la agricultura, al abastecimiento y a los ecosistemas.|
¿Cuál de estas medidas es de mitigación?|Construir casas en zonas inundables|Usar energías renovables para reducir emisiones|Aumentar el consumo de carbón|1|La mitigación intenta reducir las causas del cambio climático.|solar
¿Cuál es el objetivo principal de la adaptación climática?|Producir más gases de efecto invernadero|Impedir la rotación terrestre|Reducir la vulnerabilidad ante los efectos del cambio climático|2|La adaptación prepara a las personas y territorios para afrontar riesgos.|floodwall
¿Qué acción protege mejor una ciudad frente a inundaciones?|Mantener y mejorar los sistemas de drenaje y evitar construir en zonas inundables|Taponar todos los desagües|Eliminar todas las zonas verdes|0|Las infraestructuras y la planificación territorial reducen la exposición al peligro.|
¿Qué recurso natural es especialmente escaso si consideramos solo el agua dulce fácilmente accesible?|El agua potable|El agua salada de los océanos|La arena del desierto|0|La mayor parte del agua planetaria es salada y buena parte de la dulce está congelada o bajo tierra.|
¿Qué porcentaje aproximado del agua del planeta es dulce, según el libro?|25 %|2,5 %|50 %|1|Solo una pequeña fracción, alrededor del 2,5 %, es agua dulce.|
¿Cuál de estas costumbres ayuda a ahorrar agua en casa?|Dejar correr el grifo mientras nos cepillamos|Lavar a mano bajo agua corriente sin parar|Cerrar el grifo al cepillarse los dientes|2|Cerrar el grifo evita gastar agua innecesariamente.|tap
¿Qué práctica ayuda a reducir las emisiones del transporte?|Caminar, usar bicicleta o transporte público cuando sea posible|Hacer todos los trayectos en coche individual|Dejar el motor encendido estando parado|0|Los desplazamientos activos y colectivos suelen reducir emisiones.|bike
¿Por qué conviene proteger los bosques?|Porque evitan para siempre las tormentas|Porque almacenan carbono y albergan biodiversidad|Porque eliminan la necesidad de agua|1|Los bosques absorben CO₂ y mantienen hábitats esenciales.|
¿Cuál es la diferencia principal entre mitigación y adaptación?|Mitigación estudia el mar y adaptación mide el viento|Ambas significan únicamente construir presas|Mitigación reduce causas y adaptación reduce vulnerabilidad|2|Una actúa sobre los factores del cambio climático y la otra sobre sus consecuencias.|
¿Qué consecuencia económica puede tener la reducción de nieve en las estaciones de esquí?|Pérdidas para el turismo de invierno|Aumento garantizado de todos los ingresos|Ninguna consecuencia|0|Menos nieve fiable dificulta la práctica de deportes de invierno y afecta al turismo.|
¿Cuál es un factor humano que puede agravar una inundación?|Restaurar vegetación de ribera|Urbanizar zonas inundables|Conservar bosques|1|Construir en áreas expuestas y sellar suelos puede agravar las inundaciones.|
¿Qué se busca al proteger la biodiversidad ante el cambio climático?|Evitar que existan las estaciones|Aumentar los residuos|Conservar especies y ecosistemas|2|La conservación ayuda a mantener ecosistemas funcionales y resilientes.|
`}
);
function parse(source:Raw):GeographyCategory{
 const lines=source.data.trim().split('\n').map(x=>x.trim()).filter(Boolean);
 if(lines.length!==25)throw new Error('La categoría '+source.id+' debe tener 25 preguntas: '+lines.length);
 const questions=lines.map((line,index)=>{const f=line.split('|');if(f.length!==7||!['0','1','2'].includes(f[4]))throw new Error('Pregunta inválida '+source.id+': '+(index+1));
 return {id:source.id+'-'+String(index+1).padStart(2,'0'),text:f[0],options:[f[1],f[2],f[3]] as [string,string,string],correct:Number(f[4]) as 0|1|2,explanation:f[5],visual:f[6]||undefined};});
 return {id:source.id,title:source.title,subtitle:source.subtitle,emoji:source.emoji,color:source.color,questions};
}
export const geographyCategories:GeographyCategory[]=raw.map(parse);
export const geographyQuestionCount=geographyCategories.reduce((n,c)=>n+c.questions.length,0);
export const geographyVisualCount=geographyCategories.reduce((n,c)=>n+c.questions.filter(q=>q.visual).length,0);
if(geographyQuestionCount!==100||geographyVisualCount!==50)throw new Error('Se necesitan 100 preguntas, 50 ilustradas. Actual: '+geographyQuestionCount+'/'+geographyVisualCount);
