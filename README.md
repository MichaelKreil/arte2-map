# German

Für die Visualisierung unter <http://future.arte.tv/de/datenpakete-auf-reisen> mussten wir herausfinden, wie der Internetverkehr durch Europa verläuft. Dafür haben wir **[RIPE Atlas](https://atlas.ripe.net)** von [RIPE](http://de.wikipedia.org/wiki/RIPE_Network_Coordination_Centre) verwendet. Was das genau ist, wird [hier erklärt](https://atlas.ripe.net/about/).

## 25.000 Traceroutes

Von den über 8000 Probes haben wir 285 Probes in Europa ausgewählt. Damit die Auswahl halbwegs repräsentativ ist, fließen Bevölkerungsanzahl der europäischen Länder und Größe der ISPs ein.

Von diesen 285 Probes haben wir **über 25.000 Traceroutes quer durch Europa** durchgeführt. Die jeweiligen Resultate sind öffentlich einsehbar und können runtergeladen werden:

* Europa: [14.000 Traceroutes mit 118 Probes](https://atlas.ripe.net/measurements/?search=Measurement+2015-04-05T15%3A56%3A49+to)
* Deutschland: [6.600 Traceroutes mit 81 Probes](https://atlas.ripe.net/measurements/?search=Measurement+2015-04-05T17%3A12%3A13+to)
* Frankreich: [4.400 Traceroutes mit 66 Probes](https://atlas.ripe.net/measurements/?search=Measurement+2015-04-05T17%3A27%3A28+to)
* Schweiz: [400 Traceroutes mit 20 Probes](https://atlas.ripe.net/measurements/?search=Measurement+2015-04-05T18%3A00%3A52+to)

Außerdem befinden sie sich in den `data/arte2-??/measurements.json`.

## ASNs

Die Traceroutes wurden geparst. Die IP-Adressen wurden in die jeweilige ASN übersetzt. Dafür haben wir die [API von CYMRU](http://www.team-cymru.org/IP-ASN-mapping.html) verwendet, weil sie am schnellsten ist und "bulk queries" unterstützt.

Die Ergebnisse davon sind in `data/arte2-??/result.json` und sind für alle 4 Regionen zusammengefasst in `web/assets/data/data.js`.

## Karte

Die Karte stammt aus einer Wikipedia-SVG-Karte von Europa, die mit einem eigenen node.js-Tool von SVG in JSON umgewandelt wurde: `web/assets/data/map.js`. Polygone, die Ländern entsprechen, sind unten gesondert aufgelistet. `"negative"` sind die Polygone, die Löcher darstellen (Seen etc.).

## Frontend

Die Karte wird in zwei Canvas gezeichnet. Im Hintergrund ist nur die Europakarte. Im Vordergrund sind die Kreise, Punkte und Datenpakete. Grund dafür: Ich hoffe, dadurch etwas CPU einzusparen, dass bei jeden Animationsschritt nicht die komplette Europakarte neu gemalt werden muss.

Die Position der AS (Provider, dargestellt als schwarze Punkte) wird mit `d3.layout.force` berechnet. In jedem `tick` werden aber zusätzliche Kräfte hinzugefügt, die die Punkte zu ihrem jeweiligen Land ziehen.

Alles andere ist irgendwie gefiddelt, weil man ja immer Zeitdruck hat ... u know ...

Danke nochmal an Lisa Rost ([GitHub](https://github.com/lisacharlotterost), [Blog](http://lisacharlotterost.github.io), [Twitter](https://twitter.com/lisacrost))! Sie hat mir dabei sehr geholfen, dass dieses komplexe Thema trotzdem in einem einfachen, schicken Design präsentiert wird.

Außerdem natürlich noch großen Dank an [Sylke Gruhnwald](https://twitter.com/sylkegruhnwald) vom [SRF](http://www.srf.ch) und [Kay Meseberg](https://twitter.com/Meseberg) von [ARTE Future](http://future.arte.tv) für Ideen, Texte, Unterstützung, Geduld und Nerven! :)

# English

For the visualization on <http://future.arte.tv/en/travelling-data-packets> we had to figure out how the Internet traffic passes through Europe. We used **[RIPE Atlas](https://atlas.ripe.net)** from [RIPE](http://de.wikipedia.org/wiki/RIPE_Network_Coordination_Centre) to make thousands of traceroutes. More on RIPE Atlas: [here](https://atlas.ripe.net/about/).

## 25,000 Traceroutes

Of the 8,000 Atlas probes, we selected 285 probes in Europe. To make the selection fairly representative we incorporated population number of the European countries and the size of the ISPs.

Of these 285 probes, we performed more than 25,000 trace routes through Europe. The measurement results are publicly available and can be downloaded:

* Europe: [14.000 trace routes with 118 probes](https://atlas.ripe.net/measurements/?search=Measurement+2015-04-05T15%3A56%3A49+to)
* Germany: [6,600 Traceroutes with 81 probes](https://atlas.ripe.net/measurements/?search=Measurement+2015-04-05T17%3A12%3A13+to)
* France: [4400 Traceroutes with 66 probes](https://atlas.ripe.net/measurements/?search=Measurement+2015-04-05T17%3A27%3A28+to)
* Switzerland: [400 trace routes with 20 probes](https://atlas.ripe.net/measurements/?search=Measurement+2015-04-05T18%3A00%3A52+to)

They are also located in the `data/arte2-??/measurements.json`.

## ASNs

The traceroutes have been parsed. The IP addresses are translated into ASN. We used the [CYMRU API](http://www.team-cymru.org/IP-ASN-mapping.html) because it is the fastest we could find and supports "bulk queries".

The results thereof are in the `data/arte2-??/result.json` and are merged in to one file: `web/assets/data/data.js`.

## Map

The Map is a Wikipedia SVG map of Europe, which has been converted into JSON with a simple node.js tool: `web/assets/data/map.js`. Polygons of countries are listed separately below. `"Negative"` are the polygons that represent holes (lakes, etc.).

## Front End

The map is drawn on two canvases. In the background is the map of Europe. In the foreground are the circles, dots and data packets. Reason: I hope to save some CPU time, otherwise I need to repaint the complete map of Europe in each animation step.

The position of the AS (providers, shown as black dots) is calculated with `d3.layout.force`. But additional forces are added in each `tick` to pull the dots to their countries.

Everything else is somehow fiddled ... time pressure ... u know ...

Thanks to Lisa Rost ([GitHub](https://github.com/lisacharlotterost), [Blog](http://lisacharlotterost.github.io), [Twitter](https://twitter.com/lisacrost))! She has helped me a lot to present this complex issue in a simple, neat design.

In addition, of course, many thanks to [Sylke Gruhnwald](https://twitter.com/sylkegruhnwald) of [SRF](http://www.srf.ch) and [Kay Meseberg](https://twitter.com/ meseberg) of [ARTE Future](http://future.arte.tv) for their ideas, texts, support, patience and nerves! :)