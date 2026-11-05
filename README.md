# NEXO — Design + TI

Protótipo de embalagem inteligente e inclusiva desenvolvido para o Hackathon de 05/11/2026.

## Proposta

Uma embalagem física com identidade tátil/visual e QR Code para um rótulo digital adaptável. A prova de conceito usa um alimento **fictício** de cacau e aveia de 45 g, com ingredientes ilustrativos.

## Demonstração

1. Mostre a planificação impressa e o mockup da embalagem.
2. Escaneie o QR do modelo, abrindo a seção de experiência no celular.
3. Alterne entre leitura padrão, ampliada e alto contraste.
4. Marque “Amendoim” e demonstre o alerta correspondente.
5. Toque em “Ouvir rótulo” e demonstre a narração pelo navegador.

## Construção

- `dist/index.html` — site sem dependências de build.
- `dist/style.css` — design responsivo.
- `dist/app.js` — personalização e síntese de fala, sem backend.
- `dist/assets/nexo-planificacao.pdf` — embalagem planificada em A4 paisagem.
- `dist/assets/nexo-qr.svg` — QR escaneável para o protótipo.

## Limites honestos

O protótipo não valida alegações alimentares, não mede alérgenos, não usa inteligência artificial e não é uma certificação formal de acessibilidade. Para produtos reais, as informações devem vir de fabricantes validados e cumprir a legislação vigente.
